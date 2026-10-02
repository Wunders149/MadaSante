# Mada Santé

Mada Santé is a full-stack healthcare platform for Madagascar that connects patients with medical and allied-health providers, services, and care coordination workflows. The app includes a patient-facing discovery and booking experience, provider management tools, and an admin console for approvals and oversight.

## Overview

The project combines:

- a Vite + React frontend for the patient, provider, and admin interfaces
- an Express + TypeScript API for authentication, catalog management, appointments, payments, and notifications
- a PostgreSQL/Supabase data layer with automatic schema bootstrapping on startup
- real-time updates through Socket.IO for emergency, delivery, and messaging flows

The product is designed around a healthcare marketplace model where a patient can find a doctor, nurse, laboratory, imaging center, pharmacy, ambulance, or other service and then complete the relevant workflow.

## Key features

### Patient experience

- search and browse providers and services by category
- discover doctors, nurses, practitioners, hospitals, pharmacies, labs, imaging centers, and NGOs
- book consultations or visits with dynamic pricing logic and payment flows
- review appointment history and service requests
- receive notifications and messaging updates
- request emergency support and delivery services
- navigate in French, Malagasy, and English

### Provider experience

- provider onboarding and application review flow
- profile and catalog setup for bookable health services
- appointment management and availability updates
- payment and request tracking
- messaging and operational dashboard

### Admin experience

- review incoming provider applications
- inspect patient and provider records
- manage platform configuration and fees
- monitor reports and settings

## Tech stack

### Frontend

- React 19
- Vite
- React Router
- TanStack Query
- Tailwind CSS

### Backend

- Node.js 22+
- Express 5
- TypeScript
- PostgreSQL via `pg`
- JWT-based authentication
- Zod validation
- Socket.IO

### Deployment and runtime

- Render configuration included in `render.yaml`
- production server serves the built frontend from the same origin
- environment-based configuration via `.env`

## Repository structure

```text
.
├── src/                    # React frontend application
│   ├── components/        # reusable UI and feature components
│   ├── i18n/              # translations (fr, mg, en)
│   ├── layouts/           # patient/provider/admin layouts
│   ├── lib/               # API helpers, role metadata, socket utilities
│   ├── pages/             # page modules by role
│   ├── stores/            # auth and app state providers
│   └── types/             # shared TypeScript interfaces
├── server/
│   ├── src/               # Express API and business logic
│   ├── data/              # generated or seed data
│   └── package.json       # backend scripts and dependencies
├── public/                # static public assets
├── .env.example           # template for environment variables
├── package.json           # root scripts for frontend + backend orchestration
├── render.yaml            # Render deployment config
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # root TypeScript config
├── index.html             # Vite entry point
└── README.md              # project documentation
```

## Prerequisites

- Node.js 22 or newer
- npm
- PostgreSQL database (local development or hosted service such as Supabase)

## Environment setup

1. Copy `.env.example` to `.env`.
2. Fill in the required values:

```env
PORT=3001
JWT_SECRET=change-me-in-production
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@host:5432/postgres
PG_SSL=true
ADMIN_EMAIL=
ADMIN_PASSWORD=
CORS_ORIGINS=
```

Important notes:

- `JWT_SECRET` is required in production and the server refuses to run if it is missing or still set to the default development placeholder.
- `DATABASE_URL` should point to your Postgres instance.
- If you are using Supabase, keep `PG_SSL=true` unless you intentionally run a local Postgres instance without TLS.

## Local development

Install dependencies from the root and server folders:

```bash
npm install
npm --prefix server install
```

Start the full stack:

```bash
npm run dev
```

This runs both:

- the backend API with `tsx watch`
- the frontend with Vite

Useful individual commands:

```bash
npm run dev:web
npm run dev:server
npm run build
npm run preview
```

## Production build

```bash
npm run build
npm start
```

`npm start` launches the compiled backend server, which also serves the built frontend if a production build exists.

## Database and seed scripts

The server bootstraps schema on launch and can create an admin user from environment variables.

Available scripts:

```bash
npm run seed:demo
npm run seed:demo:dry-run
npm run seed:demo:clean
npm run db:reset:dry-run
npm run db:reset
npm run db:admin -- --help
```

These support demo data setup, reset workflows, and admin CLI tasks.

## Tests

The project includes backend tests for business rules such as appointment transitions, fee logic, and password policy validation.

```bash
npm test
```

## Deployment

A Render deployment configuration is included in `render.yaml`. The stack is designed for:

- `npm install`
- `npm run build`
- `npm start`

Make sure to configure the required production environment variables in the Render dashboard, especially:

- `NODE_ENV=production`
- `PORT`
- `JWT_SECRET`
- `DATABASE_URL`

## Project status

This repository is a working prototype for a healthcare marketplace with a multi-role experience and real business-domain logic. The codebase already contains automated tests, but the current project status includes one known failing assertion in the appointment-role test suite, which should be addressed separately from the README update.

## License

This project does not currently declare a license file in the repository. If you intend to distribute or publish the app, add an explicit license before release.
