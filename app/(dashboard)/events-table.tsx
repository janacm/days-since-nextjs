'use client';

import {
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  Table
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { EventItem } from './event';
import { Event } from '@/lib/db';
import { deleteEvent, resetEvent, resetEventWithDate } from './actions';
import { useTransition } from 'react';
import { useEvents } from '@/components/events-context';

export function EventsTable({ events: initialEvents }: { events?: Event[] }) {
  const { events: contextEvents, removeEvent, updateEvent } = useEvents();
  const events = initialEvents ?? contextEvents;
  const [, startTransition] = useTransition();

  const handleDelete = (id: number) => {
    removeEvent(id);
    startTransition(async () => {
      const fd = new FormData();
      fd.append('id', id.toString());
      await deleteEvent(fd);
    });
  };

  const handleReset = (id: number, dateStr: string) => {
    updateEvent({ id, date: dateStr } as Event);
    startTransition(async () => {
      const fd = new FormData();
      fd.append('id', id.toString());
      fd.append('resetDate', dateStr);
      await resetEventWithDate(fd);
    });
  };

  const handleQuickReset = (id: number) => {
    const dateStr = new Date().toISOString();
    updateEvent({ id, date: dateStr } as Event);
    startTransition(async () => {
      const fd = new FormData();
      fd.append('id', id.toString());
      await resetEvent(fd);
    });
  };

  const renderedEvents = events;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Events</CardTitle>
        <CardDescription>
          Track how many days have passed since important events. Click on any
          event to view detailed analytics.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderedEvents.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No events yet. Add your first event to get started!
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Days Since</TableHead>
                <TableHead className="hidden md:table-cell">Relative</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderedEvents.map((event) => (
                <EventItem
                  key={event.id}
                  event={event}
                  onDelete={handleDelete}
                  onReset={handleReset}
                  onQuickReset={handleQuickReset}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
