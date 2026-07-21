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

Yiquan Feng developed the frontend, UX, and product design. Yiyuan Feng developed the backend, APIs, database, and product design. Together, we combined the original Hive onboarding work with the marketplace interface and its persistent backend in one application.

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

## Codex Session ID

Primary Codex Session ID submitted for this project (Backend):

`019f6cfd-b969-7db0-8f55-e9e647bbf584`

This Session ID corresponds to the primary backend development thread, where the majority of the backend implementation, API integration, database development, and application integration work was completed. Additional Codex-assisted development also took place in separate team member sessions for frontend implementation and UI development, as described throughout this README.

## Collaboration with Codex

Codex was used throughout the project as a hands-on coding collaborator. It accelerated the workflow by helping translate product requirements and mobile-screen designs into working React components, connect those components to the Node server, and test that the complete application still built correctly after each change.

Yiquan Feng led the frontend, UX, and product-design decisions: Hive should be a verified student marketplace, listings should respect the selected campus scope, users should control and review AI-generated listing drafts, and the interface should stay mobile-first with clear privacy and safety information. Yiyuan Feng led the backend implementation decisions that made the app data-backed, including listings, images, profiles, messages, saved items, search history, carts, and orders.

On the engineering side, Yiyuan built the backend, database, and API connections for persistent local storage, authenticated school-email onboarding, Resend email hooks, Gemini listing analysis, campus-aware filters, message read states, and profile synchronization. Yiquan built and refined the responsive frontend screens and interaction flows. Codex accelerated this work by helping diagnose integration issues such as frontend mock data appearing instead of stored user data, invalid configuration values, and mismatched screen state.

GPT-5.6 and Codex contributed to the final result by helping plan implementation, generate and refine code, identify bugs, and package the project into a runnable GitHub repository. They were tools in the development process—not replacements for our product judgment: Yiquan and Yiyuan made the final decisions on the app's scope, user experience, visual direction, backend behavior, database structure, APIs, and marketplace rules.

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

- Yiquan Feng — Frontend, UX, and product design
- Yiyuan Feng — Backend, product design, APIs, and database
