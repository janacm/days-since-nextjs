import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, RotateCcw } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Event } from '@/lib/db';
import { deleteEvent, resetEvent } from './actions';
import { formatDistanceToNow } from 'date-fns';

export function EventItem({ event }: { event: Event }) {
  // Calculate days since
  const daysSince = Math.floor(
    (new Date().getTime() - new Date(event.date).getTime()) / (1000 * 3600 * 24)
  );

  // Format the date
  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Get relative time (e.g., "2 months ago")
  const relativeTime = formatDistanceToNow(new Date(event.date), {
    addSuffix: true
  });

  return (
    <TableRow>
      <TableCell className="font-medium">{event.name}</TableCell>
      <TableCell>{formattedDate}</TableCell>
      <TableCell className="text-center">
        <span className="text-lg font-bold">{daysSince}</span>
      </TableCell>
      <TableCell className="hidden md:table-cell text-muted-foreground">
        {relativeTime}
      </TableCell>
      <TableCell className="flex items-center gap-2">
        <form action={resetEvent}>
          <input type="hidden" name="id" value={event.id} />
          <Button size="icon" variant="ghost" type="submit">
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
