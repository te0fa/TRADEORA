import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Cairo, Inter } from 'next/font/google';
import { Navbar } from '@/components/layout/Navbar';
import { DisclaimerModal } from '@/components/layout/DisclaimerModal';

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['300', '400', '600', '700', '800', '900'],
  variable: '--font-cairo',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '900'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'TRADEORA — منصة التحليل الفني للبورصة المصرية',
  description:
    'تحليل فني احترافي لأسهم البورصة المصرية ' +
    'بالذكاء الاصطناعي والمؤشرات التقنية المتقدمة',
  keywords:
    'بورصة مصر, تحليل فني, EGX, TRADEORA, ' +
    'أسهم, توصيات, ذكاء اصطناعي',
  openGraph: {
    title: 'TRADEORA',
    description: 'منصة التحليل الفني للبورصة المصرية',
    images: ['/logo.png'],
    locale: 'ar_EG',
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/logo-icon.png',
  },
  themeColor: '#C9A84C',
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} className={`${cairo.variable} ${inter.variable} h-full`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#C9A84C" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/logo-icon.png" />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js');
            });
          }
        `}} />
      </head>
      <body className={`bg-bg-dark text-text-primary min-h-full flex flex-col ${locale === 'ar' ? 'font-cairo' : 'font-inter'} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Navbar locale={locale} />
          <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </main>
          <DisclaimerModal />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
