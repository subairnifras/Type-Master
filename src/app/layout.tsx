import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Type Master | Elegant 3D Typing Practice',
  description: 'Improve your typing speed (WPM) and accuracy with our interactive 3D mechanical keyboard simulator, user tier ranks, and global leaderboards.',
  keywords: 'typing speed, WPM, typing test, 3D keyboard, mechanical keyboard, leaderboard, type master',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="container main-content">
          {children}
        </main>
        <footer style={{ 
          textAlign: 'center', 
          padding: '24px 0', 
          borderTop: '1px solid var(--glass-border)', 
          fontSize: '0.85rem', 
          color: 'var(--text-muted)',
          background: 'rgba(8, 11, 17, 0.4)',
          backdropFilter: 'blur(8px)'
        }}>
          &copy; {new Date().getFullYear()} Type Master. Crafted with passion for mechanical keyboard enthusiasts.
        </footer>
      </body>
    </html>
  );
}
