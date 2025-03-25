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
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="recent" className="hidden sm:flex">
            Recent
          </TabsTrigger>
          <TabsTrigger value="reminders">
            Reminders
          </TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" className="h-8 gap-1" asChild>
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
        <EventsTable events={events} />
      </TabsContent>
      <TabsContent value="recent">
        <EventsTable events={events.slice(0, 5)} />
      </TabsContent>
      <TabsContent value="reminders">
        <EventsTable events={events.filter(event => event.reminderDays !== null)} />
      </TabsContent>
    </Tabs>
  );
}
