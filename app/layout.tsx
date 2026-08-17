import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Sarang Living — Love Every Little Thing',
    template: '%s | Sarang Living',
  },
  description:
    'Discover curated Korean-minimalist hair accessories, aesthetic gifts, and stationery. Claw clips, scrunchies, bows, headbands and more — starting from ₹10. Free shipping on orders above ₹999.',
  keywords: [
    'hair accessories',
    'claw clips',
    'scrunchies',
    'Korean hair accessories',
    'aesthetic accessories',
    'hair bows',
    'headbands',
    'Korean stationery',
    'aesthetic gifts',
    'Sarang Living',
  ],
  openGraph: {
    title: 'Sarang Living — Love Every Little Thing',
    description:
      'Curated Korean-minimalist hair accessories, aesthetic gifts, and stationery.',
    siteName: 'Sarang Living',
    locale: 'en_IN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className={plusJakarta.className}>
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <AnnouncementBar />
        <Header />
        <main id="main-content">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
