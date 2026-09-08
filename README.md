# TZ Hub — Unified Dashboard

Single dashboard to manage **Take & Bring**, **TZ Transport**, and **TZ Reifenservice** without modifying their existing sites.

## Setup

1. Copy `.env.example` to `.env.local`
2. Sync env from sibling projects (recommended):

```bash
npm run sync:env
```

This imports `DATABASE_URL`, Supabase URL, and service role keys from `Take-Bring/.env`, `time-zone/.env`, and `tz-refienservice/.env`.

3. Or copy manually from `.env.example` to `.env.local`

4. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with a **TZ Transport** (`time-zone`) dashboard user.

## Environment

| Variable | Purpose |
|----------|---------|
| `TZ_TRANSPORT_DATABASE_URL` | Auth (users + sessions) + TZ Transport data |
| `TAKE_BRING_DATABASE_URL` | Take & Bring data |
| `TZ_REIFENSERVICE_DATABASE_URL` | Reifenservice data |
| `AUTH_JWT_SECRET` | Access token signing |
| `AUTH_REFRESH_SECRET` | Refresh token signing |

## Architecture

- **No new database** — reads/writes each project's existing Postgres
- **Auth** — tz-transport `users` table (email + password, no OTP in hub)
- **Adapters** — normalize schema differences per project
- **UI** — monochromatic, mobile-responsive shell with project switcher

## Project access by role

| Role | Projects |
|------|----------|
| ADMIN | All three |
| EDITOR | Take & Bring, TZ Transport |
| VIEWER | TZ Transport only |

## Routes

- `/login` — Sign in
- `/{project}/overview` — KPIs
- `/{project}/website-analytics` — Analytics (7d / 30d)
- `/{project}/leads` — Lead management
- `/{project}/chatbot-leads` — TZ Transport only
- `/{project}/blogs` — Read-only blog list
- `/settings` — Change hub password

Projects: `take-bring`, `tz-transport`, `tz-reifenservice`
