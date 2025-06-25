import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { getDatabaseInfo } from '@/lib/db';
import { sendTestEmail } from '../actions';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const dbInfo = await getDatabaseInfo();

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
          <CardTitle>Database</CardTitle>
          <CardDescription>
            Information about the connected database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="font-medium">Host:</span> {dbInfo.host}
          </p>
          <p>
            <span className="font-medium">Database:</span> {dbInfo.database}
          </p>
          <p>
            <span className="font-medium">Users:</span> {dbInfo.userCount}
          </p>
          <p>
            <span className="font-medium">Events:</span> {dbInfo.eventCount}
          </p>
          <p>
            <span className="font-medium">Products:</span> {dbInfo.productCount}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
