# AGENTS Instructions

## Setup

This repository uses **pnpm** (lockfile is committed). If `pnpm` is missing:

```bash
corepack enable pnpm
corepack prepare pnpm@9 --activate   # see version note below
pnpm install
```

Pin **pnpm 9**. `pnpm-lock.yaml` is `lockfileVersion: '9.0'`, and installing with pnpm 11 rewrites
~580 lines of peer-dependency annotations (`(supports-color@8.1.1)` suffixes) with no actual version
changes — pure diff noise. Note that `.github/workflows/pr-tests.yml` pins `version: 8` via
`pnpm/action-setup`, which predates `lockfileVersion 9.0`; that mismatch is unresolved, so don't
treat CI's 8 as the intended local version.

`pnpm-workspace.yaml` declares `allowBuilds` for `esbuild` and `sharp`. pnpm blocks post-install
build scripts by default and refuses to run *any* script while approvals are pending — without that
file, `pnpm dev` exits 1 with `ERR_PNPM_IGNORED_BUILDS`. Don't delete it.

## Environment

Do **not** hand-write `.env` from `.env.example`. The real values live in the Vercel project
`janaclazertechnols-projects/days-since-nextjs`, where the Neon integration injects the Postgres
vars. Pull them:

```bash
vercel link --yes
vercel env pull .env.local --environment=development
```

Set `NEXTAUTH_URL=http://localhost:3000` locally — Vercel has no development value for it, and
`env pull` preserves it if already present.

`lib/db.ts` connects with `@neondatabase/serverless`'s `neon()` HTTP driver, so `POSTGRES_URL` must
point at a Neon host (or the Neon local proxy). A plain local `postgres://` will not answer.

Vercel's Development environment points at the **same Neon branch as production**. This is
intentional for this project — testing against live data is accepted. Writes made while clicking
through the dev server are real.

### `.env` vs `.env.local`

Next.js loads `.env.local` automatically, but bare `dotenv/config` defaults to `.env`. `lib/migrate.ts`
handles this itself (`config({ path: '.env.local' })`); `scripts/run-migrations.ts` does not, so run it
with an explicit env file:

```bash
npx tsx --env-file=.env.local scripts/run-migrations.ts
```

## Running

```bash
pnpm dev          # http://localhost:3000 — `/` redirects to `/login` when signed out
pnpm db:migrate
```

## Before committing

```bash
pnpm lint
pnpm test
```

Before pushing, verify that tests and the build succeed:

```bash
pnpm test && pnpm build
```

Code style is enforced with Prettier and ESLint. Running `pnpm lint` will check formatting and lint
rules.

## Known warnings (not bugs — don't chase them)

- `The "middleware" file convention is deprecated. Please use "proxy" instead.` — Next 16 renamed the
  convention; `middleware.ts` still works.
- `caniuse-lite is N months old` — refresh with `npx update-browserslist-db@latest` when convenient.
