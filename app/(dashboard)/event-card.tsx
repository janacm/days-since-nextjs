'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Bell } from 'lucide-react';
import { Event } from '@/lib/db';
import { deleteEvent } from './actions';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ResetButton } from './reset-button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function EventCard({ event }: { event: Event }) {
  const router = useRouter();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const now = new Date();
  const eventDate = new Date(event.date);

  // Calculate days since
  const daysSince = Math.floor(
    (now.getTime() - eventDate.getTime()) / (1000 * 3600 * 24)
  );

  const lastReminderSentAt = event.lastReminderSentAt
    ? new Date(event.lastReminderSentAt)
    : null;
  const reminderSentToday =
    lastReminderSentAt !== null &&
    lastReminderSentAt.toDateString() === now.toDateString();

  // Format the date
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });

  // Get relative time (e.g., "2 months ago")
  const relativeTime = formatDistanceToNow(eventDate, {
    addSuffix: true
  });

  // Check if reminder is due
  const hasReminder = typeof event.reminderDays === 'number';
  const isReminderDue =
    hasReminder &&
    daysSince >= (event.reminderDays ?? 0) &&
    !reminderSentToday;

  let reminderBadgeText: string | null = null;
  if (hasReminder) {
    if (isReminderDue) {
      reminderBadgeText = 'Reminder due!';
    } else if (reminderSentToday) {
      reminderBadgeText = 'Reminder sent today';
    } else {
      const remaining = (event.reminderDays ?? 0) - daysSince;
      reminderBadgeText = `Remind in ${Math.max(remaining, 0)} days`;
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or dropdown
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('[role="menuitem"]')
    ) {
      return;
    }
    if (isResetModalOpen) {
      return;
    }
    router.push(`/events/${event.id}`);
  };

  return (
    <div
      className="rounded-lg border bg-card p-4 cursor-pointer hover:bg-muted/50 transition-colors space-y-3"
      onClick={handleCardClick}
    >
      {/* Header: Name + Actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <h3 className="font-medium text-base truncate">{event.name}</h3>
          {hasReminder && reminderBadgeText && (
            <Badge variant={isReminderDue ? 'destructive' : 'secondary'} className="inline-flex">
              <Bell className="h-3 w-3 mr-1" />
              {reminderBadgeText}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {event.resettable !== false && (
            <ResetButton eventId={event.id} onOpenChange={setIsResetModalOpen} />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-haspopup="true"
                size="icon"
                variant="ghost"
                className="h-10 w-10 min-w-[44px] focus-visible:ring-2"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <a href={`/events/${event.id}`}>View Analytics</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={`/edit/${event.id}`}>Edit</a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <form action={deleteEvent}>
                  <input type="hidden" name="id" value={event.id} />
                  <button type="submit" className="w-full text-left">
                    Delete
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Date & Days Since */}
      <div className="flex items-center justify-between gap-4 pt-2 border-t">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">{formattedDate}</div>
          <div className="text-xs text-muted-foreground">{relativeTime}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{daysSince}</div>
          <div className="text-xs text-muted-foreground">days</div>
        </div>
      </div>
    </div>
  );
}
