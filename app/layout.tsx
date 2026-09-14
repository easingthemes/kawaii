import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type React from 'react';

import '@/styles.css';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const SITE_NAME = 'Kawaii Kaja';

export const metadata: Metadata = {
  // Required so relative OG image paths resolve to absolute URLs.
  metadataBase: new URL('https://www.kawaiikaja.com'),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        {/* Duplicated from next.config.ts so the framing rules survive hosts that ignore headers(). */}
        <meta httpEquiv='X-Frame-Options' content='SAMEORIGIN' />
        <meta httpEquiv='Content-Security-Policy' content="frame-ancestors 'self'" />
      </head>
      <body className={`${fontSans.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
