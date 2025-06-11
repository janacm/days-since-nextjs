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
- Package Manager - [pnpm](https://pnpm.io/)

This template uses the new Next.js App Router. This includes support for enhanced layouts, colocation of components, tests, and styles, component-level data fetching, and more.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18.17 or later)
- [pnpm](https://pnpm.io/installation) (v8.0 or later)
- [Git](https://git-scm.com/)
- [PostgreSQL](https://www.postgresql.org/download/) (local or remote instance)

## Getting Started

There are two ways to run this application: locally with your own PostgreSQL database or using Vercel's infrastructure.

### Option 1: Using Vercel (Recommended for Production)

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

### Option 2: Local Development Setup

Follow these steps to set up the project locally:

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/days-since-nextjs.git
   cd days-since-nextjs
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and fill in the required values:
   - For database connection, set your PostgreSQL credentials
   - For GitHub OAuth, follow the instructions in the `.env.example` file

4. **Set up the database**

   Ensure your PostgreSQL server is running and create a database for the project. Then run the SQL commands from the schema:

   ```sql
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

5. **Seed the database**

   Uncomment `app/api/seed.ts` and run the development server:

   ```bash
   pnpm dev
   ```

   Then visit `http://localhost:3000/api/seed` to populate the database with initial data.
   After seeding, you can comment out the API endpoint again.

6. **Run the development server**

   ```bash
   pnpm dev
   ```

   The application will be available at http://localhost:3000.

## Development Workflow

1. **Code Style and Formatting**

   This project uses ESLint and Prettier for code quality and formatting:

   ```bash
   # Run ESLint
   pnpm lint

   # Format code with Prettier
   pnpm format
   ```

2. **Git Security with ggshield** (Optional)

   This project supports [GitGuardian's ggshield](https://github.com/GitGuardian/ggshield) for secret scanning:

   ```bash
   # Install ggshield
   brew install gitguardian/tap/ggshield  # macOS
   # For other platforms, see: https://docs.gitguardian.com/ggshield-docs/getting-started

   # Authenticate with GitGuardian
   ggshield auth login
   ```

3. **Testing**

   Run tests with Jest:

   ```bash
   pnpm test
   ```

4. **Building for Production**

   ```bash
   pnpm build
   ```

## Troubleshooting

- **Database Connection Issues**: Ensure your PostgreSQL server is running and that the connection details in `.env.local` are correct.
- **Missing Environment Variables**: If you encounter errors related to missing environment variables, double-check your `.env.local` file.
- **Dependency Issues**: If you encounter problems with dependencies, try removing `node_modules` and the lock file, then reinstall:
  ```bash
  rm -rf node_modules
  rm pnpm-lock.yaml
  pnpm install
  ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
