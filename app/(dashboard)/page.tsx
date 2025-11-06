import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EventsTable } from './events-table';
import { getEvents } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const events = await getEvents(session.user.email);

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center gap-3 min-w-0">
        <div className="overflow-x-auto no-scrollbar min-w-0 flex-1">
          <TabsList className="inline-flex">
            <TabsTrigger value="all">All Events</TabsTrigger>
            <TabsTrigger value="recent" className="hidden sm:flex">
              Recent
            </TabsTrigger>
            <TabsTrigger value="reminders" className="whitespace-nowrap">
              Has reminder
            </TabsTrigger>
            <TabsTrigger value="overdue" className="whitespace-nowrap">
              Is overdue
            </TabsTrigger>
            <TabsTrigger value="private">Private</TabsTrigger>
          </TabsList>
        </div>
        <div className="shrink-0">
          <Button size="sm" className="h-11 min-w-[44px] gap-1" asChild>
            <Link href="/add">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Event
              </span>
            </Link>
          </Button>
        </div>
      </div>
      <TabsContent value="all">
        <EventsTable events={events.filter((event) => !event.isPrivate)} />
      </TabsContent>
      <TabsContent value="recent">
        <EventsTable events={events.filter((event) => !event.isPrivate).slice(0, 5)} />
      </TabsContent>
      <TabsContent value="reminders">
        <EventsTable
          events={events.filter((event) => !event.isPrivate && event.reminderDays !== null)}
        />
      </TabsContent>
      <TabsContent value="overdue">
        <EventsTable
          events={events.filter((event) => {
            if (event.isPrivate) return false;
            if (event.reminderDays === null) return false;
            const daysSince = Math.floor(
              (Date.now() - new Date(event.date).getTime()) / (1000 * 3600 * 24)
            );
            return daysSince >= event.reminderDays;
          })}
        />
      </TabsContent>
      <TabsContent value="private">
        <EventsTable events={events.filter((event) => event.isPrivate)} />
      </TabsContent>
    </Tabs>
  );
}
