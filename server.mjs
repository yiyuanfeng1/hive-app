import express from "express";
import OpenAI from "openai";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({ users: [], codes: [], sessions: [], listings: [], carts: {}, conversations: [], orders: [] }, null, 2));

const readDb = () => { const x = JSON.parse(fs.readFileSync(dataFile, "utf8")); for (const k of ["users", "codes", "sessions", "listings", "conversations", "orders"]) x[k] ||= []; x.carts ||= {}; return x; };
const writeDb = (x) => fs.writeFileSync(dataFile, JSON.stringify(x, null, 2));
const newId = () => crypto.randomUUID();
const normEmail = (x) => String(x || "").trim().toLowerCase();
const isEdu = (x) => /^[^\s@]+@[^\s@]+\.edu$/i.test(x);
const passHash = (v, salt = crypto.randomBytes(16).toString("hex")) => `${salt}:${crypto.scryptSync(v, salt, 64).toString("hex")}`;
const validPass = (v, saved) => { const [salt] = saved.split(":"); return crypto.timingSafeEqual(Buffer.from(passHash(v, salt)), Buffer.from(saved)); };
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
  if (!r.ok) throw new Error(`Email provider returned ${r.status}`); return "email";
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
  try { const delivery = await deliverCode(email, code); respond(res, 201, { email, message: delivery === "email" ? "A verification code was sent to your email." : "Verification code created. Check the local server window." }); } catch { respond(res, 502, { error: "We could not send the verification email. Try again." }); }
});
app.post("/api/auth/resend", async (req, res) => { const email = normEmail(req.body?.email); const db = readDb(); const user = db.users.find((x) => x.email === email); if (!user || user.verified) return respond(res, 400, { error: "Start with sign up before requesting a code." }); const code = issueCode(db, email); writeDb(db); try { const delivery = await deliverCode(email, code); respond(res, 200, { message: delivery === "email" ? "A new code was sent to your email." : "A new code was created. Check the local server window." }); } catch { respond(res, 502, { error: "We could not send the verification email. Try again." }); } });
app.post("/api/auth/verify", (req, res) => { const email = normEmail(req.body?.email); const code = String(req.body?.code || ""); const db = readDb(); const record = db.codes.find((x) => x.email === email); if (!record || record.expiresAt < Date.now() || !crypto.timingSafeEqual(Buffer.from(codeHash(email, code)), Buffer.from(record.value))) return respond(res, 400, { error: "That code is invalid or expired." }); const user = db.users.find((x) => x.email === email); if (!user) return respond(res, 400, { error: "No pending account was found." }); user.verified = true; db.codes = db.codes.filter((x) => x.email !== email); const token = makeSession(db, user.id); writeDb(db); respond(res, 200, { user: publicUser(user), message: "Email verified. Welcome to Hive." }, setSessionCookie(res, token)); });
app.post("/api/auth/login", (req, res) => { const email = normEmail(req.body?.email); const password = req.body?.password; const db = readDb(); const user = db.users.find((x) => x.email === email); if (!user || typeof password !== "string" || !validPass(password, user.passwordHash)) return respond(res, 401, { error: "Email or password is incorrect." }); if (!user.verified) return respond(res, 403, { error: "Verify your email first.", needsVerification: true, email }); const token = makeSession(db, user.id); writeDb(db); respond(res, 200, { user: publicUser(user), message: "Logged in successfully." }, setSessionCookie(res, token)); });
app.get("/api/auth/me", (req, res) => { const db = readDb(); const user = sessionUser(req, db); return user ? respond(res, 200, { user: publicUser(user) }) : respond(res, 401, { error: "Not logged in." }); });
app.post("/api/auth/logout", (req, res) => { const db = readDb(); const token = cookies(req).hive_session || ""; const hash = crypto.createHash("sha256").update(token).digest("hex"); db.sessions = db.sessions.filter((x) => x.tokenHash !== hash); writeDb(db); respond(res, 200, { message: "Logged out." }, { "Set-Cookie": "hive_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0" }); });

app.get("/api/listings", (_req, res) => respond(res, 200, { listings: readDb().listings.filter((x) => x.status !== "sold") }));
app.post("/api/listings", requireUser, (req, res) => { const { title, description, price, category, condition, image = "" } = req.body || {}; if (!title?.trim() || !description?.trim() || !Number.isFinite(Number(price))) return respond(res, 400, { error: "Title, description, and a valid price are required." }); const p = req.hive.user.profile; const listing = { id: newId(), sellerId: req.hive.user.id, title: String(title).trim(), description: String(description).trim(), price: Math.max(1, Math.round(Number(price))), category: String(category || "Other"), condition: String(condition || "Good"), images: image ? [image] : [], status: "active", createdAt: new Date().toISOString(), location: p.campus || p.school || "Campus", seller: p.name || req.hive.user.email.split("@")[0], sellerAvatar: p.avatar || "", sellerRating: 5 }; req.hive.db.listings.push(listing); writeDb(req.hive.db); respond(res, 201, { listing }); });
app.get("/api/profile", requireUser, (req, res) => respond(res, 200, { user: publicUser(req.hive.user), listings: req.hive.db.listings.filter((x) => x.sellerId === req.hive.user.id) }));
app.put("/api/profile", requireUser, (req, res) => { for (const key of ["name", "school", "grad", "campus", "avatar", "gender", "age", "sign", "interests", "bio"]) if (typeof req.body?.[key] === "string") req.hive.user.profile[key] = req.body[key].slice(0, 500); writeDb(req.hive.db); respond(res, 200, { user: publicUser(req.hive.user) }); });
app.get("/api/cart", requireUser, (req, res) => respond(res, 200, { items: req.hive.db.carts[req.hive.user.id] || [] }));
app.put("/api/cart", requireUser, (req, res) => { const items = Array.isArray(req.body?.items) ? req.body.items.slice(0, 50).map((x) => ({ listingId: String(x.listingId), qty: Math.max(1, Math.min(20, Number(x.qty) || 1)) })) : []; req.hive.db.carts[req.hive.user.id] = items; writeDb(req.hive.db); respond(res, 200, { items }); });
app.get("/api/conversations", requireUser, (req, res) => respond(res, 200, { conversations: req.hive.db.conversations.filter((x) => x.memberIds.includes(req.hive.user.id)) }));
app.post("/api/conversations", requireUser, (req, res) => { const { recipientId, listingId, text } = req.body || {}; if (!recipientId || !text?.trim()) return respond(res, 400, { error: "A recipient and message are required." }); let conversation = req.hive.db.conversations.find((x) => x.listingId === listingId && x.memberIds.includes(req.hive.user.id) && x.memberIds.includes(recipientId)); if (!conversation) { conversation = { id: newId(), listingId: listingId || null, memberIds: [req.hive.user.id, recipientId], messages: [], createdAt: new Date().toISOString() }; req.hive.db.conversations.push(conversation); } const message = { id: newId(), senderId: req.hive.user.id, text: String(text).trim().slice(0, 2000), createdAt: new Date().toISOString() }; conversation.messages.push(message); conversation.updatedAt = message.createdAt; writeDb(req.hive.db); respond(res, 201, { conversation, message }); });
app.post("/api/orders", requireUser, (req, res) => { const { items, meetupPlace = "", deliveryAddress = "" } = req.body || {}; if (!Array.isArray(items) || !items.length) return respond(res, 400, { error: "Your cart is empty." }); const order = { id: newId(), buyerId: req.hive.user.id, items, meetupPlace, deliveryAddress, status: "placed", createdAt: new Date().toISOString() }; req.hive.db.orders.push(order); req.hive.db.carts[req.hive.user.id] = []; writeDb(req.hive.db); respond(res, 201, { order }); });

const agentInstructions = `You are Hive's secondhand marketplace listing agent. Return JSON only. Separate observed image facts from estimates. Never state an uncertain brand, model, age, price, specification, accessory, condition, functionality, or authenticity as fact. Add High, Medium, or Low confidence to every estimate. Assess only visible condition. Return keys: title, description, category, condition, observed (string array), estimates (array of {field,value,confidence,reason}), retail_price_estimate, resale_price_range, recommended_listing_price, price_reasoning (string array), confirmation_questions (2 to 5 strings), confirmation_summary (string array). Categories: Electronics, School Supplies, Furniture & Home, Clothing, Dorm Essentials, Kitchen & Appliances, Books & Textbooks, Beauty & Personal Care, Sports & Fitness, Gaming, Other. Conditions: New, Like New, Good, Fair, Poor.`;
app.post("/api/analyze-item", requireUser, async (req, res) => { const { image, filename = "uploaded item" } = req.body ?? {}; if (!process.env.OPENAI_API_KEY) return respond(res, 503, { error: "AI analysis is not configured yet. Add OPENAI_API_KEY on the server." }); if (typeof image !== "string" || !image.startsWith("data:image/")) return respond(res, 400, { error: "A valid item image is required." }); try { const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); const result = await openai.chat.completions.create({ model: process.env.OPENAI_MODEL || "gpt-5.6", response_format: { type: "json_object" }, messages: [{ role: "system", content: agentInstructions }, { role: "user", content: [{ type: "text", text: `Analyze this secondhand item (${filename}).` }, { type: "image_url", image_url: { url: image, detail: "high" } }] }] }); const output = JSON.parse((result.choices[0]?.message?.content || "{}").replace(/^```json\s*|\s*```$/g, "")); if (!output.title || !output.description || !Number.isFinite(Number(output.recommended_listing_price))) throw new Error("Incomplete model response"); respond(res, 200, output); } catch (error) { console.error("Hive listing agent failed:", error); respond(res, 502, { error: "AI listing analysis could not be completed." }); } });

app.use(express.static(path.join(root, "dist")));
app.use((_req, res) => res.sendFile(path.join(root, "dist", "index.html")));
app.listen(port, () => console.log(`Hive is running at http://localhost:${port}`));
