import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { editEvent } from '../../actions';
import Link from 'next/link';
import { db, events } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';

export default async function EditEventPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = parseInt(id, 10);
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, numericId))
    .limit(1);

  if (!event || event.userId !== session.user.email) {
    redirect('/');
  }

  // Format date for input field (YYYY-MM-DD)
  const formattedDate = format(new Date(event.date), 'yyyy-MM-dd');

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Event</CardTitle>
        </CardHeader>
        <form action={editEvent}>
          <CardContent className="space-y-4">
            <input type="hidden" name="id" value={event.id} />
            <div className="space-y-2">
              <Label htmlFor="name">Event Name</Label>
              <Input id="name" name="name" defaultValue={event.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">When did it happen?</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={formattedDate}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/">Cancel</Link>
            </Button>
            <Button type="submit">Save Changes</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
