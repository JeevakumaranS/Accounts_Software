import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DUROZEN ACCOUNTS — Financial & Accounting Management',
  description: 'Enterprise Double-Entry Bookkeeping & Indian GST Financial Control System for Durozen Technologies Pvt. Ltd.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${montserrat.variable} h-full`}>
      <body className="min-h-full font-sans antialiased bg-[#f6f8fb] text-[#17223a] selection:bg-[#2769d7] selection:text-white">
        {children}
      </body>
    </html>
  );
}
