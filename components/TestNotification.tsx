'use client';

import { Button } from '@/components/ui/button';
import { sendNotification } from '@/lib/notifications';
import { useState, useEffect } from 'react';

export default function TestNotification() {
  const [isIOS, setIsIOS] = useState(false);
  const [isLegacyIOS, setIsLegacyIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('🔔 TestNotification: Component mounted');
    const userAgent = navigator.userAgent;
    const iOSMatch = userAgent.match(/OS (\d+)_/);
    const iOSVersion = iOSMatch ? parseInt(iOSMatch[1], 10) : 0;
    const isIOSDetected = /iPad|iPhone|iPod/.test(userAgent);
    setIsIOS(isIOSDetected);
    console.log('🔔 TestNotification: iOS check', {
      isIOS: isIOSDetected,
      iOSVersion
    });

    setIsLegacyIOS(isIOSDetected && iOSVersion < 16);

    const pwaInstalled = window.matchMedia(
      '(display-mode: standalone)'
    ).matches;
    setIsInstalled(pwaInstalled);
    console.log('🔔 TestNotification: PWA installed check', { pwaInstalled });
  }, []);

  const handleTestNotification = async () => {
    console.log('🔔 TestNotification: handleTestNotification START');
    setIsLoading(true);

    try {
      if (isLegacyIOS) {
        console.error(
          '🔔 TestNotification: Legacy iOS detected. Notifications require iOS 16.4+.'
        );
        return;
      }
      console.log('🔔 TestNotification: Passed Legacy iOS check');

      if (isIOS && !isInstalled) {
        console.error(
          '🔔 TestNotification: App not installed as PWA on iOS. Please add to home screen for the best experience.'
        );
        return;
      }
      if (!isIOS && !isInstalled) {
        console.log(
          '🔔 TestNotification: App not running in standalone mode on desktop, proceeding with test notification anyway.'
        );
      }
      console.log(
        '🔔 TestNotification: Passed PWA installed check (or bypassed for non-iOS)'
      );

      console.log('🔔 TestNotification: Attempting to send notification...');
      const success = await sendNotification(
        'Test Notification',
        'This is a test notification from Days Since App',
        '/'
      );

      if (success) {
        console.log('🔔 TestNotification: sendNotification reported SUCCESS');
      } else {
        console.error(
          '🔔 TestNotification: sendNotification reported FAILURE. Check device/browser notification settings.'
        );
      }
    } catch (error) {
      console.error(
        '🔔 TestNotification: EXCEPTION during sendNotification:',
        error
      );
    } finally {
      setIsLoading(false);
      console.log('🔔 TestNotification: handleTestNotification END');
    }
  };

  return (
    <div>
      <Button
        onClick={handleTestNotification}
        className="mt-4"
        disabled={isLegacyIOS || isLoading}
      >
        {isLoading ? 'Sending...' : 'Send Test Notification'}
      </Button>
      <p className="mt-2 text-sm text-muted-foreground">
        {isLegacyIOS
          ? 'Push notifications require iOS 16.4 or later'
          : isIOS && !isInstalled
            ? 'Add to home screen for the best notification experience'
            : 'This will send a test notification to your device'}
      </p>
    </div>
  );
}
