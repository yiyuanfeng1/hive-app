const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// Lets local development use .env without an additional package.
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'hive.json');
const SESSION_SECRET = process.env.SESSION_SECRET || 'development-only-change-before-deploying';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const SIX_HOURS = 6 * 60 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], verificationCodes: [], sessions: [] }, null, 2));

function database() {
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  db.users ||= []; db.verificationCodes ||= []; db.sessions ||= [];
  return db;
}
function save(db) { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
function safeEqual(a, b) {
  const aBuffer = Buffer.from(a); const bBuffer = Buffer.from(b);
  return aBuffer.length === bBuffer.length && crypto.timingSafeEqual(aBuffer, bBuffer);
}
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function validPassword(password, stored) {
  const [salt] = stored.split(':');
  return safeEqual(hashPassword(password, salt), stored);
}
function hashCode(email, code) { return crypto.createHash('sha256').update(`${email}:${code}:${SESSION_SECRET}`).digest('hex'); }
function newCode() { return crypto.randomInt(100000, 1000000).toString(); }
function json(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(JSON.stringify(body));
}
function parseCookies(request) {
  return Object.fromEntries((request.headers.cookie || '').split(';').filter(Boolean).map((part) => {
    const index = part.indexOf('='); return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))];
  }));
}
function createSession(db, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  db.sessions = db.sessions.filter((session) => session.expiresAt > Date.now());
  db.sessions.push({ tokenHash: crypto.createHash('sha256').update(token).digest('hex'), userId, expiresAt: Date.now() + SIX_HOURS });
  return token;
}
function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => { body += chunk; if (body.length > 20_000) request.destroy(); });
    request.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('Invalid JSON body.')); } });
    request.on('error', reject);
  });
}
function normalizeEmail(value) { return String(value || '').trim().toLowerCase(); }
function isEduEmail(email) { return /^[^\s@]+@[^\s@]+\.edu$/i.test(email); }
function publicUser(user) { return { id: user.id, email: user.email, verified: user.verified }; }
async function sendVerificationEmail(email, code) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
    // Keeps the project usable locally until an email service is configured.
    console.log(`\nHive verification code for ${email}: ${code}\n`);
    return { delivery: 'terminal' };
  }

  const providerResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Hive-auth-starter/1.0',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM,
      to: [email],
      subject: 'Your Hive verification code',
      text: `Your Hive verification code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your Hive verification code is:</p><p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${code}</p><p>This code expires in 10 minutes.</p>`,
    }),
  });
  if (!providerResponse.ok) {
    const details = await providerResponse.text();
    console.error('Resend failed to send verification email:', providerResponse.status, details);
    throw new Error('We could not send the verification email. Please try again.');
  }
  return { delivery: 'email' };
}

const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  try {
    if (request.method === 'POST' && url.pathname === '/api/auth/signup') {
      const { email: rawEmail, password } = await readBody(request);
      const email = normalizeEmail(rawEmail);
      if (!isEduEmail(email)) return json(response, 400, { error: 'Use a valid school email ending in .edu.' });
      if (typeof password !== 'string' || password.length < 8) return json(response, 400, { error: 'Password must contain at least 8 characters.' });
      const db = database();
      let user = db.users.find((item) => item.email === email);
      if (user?.verified) return json(response, 409, { error: 'An account already exists for this email. Please log in.' });
      if (!user) { user = { id: crypto.randomUUID(), email, passwordHash: hashPassword(password), verified: false, createdAt: new Date().toISOString() }; db.users.push(user); }
      else user.passwordHash = hashPassword(password);
      const code = newCode();
      db.verificationCodes = db.verificationCodes.filter((item) => item.email !== email);
      db.verificationCodes.push({ email, codeHash: hashCode(email, code), expiresAt: Date.now() + TEN_MINUTES });
      save(db);
      const result = await sendVerificationEmail(email, code);
      return json(response, 201, { message: result.delivery === 'email' ? 'A verification code was sent to your email.' : 'Verification code created. Check the server window for the local development code.', email });
    }
    if (request.method === 'POST' && url.pathname === '/api/auth/resend-verification') {
      const { email: rawEmail } = await readBody(request); const email = normalizeEmail(rawEmail);
      const db = database(); const user = db.users.find((item) => item.email === email);
      if (!user || user.verified) return json(response, 400, { error: 'Start with sign-up before requesting a code.' });
      const code = newCode();
      db.verificationCodes = db.verificationCodes.filter((item) => item.email !== email);
      db.verificationCodes.push({ email, codeHash: hashCode(email, code), expiresAt: Date.now() + TEN_MINUTES });
      save(db);
      const result = await sendVerificationEmail(email, code);
      return json(response, 200, { message: result.delivery === 'email' ? 'A new verification code was sent to your email.' : 'A new code was created. Check the server window.' });
    }
    if (request.method === 'POST' && url.pathname === '/api/auth/verify') {
      const { email: rawEmail, code } = await readBody(request); const email = normalizeEmail(rawEmail);
      const db = database(); const record = db.verificationCodes.find((item) => item.email === email);
      if (!record || record.expiresAt < Date.now() || !safeEqual(hashCode(email, String(code || '')), record.codeHash)) return json(response, 400, { error: 'That code is invalid or has expired.' });
      const user = db.users.find((item) => item.email === email);
      if (!user) return json(response, 400, { error: 'No pending account exists for this email.' });
      user.verified = true; user.verifiedAt = new Date().toISOString();
      db.verificationCodes = db.verificationCodes.filter((item) => item.email !== email);
      const token = createSession(db, user.id); save(db);
      return json(response, 200, { message: 'Email verified. You are now logged in.', user: publicUser(user) }, { 'Set-Cookie': `hive_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SIX_HOURS / 1000}${IS_PRODUCTION ? '; Secure' : ''}` });
    }
    if (request.method === 'POST' && url.pathname === '/api/auth/login') {
      const { email: rawEmail, password } = await readBody(request); const email = normalizeEmail(rawEmail);
      const db = database(); const user = db.users.find((item) => item.email === email);
      if (!user || typeof password !== 'string' || !validPassword(password, user.passwordHash)) return json(response, 401, { error: 'Email or password is incorrect.' });
      if (!user.verified) return json(response, 403, { error: 'Please verify your email before logging in.', needsVerification: true, email });
      const token = createSession(db, user.id); save(db);
      return json(response, 200, { message: 'Logged in successfully.', user: publicUser(user) }, { 'Set-Cookie': `hive_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SIX_HOURS / 1000}${IS_PRODUCTION ? '; Secure' : ''}` });
    }
    if (request.method === 'GET' && url.pathname === '/api/auth/me') {
      const token = parseCookies(request).hive_session; const db = database();
      const session = db.sessions.find((item) => item.tokenHash === crypto.createHash('sha256').update(token || '').digest('hex') && item.expiresAt > Date.now());
      const user = session && db.users.find((item) => item.id === session.userId);
      return user ? json(response, 200, { user: publicUser(user) }) : json(response, 401, { error: 'Not logged in.' });
    }
    if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
      const token = parseCookies(request).hive_session; const db = database();
      db.sessions = db.sessions.filter((item) => item.tokenHash !== crypto.createHash('sha256').update(token || '').digest('hex')); save(db);
      return json(response, 200, { message: 'Logged out.' }, { 'Set-Cookie': 'hive_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' });
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') return json(response, 404, { error: 'Not found.' });
    const requestPath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const filePath = path.resolve(ROOT, `.${requestPath}`);
    const relativePath = path.relative(ROOT, filePath);
    const extension = path.extname(filePath).toLowerCase();
    if (!filePath.startsWith(ROOT + path.sep) || relativePath.startsWith('data' + path.sep) || !types[extension] || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return json(response, 404, { error: 'Not found.' });
    response.writeHead(200, { 'Content-Type': types[extension], 'X-Content-Type-Options': 'nosniff' });
    if (request.method === 'HEAD') return response.end();
    fs.createReadStream(filePath).pipe(response);
  } catch (error) {
    console.error(error); json(response, 500, { error: 'Something went wrong. Please try again.' });
  }
});
server.listen(PORT, () => console.log(`Hive is running at http://localhost:${PORT}`));
