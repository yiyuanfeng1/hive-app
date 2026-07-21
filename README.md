# Hive

Hive is a verified student marketplace for discovering, buying, and selling secondhand items within university communities.

## How to run 

Open [Hive Hackathon Demo](https://hive-hackathon-demo.onrender.com).

Use this judge-safe demo account:

- Email Address: judge@hive-demo.edu
- Password: HiveDemo2026!
Please give it a minute to load.
No installation is needed to review the demo.

## Features

- Verified student onboarding with school-email verification
- Campus, nearby-campus, and nationwide marketplace browsing
- Search, saved items, cart, checkout, and order flows
- AI-assisted listing creation and image analysis
- Listings, user profiles, reviews, and messaging
- Responsive mobile-first interface

## How We Built It

Hive combines a student-marketplace interface with a Node.js backend and persistent application state. The project connects onboarding, listings, profile data, search, cart actions, checkout flows, messaging, notifications, and campus filters into one application.

## How We Used Codex and GPT-5.6

Codex was our coding collaborator throughout the project. It accelerated the workflow by helping us integrate the original onboarding flow with the marketplace UI, connect frontend interactions to backend data, diagnose state and layout issues, and package the application for a live demo.

GPT-5.6 supported iterative engineering and product work inside Codex, including implementation planning, debugging, data-flow review, responsive UI refinement, and documentation. We made the final product, engineering, UX, and visual-design decisions as a team.

## Key Decisions

- University verification supports a more trusted marketplace community.
- Listings created by a seller are reflected across the marketplace and profile flows.
- Campus selection changes the inventory shown to users.
- Mobile-first usability, readable typography, and clear actions were prioritized.
- Payment and delivery screens are currently demo flows; live payment integrations are a future launch step.

## Challenges

- Keeping frontend state synchronized across listings, profiles, search, cart, and messages
- Integrating separately developed frontend and backend work into one runnable app
- Preserving real user-created data while replacing mock UI content
- Maintaining visual consistency across many responsive marketplace screens

## Codex Session IDs

Hive was developed across two Codex sessions.

- Backend session ID: `019f6cfd-b969-7db0-8f55-e9e647bbf584`
- Frontend session ID: included in the hackathon submission form.

The backend session above represents the backend implementation, API integration, database and application-integration work. The separate frontend session represents the frontend implementation and UI development.

## Team

- Yiquan Feng — Frontend, UX, product design
- Yiyuan Feng — Backend, database, APIs, product design

