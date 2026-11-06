import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { Providers } from '@/lib/query';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin', 'latin-ext'], weight: ['600', '700', '800'], variable: '--font-jakarta', display: 'swap' });
const inter = Inter({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = { title: 'Xhamia Qender', icons: { icon: '/favicon.ico' } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0E3B2C' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sq" className={`${jakarta.variable} ${inter.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
