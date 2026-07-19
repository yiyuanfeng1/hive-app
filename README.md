# Hive Marketplace

One Hive app combining the mobile marketplace interface, school-email authentication, persistent local storage, messages, profiles, carts, orders, listings, and an optional AI listing assistant.

## Run locally

```bash
npm install
npm run dev
```

To use the working backend, copy `.env.example` to `.env`, fill in the private values, then run:

```bash
npm start
```

Open http://localhost:4173. The working data lives in `data/hive.json`; it is deliberately excluded from GitHub. This is suitable for local development only. Before public launch, migrate it to a hosted database such as Supabase.

## What saves now

- `.edu` sign-up, email verification, secure password hashes, and login sessions
- Profile information and avatars
- Published listings, uploaded listing image data, carts, orders, conversations, and messages
- The AI listing draft is always editable before publishing

## AI listing assistant

The browser sends the selected camera or library image to Hive's server. Keep the API key on the server—never place it in `App.tsx` or the standalone HTML. The agent implements the requirements from the AI-listing PDF as instructions and structured JSON, including observed facts, estimates with confidence, a price range, a recommended price, and only essential confirmation questions. This is not model training or fine-tuning.

```bash
npm start
```

Then open `http://localhost:4173`. You may override the model with `OPENAI_MODEL`. The default is `gpt-5.6`.

The standalone HTML remains directly openable as a visual demo only. It cannot safely run email, storage, or AI features because it has no server.
