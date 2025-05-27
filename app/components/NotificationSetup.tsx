'use client';

import {
  requestNotificationPermission,
  registerServiceWorker
} from '@/lib/notifications';
import { useEffect } from 'react';

export default function NotificationSetup() {
  useEffect(() => {
    // Register service worker and request notification permission
    const setupNotifications = async () => {
      await registerServiceWorker();
      await requestNotificationPermission();
    };
    setupNotifications();
  }, []);

  return null;
}
