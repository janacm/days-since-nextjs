export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('This browser does not support service workers');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered with scope:', registration.scope);
    return true;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return false;
  }
}

export async function sendNotification(
  title: string,
  body: string,
  url?: string
) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: { url }
    });
    return true;
  } catch (error) {
    console.error('Failed to send notification:', error);
    return false;
  }
}
