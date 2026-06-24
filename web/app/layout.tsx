import type {Metadata, Viewport} from 'next';
import {AppProviders} from '@/components/AppProviders';
import './globals.css';

export const metadata: Metadata = {
  title: 'Onreori',
  description: 'Fan event day planner',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ko">
      <body>
        <AppProviders>
          <div className="app-shell">{children}</div>
        </AppProviders>
      </body>
    </html>
  );
}
