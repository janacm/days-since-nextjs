// NOTE: To make tests reliable in ESM Jest, avoid top-level imports that
// would bind real modules before mocks are applied. Lazily require inside
// functions instead so test-time mocks take effect.

// Type definitions for migration status
export interface MigrationStatus {
  fileName: string;
  applied: boolean;
  content: string;
  error?: string;
}

export interface MigrationCheckResult {
  isUpToDate: boolean;
  totalMigrations: number;
  appliedMigrations: number;
  pendingMigrations: string[];
  migrationStatuses: MigrationStatus[];
  errors: string[];
}

/**
 * Check if database migrations have been applied
 */
export async function checkMigrationStatus(): Promise<MigrationCheckResult> {
  const errors: string[] = [];
  const migrationStatuses: MigrationStatus[] = [];

  try {
    // Lazy requires so Jest can mock these modules even with ESM-style tests
    const { neon } = require('@neondatabase/serverless');
    const { drizzle } = require('drizzle-orm/neon-http');
    const pathModule = require('path');
    const fsModule = require('fs');
    const joinPath: (...parts: string[]) => string =
      pathModule && typeof pathModule.join === 'function'
        ? pathModule.join.bind(pathModule)
        : (...parts: string[]) => parts.filter(Boolean).join('/');
    const readdirSync: (p: string) => string[] =
      fsModule && typeof fsModule.readdirSync === 'function'
        ? fsModule.readdirSync.bind(fsModule)
        : () => [];
    const readFileSync: (p: string, enc: string) => string =
      fsModule && typeof fsModule.readFileSync === 'function'
        ? fsModule.readFileSync.bind(fsModule)
        : () => '';

    // Initialize database connection
    const connectionString =
      process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'Database connection string not found in environment variables'
      );
    }

    // During tests, avoid creating a real Neon client (which requires fetch).
    // Tests mock drizzle() to return a fake DB, so we can pass a dummy client.
    let db: any;
    if (process.env.NODE_ENV === 'test') {
      db = drizzle({} as any) as any;
    } else {
      db = drizzle(neon(connectionString));
    }

    // Get all migration files
    const migrationsDir = joinPath(process.cwd(), 'drizzle', 'migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort(); // Sort to ensure order

    // Check each migration
    for (const fileName of migrationFiles) {
      const filePath = joinPath(migrationsDir, fileName);
      const content = readFileSync(filePath, 'utf-8');

      try {
        const isApplied = await checkMigrationApplied(db, fileName, content);
        migrationStatuses.push({
          fileName,
          applied: isApplied,
          content
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error checking migration ${fileName}: ${errorMessage}`);
        migrationStatuses.push({
          fileName,
          applied: false,
          content,
          error: errorMessage
        });
      }
    }

    const appliedMigrations = migrationStatuses.filter((m) => m.applied).length;
    const pendingMigrations = migrationStatuses
      .filter((m) => !m.applied)
      .map((m) => m.fileName);

    return {
      isUpToDate:
        appliedMigrations === migrationFiles.length && errors.length === 0,
      totalMigrations: migrationFiles.length,
      appliedMigrations,
      pendingMigrations,
      migrationStatuses,
      errors
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Failed to check migration status: ${errorMessage}`);

    return {
      isUpToDate: false,
      totalMigrations: 0,
      appliedMigrations: 0,
      pendingMigrations: [],
      migrationStatuses,
      errors
    };
  }
}

/**
 * Check if a specific migration has been applied by examining the database schema
 */
async function checkMigrationApplied(
  db: any,
  fileName: string,
  content: string
): Promise<boolean> {
  try {
    // Parse the migration file to understand what it creates/modifies
    const migrationChecks = parseMigrationContent(fileName, content);

    // Check each requirement
    for (const check of migrationChecks) {
      const result = await executeCheck(db, check);
      if (!result) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error(`Error checking migration ${fileName}:`, error);
    return false;
  }
}

/**
 * Parse migration content to determine what to check
 */
function parseMigrationContent(
  fileName: string,
  content: string
): MigrationCheck[] {
  const checks: MigrationCheck[] = [];
  const lines = content.split('\n').map((line) => line.trim());

  for (const line of lines) {
    const upperLine = line.toUpperCase();

    // Check for table creation
    if (upperLine.includes('CREATE TABLE')) {
      const tableMatch = line.match(
        /CREATE TABLE(?:\s+IF NOT EXISTS)?\s+"?([^"\s]+)"?/i
      );
      if (tableMatch) {
        checks.push({
          type: 'table_exists',
          tableName: tableMatch[1]
        });
      }
    }

    // Check for column additions
    if (upperLine.includes('ADD COLUMN')) {
      const columnMatch = line.match(
        /ADD COLUMN(?:\s+IF NOT EXISTS)?\s+"?([^"\s]+)"?/i
      );
      // Try to find the table name from context or filename
      const tableName = extractTableNameFromContext(fileName, content, line);
      if (columnMatch && tableName) {
        checks.push({
          type: 'column_exists',
          tableName,
          columnName: columnMatch[1]
        });
      }
    }

    // Check for enum creation
    if (upperLine.includes('CREATE TYPE')) {
      const enumMatch = line.match(
        /CREATE TYPE(?:\s+IF NOT EXISTS)?\s+"?([^"\s]+)"?/i
      );
      if (enumMatch) {
        checks.push({
          type: 'enum_exists',
          enumName: enumMatch[1]
        });
      }
    }
  }

  return checks;
}

/**
 * Extract table name from migration context
 */
function extractTableNameFromContext(
  fileName: string,
  content: string,
  targetLine: string
): string | null {
  const lines = content.split('\n');
  const targetIndex = lines.findIndex((line) =>
    line.includes(targetLine.replace(/\s+/g, ' '))
  );

  // Look backwards for ALTER TABLE statement
  for (let i = targetIndex; i >= 0; i--) {
    const line = lines[i].trim().toUpperCase();
    if (line.includes('ALTER TABLE')) {
      const tableMatch = lines[i].match(
        /ALTER TABLE(?:\s+IF EXISTS)?\s+"?([^"\s]+)"?/i
      );
      if (tableMatch) {
        return tableMatch[1];
      }
    }
  }

  // Try to infer from filename
  if (fileName.includes('_users')) return 'users';
  if (fileName.includes('_events')) return 'events';
  if (fileName.includes('_products')) return 'products';

  return null;
}

/**
 * Execute a specific check against the database
 */
async function executeCheck(db: any, check: MigrationCheck): Promise<boolean> {
  try {
    const { sql } = require('drizzle-orm');
    switch (check.type) {
      case 'table_exists':
        const tableResult = await db.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${check.tableName}
          );
        `);
        return tableResult.rows[0]?.exists === true;

      case 'column_exists':
        const columnResult = await db.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = ${check.tableName} 
            AND column_name = ${check.columnName}
          );
        `);
        return columnResult.rows[0]?.exists === true;

      case 'enum_exists':
        const enumResult = await db.execute(sql`
          SELECT EXISTS (
            SELECT FROM pg_type 
            WHERE typname = ${check.enumName}
          );
        `);
        return enumResult.rows[0]?.exists === true;

      default:
        return false;
    }
  } catch (error) {
    console.error(`Error executing check ${check.type}:`, error);
    return false;
  }
}

/**
 * Pretty print migration status
 */
export function printMigrationStatus(result: MigrationCheckResult): void {
  console.log('\n=== Database Migration Status ===');
  console.log(`Total migrations: ${result.totalMigrations}`);
  console.log(`Applied migrations: ${result.appliedMigrations}`);
  console.log(`Pending migrations: ${result.pendingMigrations.length}`);
  console.log(`Database is up to date: ${result.isUpToDate ? '✅' : '❌'}`);

  if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.forEach((error) => console.log(`  ❌ ${error}`));
  }

  if (result.pendingMigrations.length > 0) {
    console.log('\nPending migrations:');
    result.pendingMigrations.forEach((migration) => {
      console.log(`  ⏳ ${migration}`);
    });
  }

  console.log('\nDetailed status:');
  result.migrationStatuses.forEach((status) => {
    const icon = status.applied ? '✅' : '❌';
    const errorInfo = status.error ? ` (Error: ${status.error})` : '';
    console.log(`  ${icon} ${status.fileName}${errorInfo}`);
  });

  console.log('\n================================\n');
}

// Internal types
interface MigrationCheck {
  type: 'table_exists' | 'column_exists' | 'enum_exists';
  tableName?: string;
  columnName?: string;
  enumName?: string;
}
