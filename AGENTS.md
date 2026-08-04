# AGENTS Instructions

## Setup

This repository uses **pnpm 9**. Use that version, not whatever `corepack enable pnpm` gives you:

```bash
corepack enable pnpm
corepack prepare pnpm@9 --activate
pnpm install
```

Three reasons pnpm 9 specifically:

- `pnpm-lock.yaml` is `lockfileVersion: '9.0'`. Installing with pnpm 11 rewrites ~580 lines of
  peer-dependency annotations (`(supports-color@8.1.1)` suffixes) with no actual version changes —
  pure diff noise. pnpm 9 leaves the lockfile untouched.
- Vercel picks pnpm 9 for this project on its own (`Detected pnpm-lock.yaml 9 ... Using pnpm@9.x
  based on project creation date`), so local pnpm 9 matches the deploy.
- pnpm 10+ blocks post-install build scripts and then refuses to run *any* script while approvals
  are pending, so `pnpm dev` exits 1 with `ERR_PNPM_IGNORED_BUILDS` for `esbuild` and `sharp`.
  pnpm 9 has no such gate and just builds them.

If you must use pnpm 10 or 11, run `pnpm approve-builds esbuild sharp` — but do **not** commit the
`pnpm-workspace.yaml` it generates. That file makes pnpm 9 treat the repo as a workspace, and it then
fails the Vercel build with `ERROR packages field missing or empty`. The `pnpm.onlyBuiltDependencies`
field in `package.json` is not an alternative — pnpm 11 ignores it.

`.github/workflows/pr-tests.yml` pins `version: 8` via `pnpm/action-setup`, which predates
`lockfileVersion 9.0`. That mismatch is unresolved; don't treat CI's 8 as the intended local version.

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
