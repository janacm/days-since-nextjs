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
import { useState, useMemo, useRef } from 'react';
import Fuse from 'fuse.js';
import { EventItem } from './event';
import { Event } from '@/lib/db';

export function EventsTable({ events }: { events: Event[] }) {
  const [query, setQuery] = useState('');
  const [colWidths, setColWidths] = useState<number[]>([220, 150, 110, 180, 70]);
  const startX = useRef(0);
  const startWidths = useRef<number[]>(colWidths);

  const startResize = (index: number) => (e: React.MouseEvent) => {
    startX.current = e.clientX;
    startWidths.current = [...colWidths];
    const onMouseMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX.current;
      setColWidths((prev) => {
        const next = [...prev];
        next[index] = Math.max(60, startWidths.current[index] + delta);
        return next;
      });
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

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
          <Table className="table-fixed">
            <colgroup>
              {colWidths.map((w, i) => (
                <col key={i} style={{ width: w }} />
              ))}
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead className="relative">
                  Event
                  <div
                    onMouseDown={startResize(0)}
                    className="absolute right-0 top-0 hidden h-full w-1 cursor-col-resize md:block"
                  />
                </TableHead>
                <TableHead className="relative">
                  Date
                  <div
                    onMouseDown={startResize(1)}
                    className="absolute right-0 top-0 hidden h-full w-1 cursor-col-resize md:block"
                  />
                </TableHead>
                <TableHead className="relative text-center">
                  Days Since
                  <div
                    onMouseDown={startResize(2)}
                    className="absolute right-0 top-0 hidden h-full w-1 cursor-col-resize md:block"
                  />
                </TableHead>
                <TableHead className="relative hidden md:table-cell">
                  Relative
                  <div
                    onMouseDown={startResize(3)}
                    className="absolute right-0 top-0 hidden h-full w-1 cursor-col-resize md:block"
                  />
                </TableHead>
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
