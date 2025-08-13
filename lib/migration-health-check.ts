import {
  checkMigrationStatus,
  MigrationCheckResult
} from './migration-checker';

export interface MigrationHealthInfo {
  healthy: boolean;
  upToDate: boolean;
  issues: string[];
  totalMigrations: number;
  appliedMigrations: number;
  pendingMigrations: string[];
  lastChecked: string;
}

/**
 * Simple health check function that returns boolean
 */
export async function isMigrationHealthy(): Promise<boolean> {
  try {
    const result = await checkMigrationStatus();
    return result.isUpToDate && result.errors.length === 0;
  } catch (error) {
    console.error('Migration health check failed:', error);
    return false;
  }
}

/**
 * Detailed health check with information
 */
export async function getMigrationHealth(): Promise<MigrationHealthInfo> {
  try {
    const result = await checkMigrationStatus();

    const issues: string[] = [];

    // Add errors as issues
    if (result.errors.length > 0) {
      issues.push(...result.errors);
    }

    // Add pending migrations as issues
    if (result.pendingMigrations.length > 0) {
      issues.push(
        `${result.pendingMigrations.length} pending migrations: ${result.pendingMigrations.join(', ')}`
      );
    }

    // Add individual migration errors
    result.migrationStatuses.forEach((status) => {
      if (status.error) {
        issues.push(`Migration ${status.fileName}: ${status.error}`);
      }
    });

    const healthy = result.isUpToDate && result.errors.length === 0;

    return {
      healthy,
      upToDate: result.isUpToDate,
      issues,
      totalMigrations: result.totalMigrations,
      appliedMigrations: result.appliedMigrations,
      pendingMigrations: result.pendingMigrations,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Migration health check failed:', errorMessage);

    return {
      healthy: false,
      upToDate: false,
      issues: [`Health check failed: ${errorMessage}`],
      totalMigrations: 0,
      appliedMigrations: 0,
      pendingMigrations: [],
      lastChecked: new Date().toISOString()
    };
  }
}

/**
 * Check migration health and log warnings if unhealthy
 */
export async function checkMigrationHealthWithWarning(): Promise<MigrationHealthInfo> {
  const health = await getMigrationHealth();

  if (!health.healthy) {
    console.warn('🚨 Migration health check failed!');
    console.warn(`Issues found: ${health.issues.length}`);
    health.issues.forEach((issue) => {
      console.warn(`  - ${issue}`);
    });

    if (health.pendingMigrations.length > 0) {
      console.warn(`\n💡 Run migrations to resolve: npm run db:migrate`);
    }
  } else {
    console.info('✅ Migration health check passed');
  }

  return health;
}

/**
 * Check migration health only in development environment
 */
export async function checkMigrationInDevelopment(): Promise<MigrationHealthInfo | null> {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isDevelopment) {
    return null;
  }

  return await checkMigrationHealthWithWarning();
}

/**
 * Utility to throw an error if migrations are not up to date
 */
export async function ensureMigrationsUpToDate(): Promise<void> {
  const result = await checkMigrationStatus();

  if (!result.isUpToDate) {
    const pendingList = result.pendingMigrations.join(', ');
    throw new Error(
      `Database migrations are not up to date. Pending migrations: ${pendingList}`
    );
  }

  if (result.errors.length > 0) {
    throw new Error(
      `Migration check failed with errors: ${result.errors.join('; ')}`
    );
  }
}
