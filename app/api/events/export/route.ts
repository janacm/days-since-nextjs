import { auth } from '@/lib/auth';
import { getEvents } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const events = await getEvents(session.user.email);
    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error exporting events:', error);
    return NextResponse.json({ error: 'Failed to export events' }, { status: 500 });
  }
}
