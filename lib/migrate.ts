import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { promises as fs } from 'fs';
import { join } from 'path';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function migrate() {
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error('POSTGRES_URL environment variable is not set.');
    process.exit(1);
  }

  const sql = neon(connectionString);

  console.log('Starting database migrations...');

  try {
    // Read all migration files
    const migrationsDir = join(process.cwd(), 'drizzle', 'migrations');
    const files = await fs.readdir(migrationsDir);

    // Sort files to ensure they are executed in order
    const sqlFiles = files.filter((file) => file.endsWith('.sql')).sort();

    // Execute each migration file
    for (const file of sqlFiles) {
      console.log(`Applying migration: ${file}`);
      const filePath = join(migrationsDir, file);
      const migration = await fs.readFile(filePath, 'utf8');

      // Split the migration into separate statements (split by semicolon)
      const statements = migration
        .split(';')
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      // Execute each statement separately
      for (const statement of statements) {
        try {
          await sql(`${statement};`);
          console.log('Statement executed successfully');
        } catch (err) {
          // Log the error but continue with other statements
          console.warn(`Warning: Statement execution failed: ${err.message}`);
          console.warn('Continuing with next statement...');
        }
      }
    }

    // Verify if the tables exist
    console.log('Verifying tables...');
    try {
      const result = await sql(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
      );
      console.log(
        'Existing tables:',
        (result as any[]).map((r) => r.table_name).join(', ')
      );

      // Check columns in the users table
      console.log('Checking users table columns...');
      const usersColumns = await sql(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users';"
      );
      console.log('Users table columns:');
      for (const col of usersColumns as any[]) {
        console.log(`- ${col.column_name} (${col.data_type})`);
      }

      // Check columns in the events table
      console.log('Checking events table columns...');
      const eventsColumns = await sql(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events';"
      );
      console.log('Events table columns:');
      for (const col of eventsColumns as any[]) {
        console.log(`- ${col.column_name} (${col.data_type})`);
      }
    } catch (err) {
      console.error('Failed to verify tables:', err.message);
    }

    console.log('Migrations completed');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Execute migrations
migrate();
