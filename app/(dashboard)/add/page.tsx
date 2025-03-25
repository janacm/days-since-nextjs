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

export default function AddEventPage() {
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
                placeholder="What happened?"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">When did it happen?</Label>
              <Input id="date" name="date" type="date" required />
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
