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
  const [tag, setTag] = useState('');

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

  const tagFiltered =
    tag.trim() === ''
      ? filtered
      : filtered.filter((e) =>
          e.tags
            ?.toLowerCase()
            .split(',')
            .map((t) => t.trim())
            .includes(tag.toLowerCase())
        );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Events</CardTitle>
        <CardDescription>
          Track how many days have passed since important events. Click on any
          event to view detailed analytics.
        </CardDescription>
        {events.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Input
              placeholder="Search events..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              className="w-full sm:max-w-xs"
            />
            <Input
              placeholder="Filter by tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              type="search"
              className="w-full sm:max-w-xs"
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No events yet. Add your first event to get started!
          </div>
        ) : tagFiltered.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No events match your filters.
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
              {tagFiltered.map((event) => (
                <EventItem key={event.id} event={event} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
