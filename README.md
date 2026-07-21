# Hive

Hive is a student marketplace prototype for buying, selling, messaging, and arranging campus transactions. It has a mobile-first interface with real local app data: accounts, listings, photos, messages, carts, profiles, search history, campus filtering, and orders are saved by the server.

## What works today

- School-email sign-up, verification, sign-in, sign-out, and password-reset flow
- User profiles, profile photos, saved items, listings, carts, and orders
- Listing photos, publishing, editing, selection-based deletion, and campus filters
- Direct messages, unread-message counts, and read status when a recipient opens a conversation
- Search over published listings and each user's real search history
- Gemini-assisted listing drafts from an uploaded image; every suggestion stays editable before publishing
- Checkout choices for campus meetup, delivery, card, Venmo, and pay-at-pickup

> Card, Venmo, and delivery choices are currently prototype flows. No real payment is processed and no delivery service is booked yet.

## Run Hive on your Mac

1. Install a current version of Node.js.
2. In this project folder, install the app's packages:

   ```bash
   npm install
   ```

3. Create your private settings file from the safe template:

   ```bash
   cp .env.example .env
   ```

4. Open `.env` and add your own private keys and sender information.
5. Start the complete app:

   ```bash
   npm start
   ```

6. Open [http://localhost:4173](http://localhost:4173) in your browser.

`npm start` builds the React interface and starts the Hive server together.

## Private settings

The `.env` file is private and must never be committed or uploaded to GitHub. It may include:

```text
PORT=4173
SESSION_SECRET=a-long-random-secret
APP_URL=http://localhost:4173

RESEND_API_KEY=your_resend_key
RESEND_FROM=Hive <a-verified-sender@your-domain.com>

GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=your-supported-gemini-model
```

- **Resend** sends school-verification codes and password-reset links. Without its settings, codes appear in the Terminal only for local testing.
- **Gemini** creates listing suggestions from a photo. Without its key, the rest of Hive continues working, but AI analysis is unavailable.
- Never put these keys inside React files or share them in screenshots.

## Where the current data is stored

During local development, the server saves data in `data/hive.json`. This includes accounts, password hashes, profile details, listings, images, messages, carts, saved items, orders, and search history.

That file is intentionally excluded from GitHub, so publishing this repository does **not** publish your existing local test accounts or private messages. Back up `data/hive.json` before moving computers or making major changes.

## GitHub and launch status

This repository safely stores the application code and makes future development easier. GitHub does **not** host the complete running app by itself.

Before giving the app to public users, Hive should be deployed to a hosting provider and moved from the local JSON file to a hosted database. Real payments and delivery integrations should be added as separate launch work, using approved providers such as Stripe and a delivery partner.

## Project structure

```text
src/App.tsx       Main React interface and live client behavior
src/styles.css     Hive visual design and responsive styling
server.mjs         Server, authentication, storage, email, and Gemini endpoints
data/hive.json     Local saved app data (private; not committed)
.env               Private keys and deployment settings (private; not committed)
.env.example       Safe settings template
```

## Safety note

Hive is a peer-to-peer marketplace prototype. Users should meet in public places, inspect items before paying, and avoid sharing passwords, verification codes, or other sensitive information.
