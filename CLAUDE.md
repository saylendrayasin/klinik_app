# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # dev server with Turbopack
npm run dev-clear    # wipe .next cache then dev
npm run build        # production build (also regenerates SW via @ducanh2912/next-pwa)
npm run lint         # ESLint
```

No test suite exists in this project.

## Required Environment Variables

```
MONGODB_URI       # MongoDB connection string
JWT_SECRET        # Secret for jose JWT signing (HS256)
AUTH_USERNAME     # Single admin username (plaintext)
AUTH_PASSWORD     # Single admin password (plaintext)
```

## Architecture

Next.js 15 App Router, single-user clinic management app. No TypeScript — plain JS with `@/*` alias pointing to `src/`.

### Auth Flow

- Login: `POST /api/auth/login` signs JWT with `jose` `SignJWT` (HS256), sets `httpOnly` cookie `token`
- Middleware (`src/middleware.js`): runs on Edge Runtime, verifies token via `jwtVerify` from `jose`, guards all non-public routes
- Client auth hook: `src/lib/auth.js` — `useAuth()` returns `{ signIn, signOut }`
- Public paths: `/login`, `/api/auth/login`, `/manifest.json`, `/offline.html`, `/favicon.ico`, `/icons/*`

### Data Modules

Three Mongoose models, each with its own API route group:

| Module | Model | Route | Notes |
|---|---|---|---|
| Pasien | `src/models/patient.js` | `/api/patients` | Has embedded `visits[]` array; `diagnosis` + `diagnosisIds` auto-derived from visits on PATCH |
| KB (Keluarga Berencana) | `src/models/kb.js` | `/api/kb` | Has embedded `visits[]`; `metodes[]` auto-derived from visits on PATCH. `nik` is unique. Export to Excel via `/api/kb/export` |
| Config | `src/models/config.js` | `/api/config` | Lookup table for diagnosis codes. Keyed by `type`+`code` (unique compound index). `code` is auto-slugified from `label` |

### API Response Helpers (`src/lib/response.js`)

Always use these — do not use raw `Response.json()` or `NextResponse.json()` in route handlers:

```js
successResponse(message, data, statusCode?)       // { message, data, status: "success" }
paginatedResponse(message, data, page, totalPages) // adds page+totalPages to success shape
errorResponse(message, statusCode?, data?)         // { message, data, status: "error" }
```

### Pagination Pattern

All list GET routes (`/api/patients`, `/api/kb`, `/api/config`) accept:
- `page`, `limit`, `search`, `sort`
- `sort` is whitelisted per route — invalid values fall back to default
- `search` input is regex-escaped before passing to MongoDB `$regex`

### DB Connection

`src/lib/database.js` — `connectDB()` uses `global.mongoose` for connection caching across hot-reloads. Always call `await connectDB()` at the top of every route handler.

### Client Data Fetching

`src/lib/fetcher.js` — use `fetcher(url, options?)` for all client-side API calls. Handles 401/403 by auto-signing out. Do not use raw `fetch()` in page components.

### PWA

`@ducanh2912/next-pwa` configured in `next.config.mjs`. Service worker generated to `public/sw.js` on build. All `/api/*` POST/PATCH/DELETE routes are `NetworkOnly`. API GETs for patients/public/data are `StaleWhileRevalidate`.

### UI Conventions

- Tailwind CSS v4 for all styling
- `react-hot-toast` for all user feedback (no `window.confirm`, no `alert`)
- `framer-motion` for sidebar animation
- `lucide-react` + `react-icons` for icons (both are used — don't consolidate)
- Mobile: card layout. Desktop: table layout. Both rendered in same component, toggled with `sm:` breakpoint.
