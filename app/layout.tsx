import type { Metadata } from 'next';
import { Space_Grotesk, JetBrains_Mono, Geist } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'CoreMatch · Talent Intelligence',
  description: 'AI-powered candidate evaluation platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(geist.variable, spaceGrotesk.variable, jetbrainsMono.variable)}
    >
      <body style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
