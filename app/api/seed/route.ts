import { db, events } from '@/lib/db';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return new Response(JSON.stringify({ success: false, error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const expectedSecret = process.env.SEED_SECRET || process.env.CRON_SECRET;
    if (!expectedSecret) {
      return new Response(
        JSON.stringify({ success: false, error: 'Seed secret is not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${expectedSecret}`) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Clear existing events
    await db.delete(events);

    // Add sample events one by one
    await db.insert(events).values({
      userId: 'sample@example.com',
      name: 'Started new job',
      date: new Date('2023-01-15').toISOString()
    });

    await db.insert(events).values({
      userId: 'sample@example.com',
      name: 'Last dentist appointment',
      date: new Date('2023-03-22').toISOString()
    });

    await db.insert(events).values({
      userId: 'sample@example.com',
      name: 'Called mom',
      date: new Date('2023-05-10').toISOString()
    });

    await db.insert(events).values({
      userId: 'sample@example.com',
      name: 'Changed smoke detector batteries',
      date: new Date('2023-02-05').toISOString()
    });

    await db.insert(events).values({
      userId: 'sample@example.com',
      name: 'Last haircut',
      date: new Date('2023-04-18').toISOString()
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Seed error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
