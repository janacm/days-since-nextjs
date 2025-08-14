#!/usr/bin/env tsx

import {
  checkMigrationStatus,
  printMigrationStatus
} from '../lib/migration-checker';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

/**
 * Main function to check and display migration status
 */
async function main() {
  try {
    console.log('🔍 Checking database migration status...\n');

    const result = await checkMigrationStatus();

    // Print detailed status
    printMigrationStatus(result);

    // Exit with appropriate code
    process.exit(result.isUpToDate ? 0 : 1);
  } catch (error) {
    console.error('❌ Failed to check migration status:', error);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Migration Status Checker

Usage: tsx scripts/check-migrations.ts [options]

Options:
  -h, --help     Show this help message
  --quiet        Only show summary (less verbose output)
  --json         Output results as JSON

Examples:
  tsx scripts/check-migrations.ts
  tsx scripts/check-migrations.ts --quiet
  tsx scripts/check-migrations.ts --json
  `);
  process.exit(0);
}

// Handle different output formats
if (args.includes('--json')) {
  // JSON output mode
  checkMigrationStatus()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.isUpToDate ? 0 : 1);
    })
    .catch((error) => {
      console.error(JSON.stringify({ error: error.message }, null, 2));
      process.exit(1);
    });
} else if (args.includes('--quiet')) {
  // Quiet mode - only show summary
  checkMigrationStatus()
    .then((result) => {
      console.log(
        `Migration Status: ${result.isUpToDate ? '✅ Up to date' : '❌ Pending migrations'}`
      );
      console.log(
        `Applied: ${result.appliedMigrations}/${result.totalMigrations}`
      );

      if (result.pendingMigrations.length > 0) {
        console.log(`Pending: ${result.pendingMigrations.join(', ')}`);
      }

      if (result.errors.length > 0) {
        console.log(`Errors: ${result.errors.length}`);
      }

      process.exit(result.isUpToDate ? 0 : 1);
    })
    .catch((error) => {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    });
} else {
  // Default mode - run main function
  main();
}
