import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/layout/Header/Header';
import Footer from '@/layout/Footer/Footer';

const inter = Inter({
  subsets: ['cyrillic', 'latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Структурування законодавства',
  description: 'Платформа для структурування, пошуку та аналізу законодавства України',
  icons: {
    icon: 'favicon/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
