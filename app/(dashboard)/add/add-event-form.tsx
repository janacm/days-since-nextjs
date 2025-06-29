'use client';

import { useOptimistic, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addEvent } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';

interface AddEventFormProps {
  defaultDate: string;
}

export function AddEventForm({ defaultDate }: AddEventFormProps) {
  const router = useRouter();
  const [message, setMessage] = useOptimistic('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (message === 'Event added!') {
      router.push('/');
    }
  }, [message, router]);

  async function handleSubmit(formData: FormData) {
    setMessage('Event added!');
    startTransition(async () => {
      await addEvent(formData);
    });
  }

  return (
    <form action={handleSubmit} className="contents">
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
        <div className="space-y-2">
          <Label htmlFor="reminderDays">Remind me after (days)</Label>
          <Input
            id="reminderDays"
            name="reminderDays"
            type="number"
            min="1"
            placeholder="e.g. 30"
          />
          <p className="text-xs text-muted-foreground">Optional</p>
        </div>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
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
