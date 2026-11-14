import type { Metadata } from 'next';
import { Barlow, Barlow_Condensed } from 'next/font/google';
import { Providers } from '@/components/providers';
import { AppShell } from '@/components/layout/AppShell';
import { brand } from '@/lib/brand';
import './globals.css';

// Barlow is drawn from highway signs and licence plates: the vernacular of a parking deck.
const barlow = Barlow({
  variable: '--font-barlow',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const barlowCondensed = Barlow_Condensed({
  variable: '--font-barlow-condensed',
  subsets: ['latin'],
  weight: ['600', '700'],
});

export const metadata: Metadata = {
  title: { default: brand.name, template: `%s · ${brand.name}` },
  description: `${brand.descriptor}: parking, dues, facilities and community.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${barlow.variable} ${barlowCondensed.variable} antialiased`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
