import type { Metadata } from 'next';
import './globals.css';
import Navbar from '../components/Navbar';

export const metadata: Metadata = {
  title: 'ZoomSpace - Clean Video Conferencing',
  description: 'Sleek, modern WebRTC video conferencing clone built with Next.js and FastAPI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main style={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%'
        }}>
          {children}
        </main>
      </body>
    </html>
  );
}
