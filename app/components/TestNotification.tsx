'use client';

import { Button } from '@/components/ui/button';
import { sendNotification } from '@/lib/notifications';

export default function TestNotification() {
  const handleTestNotification = async () => {
    try {
      const success = await sendNotification(
        'Test Notification',
        'This is a test notification from Days Since App',
        '/'
      );
      if (!success) {
        alert(
          'Failed to send notification. Please ensure notifications are enabled in your browser.'
        );
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
      alert(
        'Failed to send notification. Please ensure notifications are enabled in your browser.'
      );
    }
  };

  return (
    <div>
      <Button onClick={handleTestNotification} className="mt-4">
        Send Test Notification
      </Button>
      <p className="mt-2 text-sm text-muted-foreground">
        This will send a test notification to your browser
      </p>
    </div>
  );
}
