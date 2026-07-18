import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Cairo, Inter } from 'next/font/google';
import { Navbar } from '@/components/layout/Navbar';

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
  title: 'TRADEORA — Stock Market Dashboard',
  description: 'Egyptian stock market consensus and analysis platform.',
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
      <body className={`bg-bg-dark text-text-primary min-h-full flex flex-col ${locale === 'ar' ? 'font-cairo' : 'font-inter'} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Navbar locale={locale} />
          <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
