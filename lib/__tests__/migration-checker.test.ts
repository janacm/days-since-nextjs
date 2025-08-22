import {
  checkMigrationStatus,
  printMigrationStatus,
  type MigrationCheckResult,
  type MigrationStatus
} from '../migration-checker';
import {
  isMigrationHealthy,
  getMigrationHealth,
  checkMigrationHealthWithWarning,
  checkMigrationInDevelopment,
  ensureMigrationsUpToDate
} from '../migration-health-check';

// Mock dependencies
jest.mock('@neondatabase/serverless');
jest.mock('drizzle-orm/neon-http');
jest.mock('fs');
jest.mock('path');

// Mock console methods - recreate spies for each test to avoid being undone by restoreAllMocks
let consoleSpy: {
  log: jest.SpyInstance;
  warn: jest.SpyInstance;
  error: jest.SpyInstance;
  info: jest.SpyInstance;
};

describe('Migration Checker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
      info: jest.spyOn(console, 'info').mockImplementation(() => {})
    };
    // Reset environment variables
    process.env.POSTGRES_URL = 'postgresql://test:test@localhost:5432/test';
    // Jest's NODE_ENV typings are readonly; cast to any for test mutation
    (process.env as any).NODE_ENV = 'test';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('checkMigrationStatus', () => {
    it('should return up-to-date status when all migrations are applied', async () => {
      // Mock file system
      const fs = require('fs');
      const path = require('path');

      fs.readdirSync.mockReturnValue([
        '0001_initial.sql',
        '0002_add_users.sql'
      ]);
      fs.readFileSync.mockReturnValue(
        'CREATE TABLE test_table (id SERIAL PRIMARY KEY);'
      );
      path.join.mockReturnValue('/mock/path');

      // Mock database connection
      const mockDb = {
        execute: jest.fn().mockResolvedValue({ rows: [{ exists: true }] })
      };

      const { drizzle } = require('drizzle-orm/neon-http');
      drizzle.mockReturnValue(mockDb);

      const result = await checkMigrationStatus();

      expect(result.isUpToDate).toBe(true);
      expect(result.totalMigrations).toBe(2);
      expect(result.appliedMigrations).toBe(2);
      expect(result.pendingMigrations).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should return pending migrations when some are not applied', async () => {
      // Mock file system
      const fs = require('fs');
      const path = require('path');

      fs.readdirSync.mockReturnValue([
        '0001_initial.sql',
        '0002_add_users.sql'
      ]);
      fs.readFileSync.mockReturnValue(
        'CREATE TABLE test_table (id SERIAL PRIMARY KEY);'
      );
      path.join.mockReturnValue('/mock/path');

      // Mock database connection - first table exists, second doesn't
      const mockDb = {
        execute: jest
          .fn()
          .mockResolvedValueOnce({ rows: [{ exists: true }] })
          .mockResolvedValueOnce({ rows: [{ exists: false }] })
      };

      const { drizzle } = require('drizzle-orm/neon-http');
      drizzle.mockReturnValue(mockDb);

      const result = await checkMigrationStatus();

      expect(result.isUpToDate).toBe(false);
      expect(result.totalMigrations).toBe(2);
      expect(result.appliedMigrations).toBe(1);
      expect(result.pendingMigrations).toHaveLength(1);
      expect(result.pendingMigrations[0]).toBe('0002_add_users.sql');
    });

    it('should handle database connection errors', async () => {
      // Mock missing environment variable
      delete process.env.POSTGRES_URL;

      const result = await checkMigrationStatus();

      expect(result.isUpToDate).toBe(false);
      expect(result.errors).toContain(
        'Failed to check migration status: POSTGRES_URL environment variable is not set'
      );
    });

    it('should handle empty migrations directory', async () => {
      // Mock file system
      const fs = require('fs');
      const path = require('path');

      fs.readdirSync.mockReturnValue([]);
      path.join.mockReturnValue('/mock/path');

      // Mock database connection
      const mockDb = {
        execute: jest.fn().mockResolvedValue({ rows: [{ exists: true }] })
      };

      const { drizzle } = require('drizzle-orm/neon-http');
      drizzle.mockReturnValue(mockDb);

      const result = await checkMigrationStatus();

      expect(result.isUpToDate).toBe(true);
      expect(result.totalMigrations).toBe(0);
      expect(result.appliedMigrations).toBe(0);
      expect(result.pendingMigrations).toHaveLength(0);
    });

    it('should filter out non-SQL files', async () => {
      // Mock file system
      const fs = require('fs');
      const path = require('path');

      fs.readdirSync.mockReturnValue([
        '0001_initial.sql',
        'README.md',
        '0002_add_users.sql',
        '.DS_Store'
      ]);
      fs.readFileSync.mockReturnValue(
        'CREATE TABLE test_table (id SERIAL PRIMARY KEY);'
      );
      path.join.mockReturnValue('/mock/path');

      // Mock database connection
      const mockDb = {
        execute: jest.fn().mockResolvedValue({ rows: [{ exists: true }] })
      };

      const { drizzle } = require('drizzle-orm/neon-http');
      drizzle.mockReturnValue(mockDb);

      const result = await checkMigrationStatus();

      expect(result.totalMigrations).toBe(2);
      expect(result.migrationStatuses).toHaveLength(2);
      expect(result.migrationStatuses[0].fileName).toBe('0001_initial.sql');
      expect(result.migrationStatuses[1].fileName).toBe('0002_add_users.sql');
    });
  });

  describe('printMigrationStatus', () => {
    it('should print detailed migration status', () => {
      const mockResult: MigrationCheckResult = {
        isUpToDate: false,
        totalMigrations: 2,
        appliedMigrations: 1,
        pendingMigrations: ['0002_add_users.sql'],
        migrationStatuses: [
          {
            fileName: '0001_initial.sql',
            applied: true,
            content: 'CREATE TABLE test;'
          },
          {
            fileName: '0002_add_users.sql',
            applied: false,
            content: 'CREATE TABLE users;'
          }
        ],
        errors: []
      };

      printMigrationStatus(mockResult);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '\n=== Database Migration Status ==='
      );
      expect(consoleSpy.log).toHaveBeenCalledWith('Total migrations: 2');
      expect(consoleSpy.log).toHaveBeenCalledWith('Applied migrations: 1');
      expect(consoleSpy.log).toHaveBeenCalledWith('Pending migrations: 1');
      expect(consoleSpy.log).toHaveBeenCalledWith('Database is up to date: ❌');
    });

    it('should show success status when up to date', () => {
      const mockResult: MigrationCheckResult = {
        isUpToDate: true,
        totalMigrations: 1,
        appliedMigrations: 1,
        pendingMigrations: [],
        migrationStatuses: [
          {
            fileName: '0001_initial.sql',
            applied: true,
            content: 'CREATE TABLE test;'
          }
        ],
        errors: []
      };

      printMigrationStatus(mockResult);

      expect(consoleSpy.log).toHaveBeenCalledWith('Database is up to date: ✅');
    });
  });

  describe('Migration Health Check', () => {
    describe('isMigrationHealthy', () => {
      it('should return true when migrations are up to date', async () => {
        // Mock successful migration check
        const fs = require('fs');
        const path = require('path');

        fs.readdirSync.mockReturnValue(['0001_initial.sql']);
        fs.readFileSync.mockReturnValue(
          'CREATE TABLE test_table (id SERIAL PRIMARY KEY);'
        );
        path.join.mockReturnValue('/mock/path');

        const mockDb = {
          execute: jest.fn().mockResolvedValue({ rows: [{ exists: true }] })
        };

        const { drizzle } = require('drizzle-orm/neon-http');
        drizzle.mockReturnValue(mockDb);

        const result = await isMigrationHealthy();

        expect(result).toBe(true);
      });

      it('should return false when migrations are pending', async () => {
        // Mock pending migration
        const fs = require('fs');
        const path = require('path');

        fs.readdirSync.mockReturnValue(['0001_initial.sql']);
        fs.readFileSync.mockReturnValue(
          'CREATE TABLE test_table (id SERIAL PRIMARY KEY);'
        );
        path.join.mockReturnValue('/mock/path');

        const mockDb = {
          execute: jest.fn().mockResolvedValue({ rows: [{ exists: false }] })
        };

        const { drizzle } = require('drizzle-orm/neon-http');
        drizzle.mockReturnValue(mockDb);

        const result = await isMigrationHealthy();

        expect(result).toBe(false);
      });
    });

    describe('getMigrationHealth', () => {
      it('should return detailed health information', async () => {
        // Mock successful migration check
        const fs = require('fs');
        const path = require('path');

        fs.readdirSync.mockReturnValue(['0001_initial.sql']);
        fs.readFileSync.mockReturnValue(
          'CREATE TABLE test_table (id SERIAL PRIMARY KEY);'
        );
        path.join.mockReturnValue('/mock/path');

        const mockDb = {
          execute: jest.fn().mockResolvedValue({ rows: [{ exists: true }] })
        };

        const { drizzle } = require('drizzle-orm/neon-http');
        drizzle.mockReturnValue(mockDb);

        const result = await getMigrationHealth();

        expect(result.healthy).toBe(true);
        expect(result.upToDate).toBe(true);
        expect(result.totalMigrations).toBe(1);
        expect(result.appliedMigrations).toBe(1);
        expect(result.pendingMigrations).toHaveLength(0);
        expect(result.issues).toHaveLength(0);
        expect(result.lastChecked).toBeDefined();
      });

      it('should include issues when migrations are pending', async () => {
        // Mock pending migration
        const fs = require('fs');
        const path = require('path');

        fs.readdirSync.mockReturnValue([
          '0001_initial.sql',
          '0002_add_users.sql'
        ]);
        fs.readFileSync.mockReturnValue(
          'CREATE TABLE test_table (id SERIAL PRIMARY KEY);'
        );
        path.join.mockReturnValue('/mock/path');

        const mockDb = {
          execute: jest
            .fn()
            .mockResolvedValueOnce({ rows: [{ exists: true }] })
            .mockResolvedValueOnce({ rows: [{ exists: false }] })
        };

        const { drizzle } = require('drizzle-orm/neon-http');
        drizzle.mockReturnValue(mockDb);

        const result = await getMigrationHealth();

        expect(result.healthy).toBe(false);
        expect(result.upToDate).toBe(false);
        expect(result.issues).toContain(
          '1 pending migrations: 0002_add_users.sql'
        );
        expect(result.pendingMigrations).toEqual(['0002_add_users.sql']);
      });
    });

    describe('checkMigrationHealthWithWarning', () => {
      it('should log success when migrations are healthy', async () => {
        // Mock successful migration check
        const fs = require('fs');
        const path = require('path');

        fs.readdirSync.mockReturnValue(['0001_initial.sql']);
        fs.readFileSync.mockReturnValue(
          'CREATE TABLE test_table (id SERIAL PRIMARY KEY);'
        );
        path.join.mockReturnValue('/mock/path');

        const mockDb = {
          execute: jest.fn().mockResolvedValue({ rows: [{ exists: true }] })
        };

        const { drizzle } = require('drizzle-orm/neon-http');
        drizzle.mockReturnValue(mockDb);

        const result = await checkMigrationHealthWithWarning();

        expect(result.healthy).toBe(true);
        expect(consoleSpy.info).toHaveBeenCalledWith(
          '✅ Migration health check passed'
        );
      });

      it('should log warnings when migrations are unhealthy', async () => {
        // Mock pending migration
        const fs = require('fs');
        const path = require('path');

        fs.readdirSync.mockReturnValue(['0001_initial.sql']);
        fs.readFileSync.mockReturnValue(
          'CREATE TABLE test_table (id SERIAL PRIMARY KEY);'
        );
        path.join.mockReturnValue('/mock/path');

        const mockDb = {
          execute: jest.fn().mockResolvedValue({ rows: [{ exists: false }] })
        };

        const { drizzle } = require('drizzle-orm/neon-http');
        drizzle.mockReturnValue(mockDb);

        const result = await checkMigrationHealthWithWarning();

        expect(result.healthy).toBe(false);
        expect(consoleSpy.warn).toHaveBeenCalledWith(
          '🚨 Migration health check failed!'
        );
        expect(consoleSpy.warn).toHaveBeenCalledWith(
          '💡 Run migrations to resolve: npm run db:migrate'
        );
      });
    });

    describe('checkMigrationInDevelopment', () => {
      it('should check migrations in development environment', async () => {
        (process.env as any).NODE_ENV = 'development';

        // Mock successful migration check
        const fs = require('fs');
        const path = require('path');

        fs.readdirSync.mockReturnValue(['0001_initial.sql']);
        fs.readFileSync.mockReturnValue(
          'CREATE TABLE test_table (id SERIAL PRIMARY KEY);'
        );
        path.join.mockReturnValue('/mock/path');

        const mockDb = {
          execute: jest.fn().mockResolvedValue({ rows: [{ exists: true }] })
        };

        const { drizzle } = require('drizzle-orm/neon-http');
        drizzle.mockReturnValue(mockDb);

        const result = await checkMigrationInDevelopment();

        expect(result).not.toBeNull();
        expect(result?.healthy).toBe(true);
        expect(consoleSpy.info).toHaveBeenCalledWith(
          '✅ Migration health check passed'
        );
      });

      it('should return null in production environment', async () => {
        (process.env as any).NODE_ENV = 'production';

        const result = await checkMigrationInDevelopment();

        expect(result).toBeNull();
      });
    });

    describe('ensureMigrationsUpToDate', () => {
      it('should not throw when migrations are up to date', async () => {
        // Mock successful migration check
        const fs = require('fs');
        const path = require('path');

        fs.readdirSync.mockReturnValue(['0001_initial.sql']);
        fs.readFileSync.mockReturnValue(
          'CREATE TABLE test_table (id SERIAL PRIMARY KEY);'
        );
        path.join.mockReturnValue('/mock/path');

        const mockDb = {
          execute: jest.fn().mockResolvedValue({ rows: [{ exists: true }] })
        };

        const { drizzle } = require('drizzle-orm/neon-http');
        drizzle.mockReturnValue(mockDb);

        await expect(ensureMigrationsUpToDate()).resolves.not.toThrow();
      });

      it('should throw when migrations are pending', async () => {
        // Mock pending migration
        const fs = require('fs');
        const path = require('path');

        fs.readdirSync.mockReturnValue(['0001_initial.sql']);
        fs.readFileSync.mockReturnValue(
          'CREATE TABLE test_table (id SERIAL PRIMARY KEY);'
        );
        path.join.mockReturnValue('/mock/path');

        const mockDb = {
          execute: jest.fn().mockResolvedValue({ rows: [{ exists: false }] })
        };

        const { drizzle } = require('drizzle-orm/neon-http');
        drizzle.mockReturnValue(mockDb);

        await expect(ensureMigrationsUpToDate()).rejects.toThrow(
          'Database migrations are not up to date. Pending migrations: 0001_initial.sql'
        );
      });

      it('should throw when there are errors', async () => {
        // Mock database connection error
        delete process.env.POSTGRES_URL;

        await expect(ensureMigrationsUpToDate()).rejects.toThrow(
          'Migration check failed with errors:'
        );
      });
    });
  });
});
