import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { DemoBanner } from '@/components/demo-banner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Krafto — Create what people want. Sell what you create.',
  description: 'An India-first marketplace for original digital work, useful products, and real business demand.',
  openGraph: {
    title: 'Krafto — Create what people want. Sell what you create.',
    description: 'An India-first marketplace for original digital work, useful products, and real business demand.',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DemoBanner />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
