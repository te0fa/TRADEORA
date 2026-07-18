'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useMarketStatus } from '@/hooks/useMarketStatus';
import { toEasternArabic } from '@/lib/formatters';
import { Globe, Clock } from 'lucide-react';

interface NavbarProps {
  locale: string;
}

export function Navbar({ locale }: NavbarProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { cairoTime, isOpen } = useMarketStatus();

  // Swapping the locale prefix in the URL path
  const toggleLocale = () => {
    const nextLocale = locale === 'ar' ? 'en' : 'ar';
    const pathSegments = pathname.split('/');
    // pathSegments looks like ["", "ar", "stock", "COMI"]
    // segments[1] is the locale
    if (pathSegments[1] === 'ar' || pathSegments[1] === 'en') {
      pathSegments[1] = nextLocale;
    } else {
      // If locale prefix is omitted, insert it
      pathSegments.splice(1, 0, nextLocale);
    }
    router.push(pathSegments.join('/') || '/');
  };

  const formattedTime = locale === 'ar' ? toEasternArabic(cairoTime) : cairoTime;

  return (
    <header className="sticky top-0 z-50 w-full glass-card border-b border-white/5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href={`/${locale}`} className="text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-accent-blue via-blue-400 to-indigo-500 font-inter">
            {t('logo')}
          </Link>
        </div>

        {/* Live Status and Clock */}
        <div className="hidden md:flex items-center gap-6 text-sm text-text-secondary">
          {/* Market Status */}
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {isOpen ? t('sessionStatus.open') : t('sessionStatus.closed')}
            </span>
          </div>

          <div className="w-[1px] h-4 bg-white/10" />

          {/* Clock */}
          <div className="flex items-center gap-2 font-mono">
            <Clock className="w-4 h-4 text-accent-blue" />
            <span className="text-text-primary font-semibold">{formattedTime}</span>
            <span className="text-xs">({t('clockCairo')})</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Watchlist Link */}
          <Link 
            href={`/${locale}/watchlist`}
            className="text-xs sm:text-sm font-semibold text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/10 transition-all duration-200"
          >
            {t('watchlist.title')}
          </Link>

          {/* Language Switcher Button */}
          <button
            onClick={toggleLocale}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue border border-accent-blue/20 hover:border-accent-blue/30 transition-all duration-200 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{t('langSwitcher')}</span>
          </button>
        </div>
      </div>
      
      {/* Mobile Clock & Status Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-black/20 border-t border-white/5 text-[11px] text-text-secondary font-mono">
        <span className="font-semibold">
          {isOpen ? t('sessionStatus.open') : t('sessionStatus.closed')}
        </span>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-accent-blue" />
          <span className="text-text-primary font-bold">{formattedTime}</span>
          <span>({t('clockCairo')})</span>
        </div>
      </div>
    </header>
  );
}
