import { auth } from '@/lib/auth';
import { createEvent, getEvents } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const events = await getEvents(session.user.email);
  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, date } = body;
  const event = await createEvent(session.user.email, name, new Date(date));
  return NextResponse.json(event);
}
