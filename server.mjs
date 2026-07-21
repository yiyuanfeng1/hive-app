import express from "express";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load local development settings (such as Resend) from .env without adding
// another dependency. Hosting platforms provide these as normal environment variables.
const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1] in process.env) continue;
    process.env[match[1]] = match[2].replace(/^("|')|("|')$/g, "");
  }
}

const app = express();
const port = Number(process.env.PORT || 4173);
const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(root, "data");
const dataFile = path.join(dataDir, "hive.json");
const secret = process.env.SESSION_SECRET || "change-this-before-deploying";
const codeLifetime = 10 * 60 * 1000;
const sessionLifetime = 6 * 60 * 60 * 1000;
app.use(express.json({ limit: "20mb" }));
fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({ users: [], codes: [], resetTokens: [], sessions: [], listings: [], carts: {}, conversations: [], orders: [], saved: {}, history: {}, follows: {}, coupons: {}, searches: {} }, null, 2));

const readDb = () => { const x = JSON.parse(fs.readFileSync(dataFile, "utf8")); for (const k of ["users", "codes", "resetTokens", "sessions", "listings", "conversations", "orders"]) x[k] ||= []; for (const k of ["carts", "saved", "history", "follows", "coupons", "searches"]) x[k] ||= {}; return x; };
const writeDb = (x) => fs.writeFileSync(dataFile, JSON.stringify(x, null, 2));
const newId = () => crypto.randomUUID();
const normEmail = (x) => String(x || "").trim().toLowerCase();
const isEdu = (x) => /^[^\s@]+@[^\s@]+\.edu$/i.test(x);
const passHash = (v, salt = crypto.randomBytes(16).toString("hex")) => `${salt}:${crypto.scryptSync(v, salt, 64).toString("hex")}`;
const validPass = (v, saved) => { const [salt] = saved.split(":"); return crypto.timingSafeEqual(Buffer.from(passHash(v, salt)), Buffer.from(saved)); };

// Render can enable this with DEMO_MODE=true. It creates only generic sample
// accounts and listings for evaluators; it never imports a developer's local data.
function seedJudgeDemo() {
  if (process.env.DEMO_MODE !== "true") return;
  const db = readDb();
  const judgeEmail = "judge@hive-demo.edu";
  const sellerEmail = "seller@hive-demo.edu";
  let changed = false;
  let seller = db.users.find((user) => user.email === sellerEmail);

  if (!db.users.some((user) => user.email === judgeEmail)) {
    db.users.push({
      id: newId(),
      email: judgeEmail,
      passwordHash: passHash("HiveDemo2026!"),
      verified: true,
      createdAt: new Date().toISOString(),
      profile: { name: "Hive Judge", school: "Demo University", grad: "Evaluator", campus: "Demo Campus", avatar: "", gender: "", age: "", sign: "", interests: "Campus marketplace", bio: "A safe demo-only account with fictional content." },
    });
    changed = true;
  }

  if (!seller) {
    seller = {
      id: newId(),
      email: sellerEmail,
      passwordHash: passHash("SellerDemo2026!"),
      verified: true,
      createdAt: new Date().toISOString(),
      profile: { name: "Demo Seller", school: "Demo University", grad: "Student", campus: "Demo Campus", avatar: "", gender: "", age: "", sign: "", interests: "Secondhand goods", bio: "A fictional seller used only for the public Hive demo." },
    };
    db.users.push(seller);
    changed = true;
  }

  if (!db.listings.some((listing) => listing.demoSeed)) {
    const image = (label, color) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="${color}"/><circle cx="400" cy="240" r="110" fill="white" fill-opacity=".92"/><path d="M345 240h110M400 185v110" stroke="${color}" stroke-width="26" stroke-linecap="round"/><text x="400" y="470" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="38" font-weight="700">${label}</text></svg>`)}`;
    const now = new Date().toISOString();
    db.listings.push(
      { id: newId(), demoSeed: true, sellerId: seller.id, seller: "Demo Seller", sellerAvatar: "", sellerRating: 5, title: "Campus Desk Lamp", description: "Fictional demo listing for evaluating the Hive marketplace.", price: 20, category: "Furniture & Home", condition: "Good", images: [image("Desk Lamp", "#4b5563")], status: "active", createdAt: now, location: "Demo Campus", school: "Demo University", campus: "Demo Campus" },
      { id: newId(), demoSeed: true, sellerId: seller.id, seller: "Demo Seller", sellerAvatar: "", sellerRating: 5, title: "Intro Biology Textbook", description: "Fictional demo listing for evaluating search, saved items, and checkout.", price: 15, category: "School Supplies", condition: "Used", images: [image("Textbook", "#2563eb")], status: "active", createdAt: now, location: "Demo Campus", school: "Demo University", campus: "Demo Campus" },
      { id: newId(), demoSeed: true, sellerId: seller.id, seller: "Demo Seller", sellerAvatar: "", sellerRating: 5, title: "Study Chair", description: "Fictional demo listing for evaluating a safe campus marketplace flow.", price: 25, category: "Furniture & Home", condition: "Good", images: [image("Study Chair", "#15803d")], status: "active", createdAt: now, location: "Demo Campus", school: "Demo University", campus: "Demo Campus" },
    );
    changed = true;
  }

  if (changed) writeDb(db);
}
seedJudgeDemo();
const codeHash = (email, code) => crypto.createHash("sha256").update(`${email}:${code}:${secret}`).digest("hex");
const publicUser = (u) => ({ id: u.id, email: u.email, verified: u.verified, profile: u.profile });
const respond = (res, status, body, headers = {}) => res.status(status).set(headers).json(body);
function cookies(req) { return Object.fromEntries((req.headers.cookie || "").split(";").filter(Boolean).map((x) => { const i = x.indexOf("="); return [x.slice(0, i).trim(), decodeURIComponent(x.slice(i + 1))]; })); }
function makeSession(db, userId) { const token = crypto.randomBytes(32).toString("hex"); db.sessions = db.sessions.filter((x) => x.expiresAt > Date.now()); db.sessions.push({ tokenHash: crypto.createHash("sha256").update(token).digest("hex"), userId, expiresAt: Date.now() + sessionLifetime }); return token; }
function sessionUser(req, db) { const token = cookies(req).hive_session; if (!token) return null; const session = db.sessions.find((x) => x.tokenHash === crypto.createHash("sha256").update(token).digest("hex") && x.expiresAt > Date.now()); return session && db.users.find((x) => x.id === session.userId); }
function requireUser(req, res, next) { const db = readDb(); const user = sessionUser(req, db); if (!user) return respond(res, 401, { error: "Please log in to continue." }); req.hive = { db, user }; next(); }
function setSessionCookie(res, token) { return { "Set-Cookie": `hive_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${sessionLifetime / 1000}${process.env.NODE_ENV === "production" ? "; Secure" : ""}` }; }
async function deliverCode(email, code) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) { console.log(`\nHive verification code for ${email}: ${code}\n`); return "terminal"; }
  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "User-Agent": "Hive-marketplace/1.0" }, body: JSON.stringify({ from: process.env.RESEND_FROM, to: [email], subject: "Your Hive verification code", text: `Your Hive verification code is ${code}. It expires in 10 minutes.` }) });
  if (!r.ok) {
    const detail = (await r.text()).slice(0, 500);
    throw new Error(`Resend returned ${r.status}: ${detail}`);
  }
  return "email";
}
async function deliverPasswordReset(email, resetUrl) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) { console.log(`\nHive password-reset link for ${email}: ${resetUrl}\n`); return "terminal"; }
  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "User-Agent": "Hive-marketplace/1.0" }, body: JSON.stringify({ from: process.env.RESEND_FROM, to: [email], subject: "Reset your Hive password", text: `Reset your Hive password by opening this one-time link. It expires in 30 minutes: ${resetUrl}` }) });
  if (!r.ok) throw new Error(`Resend returned ${r.status}: ${(await r.text()).slice(0, 500)}`);
  return "email";
}
function issueCode(db, email) { const code = crypto.randomInt(100000, 1000000).toString(); db.codes = db.codes.filter((x) => x.email !== email); db.codes.push({ email, value: codeHash(email, code), expiresAt: Date.now() + codeLifetime }); return code; }

app.post("/api/auth/signup", async (req, res) => {
  const email = normEmail(req.body?.email); const password = req.body?.password;
  if (!isEdu(email)) return respond(res, 400, { error: "Use a valid school email ending in .edu." });
  if (typeof password !== "string" || password.length < 8) return respond(res, 400, { error: "Use a password with at least 8 characters." });
  const db = readDb(); let user = db.users.find((x) => x.email === email);
  if (user?.verified) return respond(res, 409, { error: "An account already exists. Please log in." });
  if (!user) { user = { id: newId(), email, passwordHash: passHash(password), verified: false, createdAt: new Date().toISOString(), profile: { name: email.split("@")[0], school: "", grad: "", campus: "", avatar: "", gender: "", age: "", sign: "", interests: "", bio: "" } }; db.users.push(user); } else user.passwordHash = passHash(password);
  const code = issueCode(db, email); writeDb(db);
  try { const delivery = await deliverCode(email, code); respond(res, 201, { email, message: delivery === "email" ? "A verification code was sent to your email." : "Verification code created. Check the local server window." }); } catch (error) { console.error("Resend verification-email error:", error.message); respond(res, 502, { error: "We could not send the verification email. Try again." }); }
});
app.post("/api/auth/resend", async (req, res) => { const email = normEmail(req.body?.email); const db = readDb(); const user = db.users.find((x) => x.email === email); if (!user || user.verified) return respond(res, 400, { error: "Start with sign up before requesting a code." }); const code = issueCode(db, email); writeDb(db); try { const delivery = await deliverCode(email, code); respond(res, 200, { message: delivery === "email" ? "A new code was sent to your email." : "A new code was created. Check the local server window." }); } catch (error) { console.error("Resend verification-email error:", error.message); respond(res, 502, { error: "We could not send the verification email. Try again." }); } });
app.post("/api/auth/verify", (req, res) => { const email = normEmail(req.body?.email); const code = String(req.body?.code || ""); const db = readDb(); const record = db.codes.find((x) => x.email === email); if (!record || record.expiresAt < Date.now() || !crypto.timingSafeEqual(Buffer.from(codeHash(email, code)), Buffer.from(record.value))) return respond(res, 400, { error: "That code is invalid or expired." }); const user = db.users.find((x) => x.email === email); if (!user) return respond(res, 400, { error: "No pending account was found." }); user.verified = true; db.codes = db.codes.filter((x) => x.email !== email); const token = makeSession(db, user.id); writeDb(db); respond(res, 200, { user: publicUser(user), message: "Email verified. Welcome to Hive." }, setSessionCookie(res, token)); });
app.post("/api/auth/login", (req, res) => { const email = normEmail(req.body?.email); const password = req.body?.password; const db = readDb(); const user = db.users.find((x) => x.email === email); if (!user || typeof password !== "string" || !validPass(password, user.passwordHash)) return respond(res, 401, { error: "Email or password is incorrect." }); if (!user.verified) return respond(res, 403, { error: "Verify your email first.", needsVerification: true, email }); const token = makeSession(db, user.id); writeDb(db); respond(res, 200, { user: publicUser(user), message: "Logged in successfully." }, setSessionCookie(res, token)); });
app.post("/api/auth/password-reset/request", async (req, res) => {
  const email = normEmail(req.body?.email);
  if (!isEdu(email)) return respond(res, 400, { error: "Use a valid school email ending in .edu." });
  const db = readDb(); const user = db.users.find((x) => x.email === email && x.verified);
  if (!user) return respond(res, 200, { message: "If that Hive account exists, a reset link has been sent." });
  const token = crypto.randomBytes(32).toString("hex"); const tokenHash = crypto.createHash("sha256").update(`${token}:${secret}`).digest("hex");
  db.resetTokens = db.resetTokens.filter((x) => x.email !== email && x.expiresAt > Date.now());
  db.resetTokens.push({ email, tokenHash, expiresAt: Date.now() + 30 * 60 * 1000 }); writeDb(db);
  const baseUrl = (process.env.APP_URL || `http://${req.headers.host}`).replace(/\/$/, "");
  try { const delivery = await deliverPasswordReset(email, `${baseUrl}/#reset=${token}`); respond(res, 200, { message: delivery === "email" ? "A secure reset link was sent to your school email." : "A reset link was created. Check the local server window." }); }
  catch (error) { console.error("Hive password-reset email error:", error.message); respond(res, 502, { error: "We could not send the reset email. Try again." }); }
});
app.post("/api/auth/password-reset/confirm", (req, res) => {
  const token = String(req.body?.token || ""); const password = req.body?.password;
  if (typeof password !== "string" || password.length < 8) return respond(res, 400, { error: "Use a password with at least 8 characters." });
  const db = readDb(); const tokenHash = crypto.createHash("sha256").update(`${token}:${secret}`).digest("hex"); const record = db.resetTokens.find((x) => x.tokenHash === tokenHash && x.expiresAt > Date.now());
  if (!record) return respond(res, 400, { error: "This reset link is invalid or expired. Request a new one." });
  const user = db.users.find((x) => x.email === record.email); if (!user) return respond(res, 400, { error: "This account no longer exists." });
  user.passwordHash = passHash(password); db.resetTokens = db.resetTokens.filter((x) => x !== record); writeDb(db); respond(res, 200, { message: "Your password was reset. You can now log in." });
});
app.get("/api/auth/me", (req, res) => { const db = readDb(); const user = sessionUser(req, db); return user ? respond(res, 200, { user: publicUser(user) }) : respond(res, 401, { error: "Not logged in." }); });
app.post("/api/auth/logout", (req, res) => { const db = readDb(); const token = cookies(req).hive_session || ""; const hash = crypto.createHash("sha256").update(token).digest("hex"); db.sessions = db.sessions.filter((x) => x.tokenHash !== hash); writeDb(db); respond(res, 200, { message: "Logged out." }, { "Set-Cookie": "hive_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0" }); });

const listingWithCampus = (db, listing) => {
  const profile = db.users.find((user) => user.id === listing.sellerId)?.profile || {};
  return { ...listing, school: listing.school || profile.school || "", campus: listing.campus || profile.campus || "" };
};
app.get("/api/listings", (_req, res) => { const db = readDb(); respond(res, 200, { listings: db.listings.filter((x) => x.status !== "sold").map((listing) => listingWithCampus(db, listing)) }); });
app.post("/api/listings", requireUser, (req, res) => { const { title, description, price, category, condition, image = "" } = req.body || {}; if (!title?.trim() || !description?.trim() || !Number.isFinite(Number(price))) return respond(res, 400, { error: "Title, description, and a valid price are required." }); const p = req.hive.user.profile; const listing = { id: newId(), sellerId: req.hive.user.id, title: String(title).trim(), description: String(description).trim(), price: Math.max(1, Math.round(Number(price))), category: String(category || "Other"), condition: String(condition || "Good"), images: image ? [image] : [], status: "active", createdAt: new Date().toISOString(), location: p.campus || p.school || "Campus", school: p.school || "", campus: p.campus || "", seller: p.name || req.hive.user.email.split("@")[0], sellerAvatar: p.avatar || "", sellerRating: 5 }; req.hive.db.listings.push(listing); writeDb(req.hive.db); respond(res, 201, { listing: listingWithCampus(req.hive.db, listing) }); });
app.delete("/api/listings/:listingId", requireUser, (req, res) => {
  const index = req.hive.db.listings.findIndex((listing) => listing.id === req.params.listingId);
  if (index === -1) return respond(res, 404, { error: "Listing not found." });
  if (req.hive.db.listings[index].sellerId !== req.hive.user.id) return respond(res, 403, { error: "Only the listing owner can delete it." });
  req.hive.db.listings.splice(index, 1);
  for (const key of ["carts", "saved", "history"]) {
    for (const userId of Object.keys(req.hive.db[key])) {
      req.hive.db[key][userId] = (req.hive.db[key][userId] || []).filter((item) => String(item.listingId || item) !== req.params.listingId);
    }
  }
  writeDb(req.hive.db);
  respond(res, 200, { message: "Listing deleted." });
});
app.get("/api/profile", requireUser, (req, res) => respond(res, 200, { user: publicUser(req.hive.user), listings: req.hive.db.listings.filter((x) => x.sellerId === req.hive.user.id) }));
app.get("/api/users/:userId", (req, res) => {
  const db = readDb();
  const seller = db.users.find((user) => user.id === req.params.userId);
  if (!seller) return respond(res, 404, { error: "Seller not found." });
  const viewer = sessionUser(req, db);
  const profile = seller.profile || {};
  const followers = Object.values(db.follows).filter((ids) => Array.isArray(ids) && ids.includes(seller.id)).length;
  return respond(res, 200, {
    seller: {
      id: seller.id,
      name: profile.name || seller.email.split("@")[0],
      school: profile.school || "",
      grad: profile.grad || "",
      campus: profile.campus || "",
      avatar: profile.avatar || "",
      gender: profile.gender || "",
      age: profile.age || "",
      sign: profile.sign || "",
      interests: profile.interests || "",
      bio: profile.bio || "",
      verified: Boolean(seller.verified),
      followers,
      followedByMe: Boolean(viewer && (db.follows[viewer.id] || []).includes(seller.id)),
    },
    listings: db.listings.filter((listing) => listing.sellerId === seller.id && listing.status !== "sold"),
  });
});
app.put("/api/activity/follow", requireUser, (req, res) => {
  const sellerId = String(req.body?.sellerId || "");
  if (!req.hive.db.users.some((user) => user.id === sellerId) || sellerId === req.hive.user.id) return respond(res, 400, { error: "That seller cannot be followed." });
  const follows = req.hive.db.follows[req.hive.user.id] || [];
  req.hive.db.follows[req.hive.user.id] = follows.includes(sellerId) ? follows.filter((id) => id !== sellerId) : [sellerId, ...follows];
  writeDb(req.hive.db);
  respond(res, 200, { followingIds: req.hive.db.follows[req.hive.user.id] });
});
app.put("/api/profile", requireUser, (req, res) => {
  for (const key of ["name", "school", "grad", "campus", "gender", "age", "sign", "interests", "bio"]) {
    if (typeof req.body?.[key] === "string") req.hive.user.profile[key] = req.body[key].slice(0, 500);
  }
  if (typeof req.body?.avatar === "string") {
    const avatar = req.body.avatar;
    if (avatar && (!avatar.startsWith("data:image/") || avatar.length > 4_000_000)) {
      return respond(res, 400, { error: "Use an image smaller than about 3 MB for your profile photo." });
    }
    req.hive.user.profile.avatar = avatar;
  }
  writeDb(req.hive.db);
  respond(res, 200, { user: publicUser(req.hive.user) });
});
app.get("/api/cart", requireUser, (req, res) => respond(res, 200, { items: req.hive.db.carts[req.hive.user.id] || [] }));
app.put("/api/cart", requireUser, (req, res) => { const items = Array.isArray(req.body?.items) ? req.body.items.slice(0, 50).map((x) => ({ listingId: String(x.listingId), qty: Math.max(1, Math.min(20, Number(x.qty) || 1)) })) : []; req.hive.db.carts[req.hive.user.id] = items; writeDb(req.hive.db); respond(res, 200, { items }); });
app.get("/api/activity", requireUser, (req, res) => respond(res, 200, {
  savedIds: req.hive.db.saved[req.hive.user.id] || [],
  historyIds: req.hive.db.history[req.hive.user.id] || [],
  followingIds: req.hive.db.follows[req.hive.user.id] || [],
  coupons: req.hive.db.coupons[req.hive.user.id] || [],
}));
app.put("/api/activity/saved", requireUser, (req, res) => {
  const listingId = String(req.body?.listingId || "");
  if (!req.hive.db.listings.some((listing) => listing.id === listingId)) return respond(res, 404, { error: "Listing not found." });
  const saved = req.hive.db.saved[req.hive.user.id] || [];
  req.hive.db.saved[req.hive.user.id] = saved.includes(listingId) ? saved.filter((id) => id !== listingId) : [listingId, ...saved];
  writeDb(req.hive.db);
  respond(res, 200, { savedIds: req.hive.db.saved[req.hive.user.id] });
});
app.post("/api/activity/history", requireUser, (req, res) => {
  const listingId = String(req.body?.listingId || "");
  if (!req.hive.db.listings.some((listing) => listing.id === listingId)) return respond(res, 404, { error: "Listing not found." });
  const history = (req.hive.db.history[req.hive.user.id] || []).filter((id) => id !== listingId);
  req.hive.db.history[req.hive.user.id] = [listingId, ...history].slice(0, 100);
  writeDb(req.hive.db);
  respond(res, 200, { historyIds: req.hive.db.history[req.hive.user.id] });
});
app.get("/api/search-history", requireUser, (req, res) => respond(res, 200, { queries: req.hive.db.searches[req.hive.user.id] || [] }));
app.post("/api/search-history", requireUser, (req, res) => {
  const query = String(req.body?.query || "").trim().replace(/\s+/g, " ").slice(0, 100);
  if (query.length < 2) return respond(res, 400, { error: "Searches need at least two characters." });
  const previous = req.hive.db.searches[req.hive.user.id] || [];
  req.hive.db.searches[req.hive.user.id] = [query, ...previous.filter((item) => item.toLowerCase() !== query.toLowerCase())].slice(0, 12);
  writeDb(req.hive.db);
  respond(res, 201, { queries: req.hive.db.searches[req.hive.user.id] });
});
app.get("/api/conversations", requireUser, (req, res) => {
  const conversations = req.hive.db.conversations
    .filter((conversation) => conversation.memberIds.includes(req.hive.user.id))
    .map((conversation) => {
      const recipientId = conversation.memberIds.find((id) => id !== req.hive.user.id) || "";
      const recipient = req.hive.db.users.find((user) => user.id === recipientId);
      const listing = req.hive.db.listings.find((item) => item.id === conversation.listingId) || null;
      const unread = conversation.messages.filter((message) => message.senderId !== req.hive.user.id && !message.readAt).length;
      return {
        id: conversation.id,
        listingId: conversation.listingId,
        updatedAt: conversation.updatedAt || conversation.createdAt,
        unread,
        recipient: recipient ? {
          id: recipient.id,
          name: recipient.profile?.name || recipient.email.split("@")[0],
          avatar: recipient.profile?.avatar || "",
        } : null,
        listing,
        messages: conversation.messages.map((message) => ({
          id: message.id,
          text: message.text,
          createdAt: message.createdAt,
          mine: message.senderId === req.hive.user.id,
          read: Boolean(message.readAt),
        })),
      };
    })
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  respond(res, 200, { conversations, unreadTotal: conversations.reduce((total, conversation) => total + conversation.unread, 0) });
});
app.post("/api/conversations", requireUser, (req, res) => { const { recipientId, listingId, text } = req.body || {}; if (!recipientId || !text?.trim()) return respond(res, 400, { error: "A recipient and message are required." }); if (recipientId === req.hive.user.id) return respond(res, 400, { error: "You cannot message yourself." }); let conversation = req.hive.db.conversations.find((x) => x.listingId === listingId && x.memberIds.includes(req.hive.user.id) && x.memberIds.includes(recipientId)); if (!conversation) { conversation = { id: newId(), listingId: listingId || null, memberIds: [req.hive.user.id, recipientId], messages: [], createdAt: new Date().toISOString() }; req.hive.db.conversations.push(conversation); } const message = { id: newId(), senderId: req.hive.user.id, text: String(text).trim().slice(0, 2000), createdAt: new Date().toISOString(), readAt: null }; conversation.messages.push(message); conversation.updatedAt = message.createdAt; writeDb(req.hive.db); respond(res, 201, { conversation, message }); });
app.put("/api/conversations/:conversationId/read", requireUser, (req, res) => {
  const conversation = req.hive.db.conversations.find((item) => item.id === req.params.conversationId && item.memberIds.includes(req.hive.user.id));
  if (!conversation) return respond(res, 404, { error: "Conversation not found." });
  const readAt = new Date().toISOString();
  conversation.messages.forEach((message) => {
    if (message.senderId !== req.hive.user.id && !message.readAt) message.readAt = readAt;
  });
  writeDb(req.hive.db);
  respond(res, 200, { message: "Conversation marked as read." });
});
app.post("/api/orders", requireUser, (req, res) => { const { items, meetupPlace = "", deliveryAddress = "" } = req.body || {}; if (!Array.isArray(items) || !items.length) return respond(res, 400, { error: "Your cart is empty." }); const order = { id: newId(), buyerId: req.hive.user.id, items, meetupPlace, deliveryAddress, status: "placed", createdAt: new Date().toISOString() }; req.hive.db.orders.push(order); req.hive.db.carts[req.hive.user.id] = []; writeDb(req.hive.db); respond(res, 201, { order }); });

const agentInstructions = `You are Hive's careful secondhand marketplace listing agent. Follow the Hive Marketplace AI Listing Agent playbook.

Your job is to analyze the uploaded photo and create a reviewable listing draft. Return valid JSON only.

Safety and accuracy rules:
- Report only visible facts as observations. Never invent or assume a brand, model, size, material, age, condition, included accessories, working status, authenticity, retail price, or resale value.
- When a brand or label is visible, you may identify it and say that it was visible in the photo. When it is unclear, say it is unclear.
- Separate Observed facts from Estimated facts. Every estimate must have High, Medium, or Low confidence and a short reason.
- Assess only visible wear. Do not claim an item functions, is complete, or is authentic unless the photo proves it.
- Give a resale range and a recommended listing price. Use a conservative local-campus estimate rather than fake precision. Explain the price briefly.
- Ask 2–5 essential confirmation questions before publishing, such as size, capacity, functionality, flaws, included parts, or pickup details. Do not ask questions whose answer is clearly visible.
- Write a useful title and a concise honest description based only on observations and clearly-labeled estimates.

Return exactly these keys:
title, description, category, condition, observed, estimates, retail_price_estimate, resale_price_range, recommended_listing_price, price_reasoning, confirmation_questions, confirmation_summary.
Use these categories only: Electronics, School Supplies, Furniture & Home, Clothing, Dorm Essentials, Kitchen & Appliances, Books & Textbooks, Beauty & Personal Care, Sports & Fitness, Gaming, Other.
Use these conditions only: New, Like New, Good, Fair, Poor.`;

const listingResponseSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    category: { type: "string", enum: ["Electronics", "School Supplies", "Furniture & Home", "Clothing", "Dorm Essentials", "Kitchen & Appliances", "Books & Textbooks", "Beauty & Personal Care", "Sports & Fitness", "Gaming", "Other"] },
    condition: { type: "string", enum: ["New", "Like New", "Good", "Fair", "Poor"] },
    observed: { type: "array", items: { type: "string" } },
    estimates: { type: "array", items: { type: "object", properties: { field: { type: "string" }, value: { type: "string" }, confidence: { type: "string", enum: ["High", "Medium", "Low"] }, reason: { type: "string" } }, required: ["field", "value", "confidence", "reason"] } },
    retail_price_estimate: { type: "string" },
    resale_price_range: { type: "string" },
    recommended_listing_price: { type: "number" },
    price_reasoning: { type: "array", items: { type: "string" } },
    confirmation_questions: { type: "array", items: { type: "string" } },
    confirmation_summary: { type: "array", items: { type: "string" } },
  },
  required: ["title", "description", "category", "condition", "observed", "estimates", "retail_price_estimate", "resale_price_range", "recommended_listing_price", "price_reasoning", "confirmation_questions", "confirmation_summary"],
};

app.post("/api/analyze-item", requireUser, async (req, res) => {
  const { image, filename = "uploaded item" } = req.body ?? {};
  if (!process.env.GEMINI_API_KEY) return respond(res, 503, { error: "Gemini analysis is not configured yet. Add GEMINI_API_KEY on the server." });
  if (typeof image !== "string" || !image.startsWith("data:image/")) return respond(res, 400, { error: "A valid item image is required." });

  const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
  if (!match) return respond(res, 400, { error: "The item photo could not be prepared for Gemini." });

  try {
    const model = encodeURIComponent(process.env.GEMINI_MODEL || "gemini-3.5-flash");
    const gemini = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: agentInstructions }] },
        contents: [{ parts: [
          { text: `Analyze this secondhand item (${filename}). Return the required JSON listing draft.` },
          { inlineData: { mimeType: match[1], data: match[2] } },
        ] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: listingResponseSchema, temperature: 0.2 },
      }),
    });
    const raw = await gemini.text();
    if (!gemini.ok) throw new Error(`Gemini returned ${gemini.status}: ${raw.slice(0, 500)}`);
    const result = JSON.parse(raw);
    const text = result.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
    const output = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ""));
    if (!output.title || !output.description || !Number.isFinite(Number(output.recommended_listing_price))) throw new Error("Gemini returned an incomplete listing draft.");
    respond(res, 200, output);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown Gemini error";
    console.error("Hive Gemini listing-agent error:", detail);
    respond(res, 502, { error: detail.slice(0, 300) });
  }
});

app.use(express.static(path.join(root, "dist")));
app.use((_req, res) => res.sendFile(path.join(root, "dist", "index.html")));
app.listen(port, () => console.log(`Hive is running at http://localhost:${port}`));
