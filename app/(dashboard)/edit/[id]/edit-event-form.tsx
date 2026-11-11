'use client';

import {
  createContext,
  useContext,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode
} from 'react';
import { editEvent } from '../../actions';
import { Button } from '@/components/ui/button';

const PendingContext = createContext(false);

/**
 * Client wrapper for the server-rendered edit fields. On success `editEvent`
 * redirects to '/'; it only returns when the event was not saved, e.g.
 * because the new name is already taken, and the error is shown here.
 * Uses onSubmit rather than `action` so React does not reset the fields
 * when the save is rejected.
 */
export function EditEventForm({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await editEvent(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <PendingContext.Provider value={isPending}>
      <form onSubmit={handleSubmit}>
        {error && (
          <p role="alert" className="px-4 md:px-6 text-sm text-destructive">
            {error}
          </p>
        )}
        {children}
      </form>
    </PendingContext.Provider>
  );
}

export function SubmitButton() {
  const pending = useContext(PendingContext);
  return (
    <Button type="submit" disabled={pending} className="h-11 min-w-[44px] px-4">
      {pending ? 'Saving...' : 'Save Changes'}
    </Button>
  );
}
