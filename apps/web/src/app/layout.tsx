import type { Metadata } from 'next';
import { Bricolage_Grotesque } from 'next/font/google';
import { StoreProvider } from '@/store/StoreProvider';
import copy from '@/content/copy.json';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: `${copy.app.name} — Assessment Creator`,
  description: copy.app.tagline,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={bricolage.variable}>
      <body className="bg-body text-heading antialiased">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
