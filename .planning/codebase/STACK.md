# Technology Stack

**Analysis Date:** 2026-03-26

## Languages

**Primary:**
- TypeScript 5.7.2 - All application code (`app/`, `lib/`, `components/`, `middleware.ts`)
- CSS - Global styles via Tailwind (`app/globals.css`)

**Secondary:**
- JavaScript - Config files (`jest.config.js`, `postcss.config.js`, `jest.setup.js`)
- SQL - Raw SQL fragments in Drizzle queries and migration files (`lib/migrations/`)

## Runtime

**Environment:**
- Node.js 20 (specified in CI workflow `.github/workflows/pr-tests.yml`)
- Next.js Edge Runtime compatible (password hashing uses Web Crypto API in `lib/auth-helpers.ts`)

**Package Manager:**
- pnpm 8 (lockfile: `pnpm-lock.yaml`, CI uses `pnpm/action-setup@v3` with version 8)
- Lockfile: present

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework with App Router (`next.config.ts`)
- React 19.0.0 - UI rendering (`app/`, `components/`)
- React DOM 19.0.0 - DOM rendering

**Testing:**
- Jest 29.7.0 - Test runner (`jest.config.js`)
- jest-environment-jsdom 30.0.0-beta.3 - Browser environment simulation
- Testing Library React 16.3.0 - Component testing
- Testing Library jest-dom 6.6.3 - DOM assertions
- Testing Library user-event 14.6.1 - User interaction simulation
- nock 14.0.1 - HTTP mocking
- node-mocks-http 1.17.2 - Mock HTTP request/response objects

**Build/Dev:**
- TypeScript 5.7.2 - Type checking (`tsconfig.json`)
- PostCSS 8.4.49 - CSS processing (`postcss.config.js`)
- Tailwind CSS 3.4.17 - Utility-first CSS (`tailwind.config.ts`)
- ESLint 9 + eslint-config-next 16.1.6 - Linting (`eslint.config.mjs`)
- Prettier 3.4.2 - Code formatting (config in `package.json`)
- Husky 9.1.7 - Git hooks (`.husky/`)
- tsx 4.19.3 - TypeScript execution for scripts (`scripts/run-migrations.ts`, `lib/migrate.ts`)

## Key Dependencies

**Critical (production):**
- `next-auth` 5.0.0-beta.30 - Authentication (JWT sessions, credentials provider) - `lib/auth.ts`
- `@neondatabase/serverless` 0.9.5 - PostgreSQL database driver (serverless-compatible) - `lib/db.ts`
- `drizzle-orm` 0.31.4 - SQL ORM / query builder - `lib/db.ts`
- `drizzle-kit` 0.22.8 - Database migration tooling - `drizzle.config.ts`
- `drizzle-zod` 0.5.1 - Zod schema generation from Drizzle tables - `lib/db.ts`
- `zod` 3.24.1 - Input validation - `lib/auth.ts`
- `nodemailer` 7.0.11 - Email sending for reminders - `app/api/cron/check-reminders/route.ts`, `app/api/reminders/route.ts`, `app/(dashboard)/actions.ts`
- `bcryptjs` 3.0.2 - Legacy password comparison (being migrated away from) - listed in deps but `lib/auth-helpers.ts` uses Web Crypto API

**UI:**
- `@radix-ui/react-dialog` 1.1.4 - Modal dialogs - `components/ui/dialog.tsx`
- `@radix-ui/react-dropdown-menu` 2.1.4 - Dropdown menus - `components/ui/dropdown-menu.tsx`
- `@radix-ui/react-label` 2.1.2 - Form labels - `components/ui/label.tsx`
- `@radix-ui/react-slot` 1.1.1 - Component composition - `components/ui/button.tsx`
- `@radix-ui/react-switch` 1.1.3 - Toggle switches - `components/ui/switch.tsx`
- `@radix-ui/react-tabs` 1.1.2 - Tab components - `components/ui/tabs.tsx`
- `@radix-ui/react-tooltip` 1.1.6 - Tooltips - `components/ui/tooltip.tsx`
- `lucide-react` 0.400.0 - Icon library - `components/icons.tsx`
- `recharts` 2.15.3 - Charting library for analytics - `app/(dashboard)/events/[id]/analytics-charts.tsx`
- `class-variance-authority` 0.7.1 - Component variant styling - UI components
- `clsx` 2.1.1 + `tailwind-merge` 2.6.0 - Class name utilities - `lib/utils.ts`
- `tailwindcss-animate` 1.0.7 - Animation utilities - `tailwind.config.ts`
- `next-themes` 0.4.6 - Dark/light theme support - `app/(dashboard)/providers.tsx`
- `fuse.js` 7.1.0 - Fuzzy search client-side

**Infrastructure:**
- `@vercel/analytics` 1.4.1 - Usage analytics - `app/layout.tsx`
- `next-pwa` 5.6.0 - Progressive Web App support
- `date-fns` 4.1.0 - Date utility functions
- `dotenv` 16.4.7 - Environment variable loading for scripts - `lib/db-migration.ts`, `drizzle.config.ts`
- `server-only` 0.0.1 - Ensures server-side module isolation - `lib/db.ts`

## TypeScript Configuration

**Key settings** (`tsconfig.json`):
- Target: ES5
- Module: ESNext with bundler resolution
- Strict mode: enabled (but `noImplicitAny: false`, `strictNullChecks: false`)
- Path alias: `@/*` maps to `./*` (project root)
- JSX: react-jsx
- Incremental compilation: enabled

## Build & Scripts

**Commands** (`package.json`):
- `pnpm dev` - Next.js development server
- `pnpm build` - Production build
- `pnpm start` - Production server
- `pnpm lint` - ESLint
- `pnpm test` - Jest test runner
- `pnpm test:watch` - Jest watch mode
- `pnpm test:coverage` - Jest with coverage
- `pnpm migrate` - Run migrations via `tsx lib/migrate.ts`
- `pnpm db:migrate` - Run migrations via `tsx scripts/run-migrations.ts`
- `pnpm prepare` - Install Husky git hooks

## Platform Requirements

**Development:**
- Node.js 20
- pnpm 8
- PostgreSQL (Neon serverless or local Postgres 15 for testing)
- SMTP server for email features (optional for local dev)

**Production:**
- Vercel (`.vercel/` directory present, `@vercel/analytics` used)
- Neon PostgreSQL (serverless driver)
- SMTP service for email reminders

## CI/CD

**GitHub Actions** (`.github/workflows/pr-tests.yml`):
- Runs on pull requests to main
- PostgreSQL 15 service container for integration tests
- Steps: pnpm install, lint, test (--runInBand), build
- Additional workflows: `claude.yml`, `claude-code-review.yml`, `pr-review.yml`

---

*Stack analysis: 2026-03-26*
