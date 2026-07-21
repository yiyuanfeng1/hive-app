# Hive

Hive is a verified student marketplace for discovering, buying, and selling secondhand items within university communities.

## Features

- Verified student onboarding with school-email verification
- Campus, nearby-campus, and nationwide marketplace search
- Gemini AI-assisted listing creation from uploaded photos
- Product listings, cart, and checkout flows
- Messages, profiles, reviews, saved items, and search history
- Persistent local storage for development data
- Responsive, mobile-first interface

## How to Run

1. Install Node.js.
2. Clone this repository.
3. Run `npm install`.
4. Copy `.env.example` to `.env` and add private email and Gemini keys if you want those features enabled.
5. Run `npm start`.
6. Open [http://localhost:4173](http://localhost:4173).

`npm start` runs both the frontend and backend together. The local data file and `.env` stay private and are not uploaded to GitHub.

## How We Built It

The frontend, backend, product design, and UX were developed by Yiquan Feng. The project combines the original Hive onboarding work with the marketplace interface and its persistent backend in one application.

## How We Used Codex and GPT-5.6

Codex and GPT-5.6 helped us:

- Merge the original Hive onboarding code with the marketplace UI
- Implement navigation and marketplace interactions
- Build responsive product, cart, checkout, chat, and profile flows
- Connect frontend screens to backend storage for listings, messages, profiles, and search
- Diagnose layout, state-management, and data-flow issues
- Iterate on accessibility, typography, spacing, and visual consistency
- Review and package the final runnable application

We made the final product, engineering, UX, and visual-design decisions while using Codex as our coding collaborator.

> The current in-app listing analysis uses Gemini as the server-side AI provider. It suggests a draft only; users review and edit every listing before publishing.

## Key Decisions

- Verified university accounts improve marketplace trust
- Campus-specific inventory changes with the selected university
- Newly created listings appear in both the seller profile and home feed
- Reviews are separated from product listings
- Mobile-first interaction and accessibility were prioritized
- Private API keys remain server-only and are excluded from GitHub

## Challenges

- Keeping frontend state synchronized across listings, profiles, messages, and search
- Creating a cohesive experience across many marketplace flows
- Integrating frontend design work with persistent backend behavior
- Maintaining consistent responsive behavior
- Preserving private development data while publishing the codebase safely

## Team

- Yiquan Feng — Frontend, backend, product design, UX, database, and APIs
