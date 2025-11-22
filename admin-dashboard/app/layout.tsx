import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PushNotify Admin',
  description: 'Admin dashboard for PushNotify push notification service',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
