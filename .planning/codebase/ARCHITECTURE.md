# Architecture

**Analysis Date:** 2026-03-26

## Pattern Overview

**Overall:** Server-rendered Next.js App Router monolith with serverless database

**Key Characteristics:**
- Next.js 16 App Router with React Server Components as the default rendering strategy
- Server Actions for all data mutations (no REST API for CRUD)
- Neon serverless PostgreSQL via Drizzle ORM (HTTP driver, not persistent connections)
- JWT-based authentication via NextAuth v5 (beta) with credentials provider
- Vercel-hosted with Vercel Cron for scheduled tasks
- PWA-enabled (service worker in `public/sw.js`, manifest in `public/manifest.json`)

## Layers

**Presentation (React Components):**
- Purpose: Render UI, handle user interactions
- Location: `app/(dashboard)/` for dashboard views, `app/login/` and `app/signup/` for auth pages, `components/` for shared UI primitives
- Contains: Server Components (pages, layouts), Client Components (interactive widgets)
- Depends on: Server Actions, `lib/db.ts`, `lib/auth.ts`
- Used by: End users via browser

**Server Actions (Mutation Layer):**
- Purpose: Handle all form submissions and data mutations
- Location: `app/(dashboard)/actions.ts` (event CRUD, email), `app/login/actions.ts` (login), inline in `app/signup/page.tsx` (registration)
- Contains: `'use server'` functions that validate input, authenticate, mutate data, and call `revalidatePath`
- Depends on: `lib/db.ts`, `lib/auth.ts`, `nodemailer`
- Used by: Form `action` attributes in components

**API Routes (External-facing endpoints):**
- Purpose: NextAuth handlers, cron jobs, utility endpoints
- Location: `app/api/`
- Contains:
  - `app/api/auth/[...nextauth]/route.ts` - NextAuth GET/POST handlers
  - `app/api/cron/check-reminders/route.ts` - Daily cron endpoint (GET, bearer-token protected)
  - `app/api/reminders/route.ts` - Manual reminder trigger (POST)
  - `app/api/seed/route.ts` - Development seed data (GET)
  - `app/api/migration-status/route.ts` - Database migration health check
- Depends on: `lib/db.ts`, `nodemailer`, `lib/auth.ts`
- Used by: NextAuth internally, Vercel Cron, admin tools

**Data Access (Database Layer):**
- Purpose: Schema definition, query functions, database connection
- Location: `lib/db.ts`
- Contains: Drizzle schema definitions (tables, types, enums), all query/mutation functions, database connection singleton
- Depends on: `@neondatabase/serverless`, `drizzle-orm`, `POSTGRES_URL` env var
- Used by: Server Actions, API Routes, Server Components (read-only)

**Authentication:**
- Purpose: Session management, credential verification
- Location: `lib/auth.ts` (NextAuth config), `lib/auth-helpers.ts` (password hashing/comparison)
- Contains: NextAuth v5 configuration with JWT strategy, Credentials provider, password migration logic
- Depends on: `lib/db.ts` (getUserByEmail), Web Crypto API (PBKDF2)
- Used by: Middleware, Server Actions, Server Components, API routes

**Migration System:**
- Purpose: Database schema evolution and health checking
- Location: `lib/migrations/` (individual migration scripts), `lib/migrate.ts`, `lib/migration-checker.ts`, `lib/db-migration.ts`, `scripts/run-migrations.ts`
- Contains: SQL migration files in `drizzle/migrations/`, TypeScript migration scripts in `lib/migrations/`, migration status checker
- Depends on: `drizzle-kit`, `@neondatabase/serverless`, filesystem
- Used by: CLI scripts (`pnpm migrate`, `pnpm db:migrate`), `app/api/migration-status/route.ts`

## Data Flow

**Page Load (Dashboard):**

1. Browser requests `/` - middleware in `middleware.ts` runs, checks auth session
2. If logged in and hitting `/login` or `/signup`, redirect to `/`
3. `app/(dashboard)/page.tsx` (Server Component) calls `auth()` to get session
4. If no session, redirect to `/login`
5. Calls `getEvents(session.user.email)` from `lib/db.ts` - HTTP query to Neon
6. Renders `<EventsTable>` (Client Component) with event data passed as props
7. Client-side: Fuse.js fuzzy search and sort happen in browser state

**Event Mutation (Reset):**

1. User clicks reset button in `EventCard` or `ResetButton` component
2. Form submits to `resetEvent` Server Action in `app/(dashboard)/actions.ts`
3. Action reads event from DB, checks `resettable` flag
4. Updates event date and increments `reset_count` via raw SQL
5. Inserts record into `event_resets` table
6. Calls `revalidatePath('/')` to invalidate cached page data
7. Next.js re-renders the page with fresh data

**Reminder Cron:**

1. Vercel Cron hits `GET /api/cron/check-reminders` daily at midnight (configured in `vercel.json`)
2. Validates `Authorization: Bearer {CRON_SECRET}` header
3. Queries events where `reminder_days IS NOT NULL` and days elapsed >= reminder threshold
4. Groups events by `userId` (which is the user's email address)
5. Sends consolidated email per user via Nodemailer/SMTP
6. Updates `reminder_sent` and `last_reminder_sent_at` on processed events

**State Management:**
- No client-side global state store (no Redux, Zustand, etc.)
- Server Components fetch data directly from the database on each request
- Client-side state is local to components (`useState` for search queries, sort config, modal open state)
- Theme state managed by `next-themes` provider in `app/(dashboard)/providers.tsx`
- URL search params used for global search (`?q=...`) via `app/(dashboard)/search.tsx`
- Cache invalidation via `revalidatePath('/')` after mutations

## Key Abstractions

**Event (Domain Entity):**
- Purpose: Core domain object - something the user tracks "days since"
- Schema: `lib/db.ts` lines 51-65 (`events` table)
- Fields: `id`, `userId` (email string), `name`, `date` (ISO string), `resetCount`, `reminderDays`, `reminderSent`, `lastReminderSentAt`, `isPrivate`, `resettable`
- Note: `userId` stores the email address, not a numeric foreign key

**EventReset (Audit Record):**
- Purpose: Records each time an event was reset, enabling analytics
- Schema: `lib/db.ts` lines 67-73 (`event_resets` table)
- Fields: `id`, `eventId` (FK to events with cascade delete), `resetAt`

**User:**
- Purpose: Authentication credential storage
- Schema: `lib/db.ts` lines 24-39 (`users` table)
- Fields: `id`, `email`, `passwordHash`, `name`, `username`, `createdAt`

**Products (Legacy/Template):**
- Purpose: Leftover from the Next.js admin dashboard template this project was bootstrapped from
- Schema: `lib/db.ts` lines 41-49 (`products` table)
- Note: Still has CRUD functions but is not part of the core domain

## Entry Points

**Root Layout:**
- Location: `app/layout.tsx`
- Triggers: Every page render
- Responsibilities: Sets global HTML structure, imports global CSS, includes Vercel Analytics

**Dashboard Layout:**
- Location: `app/(dashboard)/layout.tsx`
- Triggers: All routes within the `(dashboard)` route group (/, /add, /edit/[id], /events/[id], /admin, /customers)
- Responsibilities: Wraps children in `Providers` (ThemeProvider + TooltipProvider), renders desktop sidebar nav, mobile nav sheet, breadcrumb, user avatar dropdown

**Middleware:**
- Location: `middleware.ts`
- Triggers: All requests except `api`, `_next/static`, `_next/image`, `favicon.ico`
- Responsibilities: Redirects authenticated users away from `/login` and `/signup`. Does NOT enforce auth on protected routes (that happens in individual page components).

**NextAuth Route:**
- Location: `app/api/auth/[...nextauth]/route.ts`
- Triggers: `/api/auth/*` requests (sign-in, sign-out, session, CSRF)
- Responsibilities: Delegates to NextAuth handlers from `lib/auth.ts`

## Error Handling

**Strategy:** Minimal - primarily `try/catch` with `console.error` and re-throw

**Patterns:**
- Server Actions throw errors on auth failure (`throw new Error('You must be logged in...')`) - Next.js surfaces these as error boundaries
- `app/(dashboard)/error.tsx` is the error boundary for the dashboard route group - displays a setup instructions page (assumes DB schema issue)
- API routes return `NextResponse.json({ error: '...' }, { status: 500 })` for failures
- Database functions in `lib/db.ts` use try/catch with console.error then re-throw
- Auth `authorize` function returns `null` on failure (NextAuth convention) rather than throwing
- No global error tracking service (Sentry, etc.) - errors go to console only
- The cron reminder endpoint continues processing other users if one user's email fails

## Cross-Cutting Concerns

**Logging:** `console.log` and `console.error` throughout. Heavy debug logging in auth flow and reminder system with emoji prefixes (e.g., `console.log('📧 Reminders API: ...')`). No structured logging framework.

**Validation:** Zod schemas used for auth credential validation in `lib/auth.ts` and `app/signup/page.tsx`. Form data in Server Actions uses manual type assertions (`formData.get('name') as string`) with basic null checks but no Zod validation for event mutations.

**Authentication:** Checked per-page in Server Components via `const session = await auth()` followed by `if (!session?.user?.email) redirect('/login')`. No centralized auth guard. Middleware only handles the reverse case (redirect logged-in users away from auth pages).

**Authorization:** Flat model - all authenticated users can access all features. Event ownership checked by matching `events.userId` against `session.user.email`. The admin page (`/admin`) has no role-based access control - any authenticated user can access it.

---

*Architecture analysis: 2026-03-26*
