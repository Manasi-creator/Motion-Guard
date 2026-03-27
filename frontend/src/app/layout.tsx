import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MotionGuard AI - Real-time Motion Instability Prediction',
  description: 'AI-powered wearable monitoring system for real-time motion instability prediction in neurological and elderly patients',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
