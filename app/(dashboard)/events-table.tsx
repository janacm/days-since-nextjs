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
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import { EventItem } from './event';
import { Event } from '@/lib/db';

export function EventsTable({ events }: { events: Event[] }) {
  const [query, setQuery] = useState('');

  const fuse = useMemo(() => {
    return new Fuse(events, {
      keys: ['name'],
      threshold: 0.3
    });
  }, [events]);

  const filtered =
    query.trim() === ''
      ? events
      : fuse.search(query).map((result) => result.item);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Events</CardTitle>
        <CardDescription>
          Track how many days have passed since important events. Click on any
          event to view detailed analytics.
        </CardDescription>
        {events.length > 0 && (
          <Input
            placeholder="Search events..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            className="mt-4 w-full sm:max-w-xs"
          />
        )}
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No events yet. Add your first event to get started!
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No events match your search.
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
              {filtered.map((event) => (
                <EventItem key={event.id} event={event} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
