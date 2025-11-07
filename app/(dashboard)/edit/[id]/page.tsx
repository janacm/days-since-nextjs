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
import { Checkbox } from '@/components/ui/checkbox';

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
    <div className="max-w-md mx-auto p-4 md:p-6">
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle>Edit Event</CardTitle>
        </CardHeader>
        <form action={editEvent}>
          <CardContent className="space-y-4 p-4 md:p-6">
            <input type="hidden" name="id" value={event.id} />
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="name">Event Name</Label>
              <Input 
                id="name" 
                name="name" 
                defaultValue={event.name} 
                required
                autoComplete="off"
                className="w-full text-base h-11"
              />
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="date">When did it happen?</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={formattedDate}
                required
                className="w-full text-base h-11"
              />
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="reminderDays">Remind me after (days)</Label>
              <Input
                id="reminderDays"
                name="reminderDays"
                type="number"
                inputMode="numeric"
                min="1"
                placeholder="e.g. 30"
                defaultValue={event.reminderDays || ''}
                autoComplete="off"
                className="w-full text-base h-11"
              />
              <p className="text-xs text-muted-foreground break-words">Optional</p>
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <div className="flex items-center gap-2 min-h-[44px]">
                <Checkbox
                  id="isPrivate"
                  name="isPrivate"
                  defaultChecked={!!event.isPrivate}
                  className="h-5 w-5"
                />
                <Label htmlFor="isPrivate" className="cursor-pointer">Private</Label>
              </div>
              <p className="text-xs text-muted-foreground break-words min-w-0">
                Private events are only visible to you and appear only under the
                Private tab.
              </p>
            </div>
            {/* ---------- DISABLE RESETS CHECKBOX ---------- */}
            <div className="space-y-1.5 md:space-y-2">
              <div className="flex items-center gap-2 min-h-[44px]">
                <Checkbox
                  id="disableResets"
                  name="disableResets"
                  defaultChecked={event.resettable === false}
                  className="h-5 w-5"
                />
                <Label htmlFor="disableResets" className="cursor-pointer">Disable Resets</Label>
              </div>
              <p className="text-xs text-muted-foreground break-words min-w-0">
                When enabled, this event cannot be reset. You can still delete
                it.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between gap-2 p-4 md:p-6">
            <Button variant="outline" asChild className="h-11 min-w-[44px] px-4">
              <Link href="/">Cancel</Link>
            </Button>
            <Button type="submit" className="h-11 min-w-[44px] px-4">Save Changes</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
