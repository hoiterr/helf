import '@helf/ui/styles.css';
import './globals.css';
import type { ReactNode } from 'react';
import { Nav } from './nav';

export const metadata = {
  title: 'helf',
  description: 'Unified fitness & recovery platform',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="helf-root">
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
