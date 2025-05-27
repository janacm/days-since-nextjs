'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, RotateCcw, Bell } from 'lucide-react';
import { Event } from '@/lib/db';
import { deleteEvent, resetEvent } from './actions';
import { ICellRendererParams } from 'ag-grid-community';
import { Badge } from '@/components/ui/badge';

// Helper function to calculate days since
const calculateDaysSince = (dateString: string): number => {
  return Math.floor(
    (new Date().getTime() - new Date(dateString).getTime()) / (1000 * 3600 * 24)
  );
};

export const EventNameCell = (props: ICellRendererParams<Event>) => {
  const { data } = props;

  if (!data) {
    return null;
  }

  const event = data;
  const daysSince = calculateDaysSince(event.date);

  // Check if reminder is due
  const isReminderDue =
    event.reminderDays &&
    daysSince >= event.reminderDays &&
    !event.reminderSent;

  return (
    <div className="flex items-center gap-2 font-medium">
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
  );
};

export const EventActionsCell = (props: ICellRendererParams<Event>) => {
  const { data } = props;

  if (!data) {
    return null;
  }

  const event = data;

  return (
    <div className="flex items-center justify-end gap-1 h-full">
      <form action={resetEvent}>
        <input type="hidden" name="id" value={event.id} />
        <Button
          size="icon"
          variant="ghost"
          type="submit"
          title="Reset Event Date"
        >
          <RotateCcw className="h-4 w-4" />
          <span className="sr-only">Reset event</span>
        </Button>
      </form>
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
            <a href={`/edit/${event.id}`}>Edit</a>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <form action={deleteEvent} className="w-full">
              <input type="hidden" name="id" value={event.id} />
              <button type="submit" className="w-full text-left">
                Delete
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
