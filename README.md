<div align="center"><strong>Next.js 15 Admin Dashboard Template</strong></div>
<div align="center">Built with the Next.js App Router</div>
<br />
<div align="center">
<a href="https://next-admin-dash.vercel.app/">Demo</a>
<span> · </span>
<a href="https://vercel.com/templates/next.js/admin-dashboard-tailwind-postgres-react-nextjs">Clone & Deploy</a>
<span>
</div>

## Overview

This is a starter template using the following stack:

- Framework - [Next.js (App Router)](https://nextjs.org)
- Language - [TypeScript](https://www.typescriptlang.org)
- Auth - [Auth.js](https://authjs.dev)
- Database - [Postgres](https://vercel.com/postgres)
- Deployment - [Vercel](https://vercel.com/docs/concepts/next.js/overview)
- Styling - [Tailwind CSS](https://tailwindcss.com)
- Components - [Shadcn UI](https://ui.shadcn.com/)
- Analytics - [Vercel Analytics](https://vercel.com/analytics)
- Formatting - [Prettier](https://prettier.io)

This template uses the new Next.js App Router. This includes support for enhanced layouts, colocation of components, tests, and styles, component-level data fetching, and more.

## Getting Started

During the deployment, Vercel will prompt you to create a new Postgres database. This will add the necessary environment variables to your project.

Inside the Vercel Postgres dashboard, create a table based on the schema defined in this repository.

```
CREATE TYPE status AS ENUM ('active', 'inactive', 'archived');

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  name TEXT NOT NULL,
  status status NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  stock INTEGER NOT NULL,
  available_at TIMESTAMP NOT NULL
);
```

Then, uncomment `app/api/seed.ts` and hit `http://localhost:3000/api/seed` to seed the database with products.

Next, copy the `.env.example` file to `.env` and update the values. Follow the instructions in the `.env.example` file to set up your GitHub OAuth application.

```bash
npm i -g vercel
vercel link
vercel env pull
```

Finally, run the following commands to start the development server:

```
pnpm install
pnpm dev
```

You should now be able to access the application at http://localhost:3000.

## Email Reminders

This project can send reminder emails using Nodemailer. Configure the SMTP
credentials and cron secret in your `.env` file:

```bash
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Days Since <reminders@dayssince.app>"
CRON_SECRET=
```

Vercel triggers `/api/cron/check-reminders` daily via the schedule in
`vercel.json`. The request must include an `Authorization` header of
`Bearer $CRON_SECRET`.

## Running GitHub Actions Locally

This project uses [act](https://github.com/nektos/act) to run GitHub Actions locally in Docker containers, providing an identical environment to GitHub's runners.

### Prerequisites

1. **Install act:**

   ```bash
   # macOS
   brew install act

   # Or install manually
   curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
   ```

2. **Ensure Docker is running:**
   ```bash
   docker info
   ```
   If Docker isn't running, start Docker Desktop.

### Configuration

The project includes pre-configured files:

- **`.actrc`** - Docker image configuration for Ubuntu runners
- **`.secrets`** - Environment variables for local testing (GitHub secrets)

### Usage

**List available workflows:**

```bash
act --list
```

**Run the PR tests workflow (recommended):**

```bash
act pull_request --container-architecture linux/amd64 --job build-test
```

**Run with dry-run to see what would execute:**

```bash
act pull_request --container-architecture linux/amd64 --job build-test --dryrun
```

**Run specific workflow events:**

```bash
# Simulate pull request
act pull_request

# Simulate push to main
act push
```

### What Gets Tested

The local GitHub Actions workflow runs:

1. **PostgreSQL Service** - Spins up a containerized Postgres database
2. **Code Checkout** - Uses your local repository
3. **pnpm Installation** - Installs dependencies with caching
4. **Node.js Setup** - Configures Node.js 20 with package manager caching
5. **Environment Setup** - Creates test environment with database connection
6. **Linting** - Runs ESLint checks
7. **Testing** - Executes all Jest tests (98 tests across 9 suites)
8. **Building** - Creates optimized production build

### Benefits

- **🔄 Identical Environment** - Same containers and steps as GitHub Actions
- **🚀 Fast Feedback** - Test changes before pushing to GitHub
- **🔒 Isolated Database** - Uses containerized PostgreSQL instead of production
- **💰 Cost Effective** - No GitHub Actions minutes consumed for testing
- **🐛 Debug Locally** - Easier to troubleshoot CI issues

### Troubleshooting

**Docker socket issues on macOS:**

```bash
# Ensure Docker Desktop is running
open -a Docker

# Check Docker status
docker info
```

**Permission issues:**

```bash
# Make sure your user is in the docker group
sudo usermod -aG docker $USER
```

**Cache issues:**

```bash
# Clear act cache if needed
act --rm
```
