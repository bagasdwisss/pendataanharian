import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pendataan Harian - ATR/BPN Kantah Kota Medan',
  description: 'Aplikasi Pelaporan Progress Harian Plotting, Digitasi, SITATA, dan KKP Kantah Kota Medan',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1E1B4B',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-canvas text-brutal antialiased selection:bg-pastel-butter selection:text-brutal">
        {children}
      </body>
    </html>
  );
}
