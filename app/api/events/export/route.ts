import { auth } from '@/lib/auth';
import { db, events } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userEvents = await db
    .select()
    .from(events)
    .where(eq(events.userId, session.user.email));

  const header = 'name,date,reminderDays\n';
  const rows = userEvents
    .map(e => `${e.name},${e.date},${e.reminderDays ?? ''}`)
    .join('\n');
  const csv = header + rows + (rows ? '\n' : '');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="events.csv"'
    }
  });
}
