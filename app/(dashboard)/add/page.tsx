import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { AddEventForm } from './add-event-form';

export default function AddEventPage() {
  // Get today's date in YYYY-MM-DD format using local timezone
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return (
    <div className="max-w-md mx-auto p-4 md:p-6">
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle>Add New Event</CardTitle>
        </CardHeader>
        <AddEventForm defaultDate={today} />
      </Card>
    </div>
  );
}
