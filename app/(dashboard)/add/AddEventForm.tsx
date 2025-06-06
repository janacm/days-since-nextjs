'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { addEventWithoutRedirect } from '../actions';
import { useEvents } from '@/components/events-context';

export default function AddEventForm({ defaultDate }: { defaultDate: string }) {
  const router = useRouter();
  const { addEvent, updateEvent } = useEvents();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const date = formData.get('date') as string;
    const reminder = formData.get('reminder') === 'on';
    const reminderDays = reminder ? Number(formData.get('reminderDays')) : null;

    const tempId = Date.now() * -1;
    addEvent({
      id: tempId,
      name,
      date: new Date(date).toISOString(),
      reminderDays,
      reminderSent: false,
      resetCount: 0,
      userId: ''
    } as any);

    router.push('/');
    startTransition(async () => {
      try {
        const created = await addEventWithoutRedirect(formData);
        updateEvent(created);
      } catch (err) {
        setError('Failed to add event');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Event Name</Label>
          <Input id="name" name="name" placeholder="What happened?" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">When did it happen?</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={defaultDate}
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
        {error && <p className="text-destructive text-sm">{error}</p>}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href="/">Cancel</Link>
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Adding...' : 'Add Event'}
        </Button>
      </CardFooter>
    </form>
  );
}
