import { auth } from '@/lib/auth';
import { getEvents, updateEvent } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { events, db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { params } = context;
  const resolvedParams = await params;
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = Number(resolvedParams.id);
  const event = (
    await db.select().from(events).where(eq(events.id, id)).limit(1)
  )[0];

  if (!event || event.userId !== session.user.email) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(event);
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { params } = context;
  const resolvedParams = await params;
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = Number(resolvedParams.id);
  const body = await req.json();
  const { name, date, reminderDays } = body;
  const updated = await updateEvent(id, name, new Date(date), reminderDays);
  return NextResponse.json(updated);
}
