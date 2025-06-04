# AGENTS Instructions

This repository uses **pnpm** for development. Ensure dependencies are installed with `pnpm install`.

Copy `.env.example` to `.env` and provide any required values before running scripts.

Before committing any changes, run:

```bash
pnpm lint
pnpm test
```

Before pushing, verify that tests and the build succeed:

```bash
pnpm test && pnpm build
```

Code style is enforced with Prettier and ESLint. Running `pnpm lint` will check formatting and lint rules.
