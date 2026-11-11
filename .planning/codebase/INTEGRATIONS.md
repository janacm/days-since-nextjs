# External Integrations

**Analysis Date:** 2026-03-26

## APIs & External Services

**Vercel Analytics:**
- Purpose: Usage/page view analytics
- SDK: `@vercel/analytics` 1.4.1
- Integration: `<Analytics />` component in `app/layout.tsx`
- Auth: Automatic via Vercel deployment (no env var needed)

**Vercel Blob Storage:**
- Purpose: Remote image hosting (avatar/profile images)
- Integration: Configured in `next.config.ts` as allowed remote image pattern (`*.public.blob.vercel-storage.com`)
- No SDK imported directly; used via Next.js `<Image>` component

## Data Storage

**Database:**
- Provider: Neon PostgreSQL (serverless)
- Driver: `@neondatabase/serverless` 0.9.5
- ORM: `drizzle-orm` 0.31.4 with `drizzle-orm/neon-http` adapter
- Connection: env var `POSTGRES_URL`
- Schema definition: `lib/db.ts` (inline with queries)
- Migration config: `drizzle.config.ts` (points schema to `lib/db.ts`, output to `drizzle/`)
- Custom migrations: `lib/migrations/` (4 migration files run via `tsx`)
- Drizzle Kit migrations: `drizzle/migrations/`

**Database Tables:**
- `users` - User accounts (id, email, password_hash, name, username)
- `events` - Tracked events (id, user_id, name, date, reset_count, reminder fields, is_private, resettable)
- `event_resets` - Reset history per event (id, event_id, reset_at)
- `products` - Legacy/demo products table (id, image_url, name, status, price, stock)

**File Storage:**
- No direct file upload; remote images via Vercel Blob and GitHub avatars

**Caching:**
- None (relies on Next.js built-in caching and `revalidatePath()`)

## Authentication & Identity

**Auth Provider:**
- NextAuth.js v5 (beta 30) - `lib/auth.ts`
- Strategy: JWT sessions (30-day max age)
- Provider: Credentials only (email + password)
- No OAuth providers configured (GitHub OAuth env vars exist in `.env.example` but are not wired into providers)

**Auth Flow:**
- Login page: `app/login/page.tsx` with server action `app/login/actions.ts`
- Signup page: `app/signup/page.tsx`
- Auth API route: `app/api/auth/[...nextauth]/route.ts` (delegates to `lib/auth.ts` handlers)
- Middleware: `middleware.ts` - Redirects authenticated users away from login/signup pages
- Session check: `auth()` called in server actions and middleware

**Password Hashing:**
- Current: PBKDF2 with salt via Web Crypto API (`lib/auth-helpers.ts`) - Edge Runtime compatible
- Legacy support: SHA-256 (64-char hashes) with auto-migration to PBKDF2 on login
- Deprecated: bcrypt (60-char hashes) - cannot verify in Edge Runtime, requires password reset

**Required env vars:**
- `AUTH_SECRET` - NextAuth.js session encryption secret
- `NEXTAUTH_URL` - Base URL for auth callbacks (e.g., `http://localhost:3000`)

## Email / SMTP

**Service:** Configurable SMTP (references suggest Mailtrap for dev/test)
- Library: `nodemailer` 7.0.11
- Used in three places:
  - `app/api/cron/check-reminders/route.ts` - Cron-triggered reminder emails
  - `app/api/reminders/route.ts` - On-demand reminder processing
  - `app/(dashboard)/actions.ts` - Test email from admin page

**Required env vars:**
- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP port (587 default, 465 for secure)
- `SMTP_USER` - SMTP auth username
- `SMTP_PASS` - SMTP auth password
- `SMTP_FROM` - Sender email (falls back to `SMTP_USER`)

**Cron Endpoint:**
- `GET /api/cron/check-reminders` - Protected by `CRON_SECRET` Bearer token
- Queries events where `reminder_days` threshold is met and sends batched emails per user
- Updates `reminder_sent` and `last_reminder_sent_at` fields after sending

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry, Datadog, etc.)

**Logs:**
- `console.log` / `console.error` throughout (verbose in auth and reminder flows)
- No structured logging library

**Analytics:**
- Vercel Analytics (`@vercel/analytics`) for page views

## CI/CD & Deployment

**Hosting:**
- Vercel (`.vercel/` config directory present)
- Serverless functions for API routes

**CI Pipeline:**
- GitHub Actions (`.github/workflows/pr-tests.yml`)
- Triggers on PRs to main
- Spins up Postgres 15 service container
- Runs: lint, test, build
- Additional workflows for Claude code review

## Environment Configuration

**Required env vars (from `.env.example` and code analysis):**

| Variable | Purpose | Used In |
|----------|---------|---------|
| `POSTGRES_URL` | Neon PostgreSQL connection string | `lib/db.ts`, `lib/db-migration.ts`, `drizzle.config.ts` |
| `AUTH_SECRET` | NextAuth session encryption | `lib/auth.ts` (via NextAuth) |
| `NEXTAUTH_URL` | Auth callback base URL | `lib/auth.ts` (via NextAuth) |
| `AUTH_GITHUB_ID` | GitHub OAuth client ID | `.env.example` (not currently wired) |
| `AUTH_GITHUB_SECRET` | GitHub OAuth client secret | `.env.example` (not currently wired) |
| `SMTP_HOST` | Email server hostname | `app/api/cron/check-reminders/route.ts`, `app/api/reminders/route.ts` |
| `SMTP_PORT` | Email server port | Same as above |
| `SMTP_USER` | Email auth username | Same as above |
| `SMTP_PASS` | Email auth password | Same as above |
| `SMTP_FROM` | Sender email address | Same as above (optional, falls back to SMTP_USER) |
| `CRON_SECRET` | Bearer token for cron endpoint auth | `app/api/cron/check-reminders/route.ts` |

**Env files present:**
- `.env` - Base environment variables
- `.env.local` - Local overrides (primary for development, loaded by `drizzle.config.ts` and `lib/db-migration.ts`)
- `.env.example` - Template with required variable names
- `.env.test.local` - Test environment overrides

## Webhooks & Callbacks

**Incoming:**
- `GET /api/cron/check-reminders` - Designed for Vercel Cron or external cron service, authenticated via `CRON_SECRET`
- `POST /api/reminders` - Manual trigger for reminder processing (no auth check)

**Outgoing:**
- SMTP emails for event reminders (not webhook-based)

## PWA Support

**Progressive Web App:**
- `next-pwa` 5.6.0 configured
- Manifest referenced in `app/layout.tsx` metadata (`/manifest.json`)
- Apple Web App meta tags configured
- Icons: `icon-192x192.png` for Apple touch icon

---

*Integration audit: 2026-03-26*
