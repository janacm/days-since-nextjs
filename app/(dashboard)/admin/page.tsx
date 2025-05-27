import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { sendTestEmail } from '../actions';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import TestNotification from '../../../components/TestNotification';

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
        <CardContent className="space-y-6">
          <div>
            <form action={sendTestEmail}>
              <Button type="submit">Send Test Email</Button>
              <p className="mt-2 text-sm text-muted-foreground">
                This will send a test email to {session.user.email}
              </p>
            </form>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium">Test Push Notifications</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Test browser push notifications for your device
            </p>
            <TestNotification />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
