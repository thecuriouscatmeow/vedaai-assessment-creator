import type { Metadata } from 'next';
import { StoreProvider } from '@/store/StoreProvider';
import copy from '@/content/copy.json';
import './globals.css';

export const metadata: Metadata = {
  title: `${copy.app.name} — Assessment Creator`,
  description: copy.app.tagline,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-body text-heading antialiased">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
