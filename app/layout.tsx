import './globals.css';

import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: 'Days Since - Track Time Since Events',
  description:
    'A simple app to track how many days have passed since important events in your life.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen w-full flex-col">{children}</body>
      <Analytics />
    </html>
  );
}
