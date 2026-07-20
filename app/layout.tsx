import type { Metadata, Viewport } from 'next';
import './styles.css';

export const metadata: Metadata = {
  title: 'KIO · Krimpen Uit',
  description: 'Direct zicht op de uitgaande routes richting de Algerabrug.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#071913',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="nl"><body>{children}</body></html>;
}
