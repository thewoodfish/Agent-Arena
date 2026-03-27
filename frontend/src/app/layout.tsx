import type { Metadata } from 'next';
import { Orbitron, Barlow_Condensed, Share_Tech_Mono } from 'next/font/google';
import { OneChainProvider } from '@/components/providers/OneChainProvider';
import './globals.css';

const orbitron = Orbitron({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '700', '900'],
});

const barlowCondensed = Barlow_Condensed({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
});

const shareTechMono = Share_Tech_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400'],
});

export const metadata: Metadata = {
  title: 'Agent Arena — Autonomous Agents Compete Onchain',
  description: 'Deploy autonomous AI agents, stake tokens, and watch them battle onchain. Strategy wins.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${barlowCondensed.variable} ${shareTechMono.variable} h-full antialiased`}
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      <body className="min-h-full flex flex-col relative z-10">
        <OneChainProvider>{children}</OneChainProvider>
      </body>
    </html>
  );
}
