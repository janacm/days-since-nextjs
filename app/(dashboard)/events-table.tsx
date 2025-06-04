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
import { useOptimistic, useTransition } from 'react';

export function EventsTable({ events }: { events: Event[] }) {
  const [optimisticEvents, updateOptimisticEvents] = useOptimistic<Event[]>(events);
  const [, startTransition] = useTransition();

  const handleDelete = (id: number) => {
    updateOptimisticEvents((current) => current.filter((e) => e.id !== id));
    startTransition(async () => {
      const fd = new FormData();
      fd.append('id', id.toString());
      await deleteEvent(fd);
    });
  };

  const handleReset = (id: number, dateStr: string) => {
    updateOptimisticEvents((current) =>
      current.map((e) => (e.id === id ? { ...e, date: dateStr } : e))
    );
    startTransition(async () => {
      const fd = new FormData();
      fd.append('id', id.toString());
      fd.append('resetDate', dateStr);
      await resetEventWithDate(fd);
    });
  };

  const handleQuickReset = (id: number) => {
    const dateStr = new Date().toISOString();
    updateOptimisticEvents((current) =>
      current.map((e) => (e.id === id ? { ...e, date: dateStr } : e))
    );
    startTransition(async () => {
      const fd = new FormData();
      fd.append('id', id.toString());
      await resetEvent(fd);
    });
  };

  const renderedEvents = optimisticEvents;

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
