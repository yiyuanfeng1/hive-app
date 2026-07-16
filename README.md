# Hive authentication backend

This folder now contains a working local backend for the existing login, sign-up, and verification screens.

## Start it

1. In this folder, run `npm start`.
2. Open http://localhost:3000 in your browser. Do not open the HTML files directly.
3. Create an account with a `.edu` email and a password of 8+ characters.
4. Until you configure email below, the six-digit verification code is printed in the terminal running the server. Enter it on the verification page.

User accounts, password hashes, verification codes, and login sessions are stored locally in `data/hive.json`. That file is deliberately excluded from Git.

## Send real verification emails

1. Create a free account at [Resend](https://resend.com).
2. Add a domain you own and follow Resend's DNS instructions to verify it.
3. Create an API key in Resend.
4. Copy `.env.example` to a new file named `.env` and fill in `RESEND_API_KEY` and `RESEND_FROM`. The `RESEND_FROM` address must use your verified domain, for example `Hive <verify@yourdomain.com>`.
5. Stop the server with `Control + C`, then run `npm start` again.

Without a verified domain, Resend only permits test emails to the address that owns the Resend account.

## Before a public launch

Set a strong `SESSION_SECRET` in the environment, use HTTPS, and move data to a managed database. Never expose the verification code in a browser response.
