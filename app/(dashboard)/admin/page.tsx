import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { sendTestEmail } from '../actions';
import { ImportExportEvents } from './import-export';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  return (
    <div className="grid gap-4 lg:grid-cols-1">
      <Card>
        <CardHeader>
          <CardTitle>Admin Controls</CardTitle>
          <CardDescription>
            Administration functions for the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={sendTestEmail}>
            <Button type="submit">Send Test Email</Button>
            <p className="mt-2 text-sm text-muted-foreground">
              This will send a test email to {session.user.email}
            </p>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Import / Export Events</CardTitle>
          <CardDescription>Backup or restore all of your events</CardDescription>
        </CardHeader>
        <CardContent>
          <ImportExportEvents />
        </CardContent>
      </Card>
    </div>
  );
}
