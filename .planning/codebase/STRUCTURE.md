# Codebase Structure

**Analysis Date:** 2026-03-26

## Directory Layout

```
days-since-nextjs/
├── app/                        # Next.js App Router pages and API routes
│   ├── (dashboard)/            # Route group for authenticated dashboard UI
│   │   ├── __tests__/          # Tests for dashboard actions and components
│   │   ├── add/                # /add route - add new event
│   │   ├── admin/              # /admin route - admin controls
│   │   ├── customers/          # /customers route (legacy/unused)
│   │   ├── edit/[id]/          # /edit/:id route - edit event
│   │   ├── events/[id]/        # /events/:id route - event analytics
│   │   │   └── __tests__/      # Tests for analytics components
│   │   ├── actions.ts          # Server Actions for event CRUD + email
│   │   ├── layout.tsx          # Dashboard shell (nav, header, providers)
│   │   ├── page.tsx            # / route - main dashboard (event list)
│   │   ├── providers.tsx       # Client-side context providers
│   │   └── [component].tsx     # Dashboard-specific components
│   ├── api/                    # API route handlers
│   │   ├── auth/[...nextauth]/ # NextAuth endpoints
│   │   ├── cron/check-reminders/ # Vercel Cron reminder job
│   │   ├── migration-status/   # DB migration health check
│   │   ├── reminders/          # Manual reminder trigger
│   │   └── seed/               # Development data seeding
│   ├── login/                  # /login route
│   ├── signup/                 # /signup route
│   ├── globals.css             # Global Tailwind CSS
│   ├── layout.tsx              # Root layout (html, body, Analytics)
│   └── favicon.ico             # App favicon
├── components/                 # Shared React components
│   ├── ui/                     # shadcn/ui primitives
│   └── [shared].tsx            # App-level shared components
├── lib/                        # Core library code
│   ├── __tests__/              # Tests for library modules
│   ├── hooks/                  # Custom React hooks
│   │   ├── __tests__/          # Hook tests
│   │   └── use-long-press.ts   # Long-press gesture hook
│   ├── migrations/             # TypeScript migration scripts
│   ├── auth.ts                 # NextAuth v5 configuration
│   ├── auth-helpers.ts         # Password hashing/comparison (PBKDF2)
│   ├── db.ts                   # Database schema, connection, query functions
│   ├── schema.ts               # Standalone schema (partial, used by migrations)
│   ├── migrate.ts              # Migration runner entry point
│   ├── migration-checker.ts    # Migration status verification
│   ├── migration-health-check.ts # Migration health check utilities
│   ├── db-migration.ts         # Database migration helpers
│   └── utils.ts                # Tailwind cn() utility
├── drizzle/                    # Drizzle Kit output
│   ├── meta/                   # Drizzle migration metadata
│   └── migrations/             # Generated SQL migration files
├── scripts/                    # CLI utility scripts
│   ├── check-migrations.ts     # Check migration status
│   ├── create-users-table.js   # One-off table creation
│   ├── migrate-bcrypt-password.js # Password format migration
│   └── run-migrations.ts       # Run pending migrations
├── styles/                     # Additional stylesheets
├── public/                     # Static assets
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   ├── workbox-e9849328.js     # Workbox runtime
│   ├── placeholder-user.jpg    # Default avatar image
│   └── placeholder.svg         # Generic placeholder
├── .github/workflows/          # CI/CD pipelines
│   ├── claude-code-review.yml  # AI code review
│   ├── claude.yml              # Claude automation
│   ├── pr-review.yml           # PR review workflow
│   └── pr-tests.yml            # PR test runner
├── backups/                    # Database backup files
├── middleware.ts               # Next.js middleware (auth redirects)
├── next.config.ts              # Next.js configuration
├── drizzle.config.ts           # Drizzle Kit configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── jest.config.js              # Jest test configuration
├── jest.setup.js               # Jest setup (DOM matchers)
├── vercel.json                 # Vercel deployment config (cron jobs)
├── components.json             # shadcn/ui configuration
├── postcss.config.js           # PostCSS configuration
├── package.json                # Dependencies and scripts
└── pnpm-lock.yaml              # pnpm lockfile
```

## Directory Purposes

**`app/(dashboard)/`:**
- Purpose: All authenticated user-facing pages and their components
- Contains: Page components (Server Components), interactive client components, Server Actions, tests
- Key files: `page.tsx` (main dashboard), `actions.ts` (all event mutations), `layout.tsx` (dashboard shell)
- Route group pattern: parentheses mean this directory does not add a URL segment

**`app/api/`:**
- Purpose: REST-style API endpoints and webhook handlers
- Contains: Route handlers using `GET`/`POST` exports
- Key files: `auth/[...nextauth]/route.ts`, `cron/check-reminders/route.ts`

**`app/login/` and `app/signup/`:**
- Purpose: Public authentication pages (outside dashboard layout)
- Contains: Page component + server action for login; page component with inline server action for signup

**`components/ui/`:**
- Purpose: Reusable UI primitives from shadcn/ui
- Contains: `button.tsx`, `card.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `input.tsx`, `label.tsx`, `table.tsx`, `tabs.tsx`, `tooltip.tsx`, `badge.tsx`, `breadcrumb.tsx`, `checkbox.tsx`, `sheet.tsx`, `switch.tsx`
- Generated by: `npx shadcn-ui@latest add [component]` (configured in `components.json`)

**`components/`:**
- Purpose: App-level shared components that are not page-specific
- Contains: `icons.tsx` (spinner icon), `logout-button.tsx`

**`lib/`:**
- Purpose: Core business logic, database access, authentication, utilities
- Contains: Database schema + queries, auth config, password helpers, migration tools, hooks
- Key files: `db.ts` (schema + all DB functions), `auth.ts` (NextAuth config), `auth-helpers.ts` (password crypto)

**`lib/migrations/`:**
- Purpose: TypeScript migration scripts for schema changes applied programmatically
- Contains: `add-event-resets.ts`, `add-private-column.ts`, `add-reminder-columns.ts`, `add-reset-columns.ts`

**`drizzle/`:**
- Purpose: Drizzle Kit-generated SQL migrations and metadata
- Contains: SQL files in `migrations/`, snapshot metadata in `meta/`
- Generated: Yes (by `drizzle-kit generate`)
- Committed: Yes

**`scripts/`:**
- Purpose: One-off CLI scripts for database operations
- Contains: Migration runners, table creation, password format migration
- Run via: `tsx scripts/[name].ts` or `pnpm db:migrate`

**`public/`:**
- Purpose: Static files served at root URL
- Contains: PWA manifest, service worker, placeholder images

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root HTML layout, global CSS import, Vercel Analytics
- `app/(dashboard)/layout.tsx`: Dashboard shell with navigation, auth context
- `middleware.ts`: Request interceptor for auth redirects

**Configuration:**
- `next.config.ts`: Image remote patterns
- `tsconfig.json`: TypeScript config with `@/*` path alias mapping to project root
- `drizzle.config.ts`: Drizzle Kit config pointing schema at `lib/db.ts`, output at `drizzle/`
- `tailwind.config.ts`: Tailwind theme, custom colors, animations
- `jest.config.js`: Jest config with jsdom environment, path aliases
- `vercel.json`: Cron job schedule (daily at midnight for reminders)
- `components.json`: shadcn/ui component configuration

**Core Logic:**
- `lib/db.ts`: All database schema definitions and query functions (404 lines)
- `lib/auth.ts`: NextAuth v5 setup with JWT sessions and Credentials provider
- `lib/auth-helpers.ts`: PBKDF2 password hashing, legacy format support, constant-time comparison
- `app/(dashboard)/actions.ts`: All event Server Actions (add, edit, delete, reset, resetWithDate, sendTestEmail)

**Testing:**
- `app/(dashboard)/__tests__/`: Dashboard component and action tests
- `app/(dashboard)/events/[id]/__tests__/`: Analytics page tests
- `lib/__tests__/`: Library module tests (auth-helpers, date-utils, db-analytics, migration-checker)
- `lib/hooks/__tests__/`: Hook tests
- `app/api/cron/check-reminders/__tests__/`: Cron endpoint integration test

## Naming Conventions

**Files:**
- Page components: `page.tsx` (Next.js convention)
- Layout components: `layout.tsx` (Next.js convention)
- Error boundaries: `error.tsx` (Next.js convention)
- Server Actions: `actions.ts` (co-located with the route group that uses them)
- Client Components: `kebab-case.tsx` (e.g., `event-card.tsx`, `reset-button.tsx`, `theme-toggle.tsx`)
- UI primitives: `kebab-case.tsx` in `components/ui/` (e.g., `dropdown-menu.tsx`)
- Library modules: `kebab-case.ts` (e.g., `auth-helpers.ts`, `migration-checker.ts`)
- Test files: `[name].test.ts` or `[name].test.tsx` in `__tests__/` directories
- Hooks: `use-kebab-case.ts` (e.g., `use-long-press.ts`)

**Directories:**
- Route groups: `(name)` for layout grouping without URL segments (e.g., `(dashboard)`)
- Dynamic routes: `[param]` (e.g., `[id]`)
- Catch-all routes: `[...param]` (e.g., `[...nextauth]`)
- Test directories: `__tests__/` co-located with the code they test
- Feature directories: `kebab-case` (e.g., `check-reminders`)

**Exports:**
- Default exports for page components and layouts (Next.js requirement)
- Named exports for reusable components (e.g., `export function EventCard`)
- Named exports for Server Actions (e.g., `export async function addEvent`)
- Named exports for database functions (e.g., `export async function getEvents`)

## Where to Add New Code

**New Page/Route:**
- If part of the authenticated dashboard: `app/(dashboard)/[route-name]/page.tsx`
- If a public page: `app/[route-name]/page.tsx`
- Dynamic route: `app/(dashboard)/[route-name]/[id]/page.tsx`

**New Server Action:**
- For event-related mutations: Add to `app/(dashboard)/actions.ts`
- For a new domain area: Create `app/(dashboard)/[feature]/actions.ts` or add to the route group's `actions.ts`

**New API Endpoint:**
- Create `app/api/[endpoint-name]/route.ts` with exported `GET`/`POST`/etc. functions

**New Database Table or Query:**
- Schema definition: Add to `lib/db.ts` (table definition + types + insert schema)
- Query functions: Add to `lib/db.ts` (co-located with schema)
- Migration: Add SQL to `drizzle/migrations/` via `drizzle-kit generate`, or create TypeScript migration in `lib/migrations/`

**New Shared UI Component:**
- shadcn/ui primitive: Run `npx shadcn-ui@latest add [component]` (installs to `components/ui/`)
- Custom shared component: `components/[component-name].tsx`

**New Dashboard Component:**
- Co-locate with the page that uses it: `app/(dashboard)/[component-name].tsx`
- Or in the feature route directory: `app/(dashboard)/[feature]/[component-name].tsx`

**New Custom Hook:**
- Place in `lib/hooks/[hook-name].ts`
- Test in `lib/hooks/__tests__/[hook-name].test.ts`

**New Test:**
- Co-locate test in `__tests__/` directory adjacent to the code being tested
- Name: `[feature-or-module].test.ts` or `[feature-or-module].test.tsx`

**Utilities:**
- Shared helpers: Add to `lib/utils.ts` or create `lib/[utility-name].ts`

## Special Directories

**`@/components/ui/`:**
- Purpose: shadcn/ui generates a physical `@/` directory at project root (artifact of the shadcn path alias config)
- Generated: Yes (by shadcn/ui CLI)
- Committed: Yes
- Note: The `@/*` path alias in `tsconfig.json` maps to the project root, so `@/components/ui/button` resolves to `./components/ui/button.tsx`. The physical `@/` directory at root appears to be a shadcn artifact and should not be used directly.

**`drizzle/`:**
- Purpose: Generated SQL migrations and metadata from `drizzle-kit`
- Generated: Yes
- Committed: Yes

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes
- Committed: No (in `.gitignore`)

**`backups/`:**
- Purpose: Database backup files
- Generated: Manual
- Committed: Yes

**`~/.cursor/`:**
- Purpose: Cursor AI editor config (accidentally nested in project root)
- Generated: Yes
- Committed: Likely unintentional

---

*Structure analysis: 2026-03-26*
