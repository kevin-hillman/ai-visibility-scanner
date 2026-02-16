import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GEO Intelligence Engine - KI-Sichtbarkeit messen & optimieren',
  description: 'Messen Sie die KI-Sichtbarkeit Ihres Unternehmens über ChatGPT, Claude, Gemini und Perplexity. Professionelles GEO/SEO-Consulting für den DACH-Raum.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="scroll-smooth">
      <body className={`${inter.className} bg-[#0a0a0f] text-white antialiased`}>
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
