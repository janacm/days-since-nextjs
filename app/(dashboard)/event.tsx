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
import { TableCell, TableRow } from '@/components/ui/table';
import { Event } from '@/lib/db';
import { deleteEvent } from './actions';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ResetButton } from './reset-button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function EventItem({ event }: { event: Event }) {
  const router = useRouter();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Calculate days since
  const daysSince = Math.floor(
    (new Date().getTime() - new Date(event.date).getTime()) / (1000 * 3600 * 24)
  );

  // Format the date
  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });

  // Get relative time (e.g., "2 months ago")
  const relativeTime = formatDistanceToNow(new Date(event.date), {
    addSuffix: true
  });

  // Check if reminder is due
  const isReminderDue =
    event.reminderDays &&
    daysSince >= event.reminderDays &&
    !event.reminderSent;

  const handleRowClick = (e: React.MouseEvent) => {
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
    <TableRow
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={handleRowClick}
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {event.name}
          {event.reminderDays && (
            <Badge variant={isReminderDue ? 'destructive' : 'secondary'}>
              <Bell className="h-3 w-3 mr-1" />
              {isReminderDue
                ? 'Reminder due!'
                : `Remind in ${event.reminderDays - daysSince} days`}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>{formattedDate}</TableCell>
      <TableCell className="text-center">
        <span className="text-lg font-bold">{daysSince}</span>
      </TableCell>
      <TableCell className="hidden md:table-cell text-muted-foreground">
        {relativeTime}
      </TableCell>
      <TableCell className="flex items-center gap-2">
        <ResetButton
          eventId={event.id}
          currentDate={event.date}
          onOpenChange={setIsResetModalOpen}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-haspopup="true" size="icon" variant="ghost">
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
      </TableCell>
    </TableRow>
  );
}
