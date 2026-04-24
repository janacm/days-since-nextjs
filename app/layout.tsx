import './globals.css';

import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: 'Days Since - Track Time Since Events',
  description:
    'A simple app to track how many days have passed since important events in your life.',
  manifest: '/manifest.json',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f4f2' },
    { media: '(prefers-color-scheme: dark)', color: '#18170f' }
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Days Since'
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="flex min-h-screen w-full min-w-0 flex-col overflow-x-hidden">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
