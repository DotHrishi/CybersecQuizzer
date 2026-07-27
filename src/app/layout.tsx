import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@/components/ThemeProvider';
import BackgroundGradients from '@/components/BackgroundGradients';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CyberShield Quiz | Daily Cybersecurity Awareness',
  description: 'Test your cybersecurity knowledge daily. Earn points, trigger celebration reactions, and climb the leaderboard!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen flex flex-col justify-between`}>
        <ThemeProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#111111',
                color: '#F8FAFC',
                border: '1px solid rgba(0, 255, 102, 0.3)',
                boxShadow: '0 0 15px rgba(0, 255, 102, 0.15)',
              },
            }}
          />
          <BackgroundGradients />
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-6 max-w-6xl">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
