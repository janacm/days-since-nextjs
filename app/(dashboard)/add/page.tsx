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
import { Switch } from '@/components/ui/switch';
import { addEvent } from '../actions';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getEvents } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function AddEventPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect('/login');
  }

  const events = await getEvents(session.user.email);
  const eventNames = Array.from(new Set(events.map((e) => e.name)));

  // Get today's date in YYYY-MM-DD format using local timezone
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Event</CardTitle>
        </CardHeader>
        <form action={addEvent}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name</Label>
              <Input
                id="name"
                name="name"
                list="eventSuggestions"
                placeholder="What happened?"
                required
              />
              <datalist id="eventSuggestions" data-testid="event-suggestions">
                {eventNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">When did it happen?</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={today}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="reminder" name="reminder" />
              <Label htmlFor="reminder">Set a reminder</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminderDays">Remind me after (days)</Label>
              <Input
                id="reminderDays"
                name="reminderDays"
                type="number"
                min="1"
                placeholder="e.g. 30"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/">Cancel</Link>
            </Button>
            <Button type="submit">Add Event</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
