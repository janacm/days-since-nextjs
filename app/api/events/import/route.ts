import { auth } from '@/lib/auth';
import { db, events } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!Array.isArray(body?.events)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const insertValues = body.events.map((e: any) => ({
      userId: session.user.email as string,
      name: e.name as string,
      date: new Date(e.date).toISOString(),
      reminderDays: e.reminderDays ?? null,
      reminderSent: false,
    }));

    await db.insert(events).values(insertValues);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error importing events:', error);
    return NextResponse.json({ error: 'Failed to import events' }, { status: 500 });
  }
}
