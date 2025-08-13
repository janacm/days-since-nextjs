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
import { ChevronUp, ChevronDown } from 'lucide-react';
import Fuse from 'fuse.js';
import { EventItem } from './event';
import { Event } from '@/lib/db';

type SortField = 'name' | 'date' | 'daysSince' | 'relative';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField | null;
  direction: SortDirection;
}

export function EventsTable({ events }: { events: Event[] }) {
  const [query, setQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: null,
    direction: 'asc'
  });

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

  // Sort the filtered events
  const sortedAndFiltered = useMemo(() => {
    if (!sortConfig.field) return filtered;

    return [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'daysSince':
          aValue = Math.floor(
            (new Date().getTime() - new Date(a.date).getTime()) /
              (1000 * 3600 * 24)
          );
          bValue = Math.floor(
            (new Date().getTime() - new Date(b.date).getTime()) /
              (1000 * 3600 * 24)
          );
          break;
        case 'relative':
          // Sort by actual date for relative time
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filtered, sortConfig]);

  const handleSort = (field: SortField) => {
    setSortConfig((prevConfig) => ({
      field,
      direction:
        prevConfig.field === field && prevConfig.direction === 'asc'
          ? 'desc'
          : 'asc'
    }));
  };

  const SortableHeader = ({
    field,
    children,
    className = ''
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => {
    const isActive = sortConfig.field === field;
    const direction = isActive ? sortConfig.direction : null;

    return (
      <TableHead
        className={`cursor-pointer select-none hover:bg-muted/50 ${className}`}
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-1">
          {children}
          <div className="flex flex-col">
            <ChevronUp
              className={`h-3 w-3 ${
                isActive && direction === 'asc'
                  ? 'text-foreground'
                  : 'text-muted-foreground/50'
              }`}
            />
            <ChevronDown
              className={`h-3 w-3 -mt-1 ${
                isActive && direction === 'desc'
                  ? 'text-foreground'
                  : 'text-muted-foreground/50'
              }`}
            />
          </div>
        </div>
      </TableHead>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Events</CardTitle>
        <CardDescription>
          Track how many days have passed since important events. Click on any
          event to view detailed analytics. Click column headers to sort.
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
        ) : sortedAndFiltered.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No events match your search.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader field="name">Event</SortableHeader>
                <SortableHeader field="date">Date</SortableHeader>
                <SortableHeader field="daysSince" className="text-center">
                  Days Since
                </SortableHeader>
                <SortableHeader
                  field="relative"
                  className="hidden md:table-cell"
                >
                  Relative
                </SortableHeader>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFiltered.map((event) => (
                <EventItem key={event.id} event={event} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
