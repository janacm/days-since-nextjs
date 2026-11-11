import { NextRequest, NextResponse } from 'next/server';
import { checkMigrationStatus } from '@/lib/migration-checker';

/**
 * GET /api/migration-status
 * Check if database migrations are up to date
 */
export async function GET(request: NextRequest) {
  try {
    const result = await checkMigrationStatus();

    const response = NextResponse.json(result, {
      status: result.isUpToDate ? 200 : 400,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0'
      }
    });

    return response;
  } catch (error) {
    console.error('Migration status check failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to check migration status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/migration-status
 * Check migration status with optional configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { includeContent = false } = body;

    const result = await checkMigrationStatus();

    // Optionally strip migration content for smaller response
    if (!includeContent) {
      result.migrationStatuses.forEach((status) => {
        status.content = '';
      });
    }

    return NextResponse.json(result, {
      status: result.isUpToDate ? 200 : 400,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0'
      }
    });
  } catch (error) {
    console.error('Migration status check failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to check migration status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
