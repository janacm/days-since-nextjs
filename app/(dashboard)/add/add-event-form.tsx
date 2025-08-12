'use client';

import { useOptimistic, useTransition, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addEvent } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import * as chrono from 'chrono-node';

interface AddEventFormProps {
  defaultDate: string;
}

export function AddEventForm({ defaultDate }: AddEventFormProps) {
  const router = useRouter();
  const [message, setMessage] = useOptimistic('');
  const [isPending, startTransition] = useTransition();
  const [quickInput, setQuickInput] = useState('');

  useEffect(() => {
    if (message === 'Event added!') {
      router.push('/');
    }
  }, [message, router]);

  function parseNaturalInput(input: string) {
    const results = chrono.parse(input);
    if (results.length === 0) {
      return null;
    }
    const result = results[0];
    let name = (
      input.slice(0, result.index) +
      input.slice(result.index + result.text.length)
    ).trim();
    name = name.replace(/\b(on|in|at|by|for|after|before)\s*$/i, '').trim();
    if (!name) {
      name = input;
    }
    const date = result.date();
    return { name, date: date.toISOString().split('T')[0] };
  }

  async function handleQuickAdd() {
    const parsed = parseNaturalInput(quickInput);
    if (!parsed) {
      setMessage('Could not understand input');
      return;
    }
    const formData = new FormData();
    formData.append('name', parsed.name);
    formData.append('date', parsed.date);
    setMessage('Event added!');
    startTransition(async () => {
      await addEvent(formData);
    });
  }

  function handleVoiceInput() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessage('Voice input not supported');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuickInput(transcript);
    };
    recognition.start();
  }

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
          <Label htmlFor="quickAdd">Quick Add</Label>
          <div className="flex gap-2">
            <Input
              id="quickAdd"
              placeholder="Purchased macbook on Dec 3rd 2024"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
            />
            <Button
              type="button"
              onClick={handleVoiceInput}
              aria-label="Start voice input"
            >
              🎤
            </Button>
            <Button type="button" onClick={handleQuickAdd} disabled={isPending}>
              Create
            </Button>
          </div>
        </div>
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
