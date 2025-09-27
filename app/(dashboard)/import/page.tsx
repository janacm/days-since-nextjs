import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { importEvents } from '../actions';

export default async function ImportEventsPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect('/login');
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Import Events</CardTitle>
        </CardHeader>
        <form action={importEvents} encType="multipart/form-data">
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">CSV File</Label>
              <Input id="file" name="file" type="file" accept=".csv" required />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/">Cancel</Link>
            </Button>
            <Button type="submit">Import</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
