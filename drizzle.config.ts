import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

export default defineConfig({
  schema: './lib/db.ts',
  out: './drizzle',
  dialect: 'pg',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.POSTGRES_URL || ''
  }
});
