'use client';

import { useOptimistic, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addEvent } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';

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
      <CardContent className="space-y-4 p-4 md:p-6">
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="name">Event Name</Label>
          <Input 
            id="name" 
            name="name" 
            placeholder="What happened?" 
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
            defaultValue={defaultDate}
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
            autoComplete="off"
            className="w-full text-base h-11"
          />
          <p className="text-xs text-muted-foreground break-words">Optional</p>
        </div>
        <div className="space-y-1.5 md:space-y-2">
          <div className="flex items-center gap-2 min-h-[44px]">
            <Checkbox id="isPrivate" name="isPrivate" className="h-5 w-5" />
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
            <Checkbox id="disableResets" name="disableResets" className="h-5 w-5" />
            <Label htmlFor="disableResets" className="cursor-pointer">Disable Resets</Label>
          </div>
          <p className="text-xs text-muted-foreground break-words min-w-0">
            When enabled, this event cannot be reset. You can still delete it.
          </p>
        </div>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </CardContent>
      <CardFooter className="flex justify-between gap-2 p-4 md:p-6">
        <Button variant="outline" asChild className="h-11 min-w-[44px] px-4">
          <Link href="/">Cancel</Link>
        </Button>
        <Button type="submit" disabled={isPending} className="h-11 min-w-[44px] px-4">
          {isPending ? 'Adding...' : 'Add Event'}
        </Button>
      </CardFooter>
    </form>
  );
}
