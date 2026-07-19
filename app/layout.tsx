import type { Metadata } from 'next';
import 'leaflet/dist/leaflet.css';
import './styles.css';

export const metadata: Metadata = {
  title: 'KIO — Krimpen In & Out',
  description: 'In één oogopslag de Algerabrug, wisselstrook en pontroute.'
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="nl"><body>{children}</body></html>;
}
