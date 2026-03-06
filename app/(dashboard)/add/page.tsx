import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { AddEventForm } from './add-event-form';
import { formatDateForInput } from '@/lib/date-utils';

export default function AddEventPage() {
  const today = formatDateForInput(new Date());

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
