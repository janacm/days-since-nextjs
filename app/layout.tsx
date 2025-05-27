import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import NotificationSetup from './components/NotificationSetup';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Days Since - Track Time Since Events',
  description:
    'A simple app to track how many days have passed since important events in your life.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Days Since'
  }
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="flex min-h-screen w-full flex-col">
        {children}
        <NotificationSetup />
      </body>
      <Analytics />
    </html>
  );
}
