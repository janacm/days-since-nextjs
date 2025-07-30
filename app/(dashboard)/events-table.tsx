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
import { ArrowUpDown } from 'lucide-react';

export function EventsTable({ events }: { events: Event[] }) {
  const [query, setQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<'name' | 'date' | 'daysSince'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

  function handleSort(column: 'name' | 'date' | 'daysSince') {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      if (sortColumn === 'name') {
        return a.name.localeCompare(b.name) * direction;
      }
      if (sortColumn === 'date') {
        return (
          (new Date(a.date).getTime() - new Date(b.date).getTime()) * direction
        );
      }
      // daysSince
      const daysA = Math.floor(
        (Date.now() - new Date(a.date).getTime()) / (1000 * 3600 * 24)
      );
      const daysB = Math.floor(
        (Date.now() - new Date(b.date).getTime()) / (1000 * 3600 * 24)
      );
      return (daysA - daysB) * direction;
    });
  }, [filtered, sortColumn, sortDirection]);

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
                <TableHead
                  onClick={() => handleSort('name')}
                  className="cursor-pointer select-none"
                >
                  Event
                  <ArrowUpDown className="ml-1 inline h-3 w-3" />
                </TableHead>
                <TableHead
                  onClick={() => handleSort('date')}
                  className="cursor-pointer select-none"
                >
                  Date
                  <ArrowUpDown className="ml-1 inline h-3 w-3" />
                </TableHead>
                <TableHead
                  onClick={() => handleSort('daysSince')}
                  className="text-center cursor-pointer select-none"
                >
                  Days Since
                  <ArrowUpDown className="ml-1 inline h-3 w-3" />
                </TableHead>
                <TableHead className="hidden md:table-cell">Relative</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((event) => (
                <EventItem key={event.id} event={event} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
