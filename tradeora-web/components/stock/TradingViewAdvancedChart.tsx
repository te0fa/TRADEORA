'use client';

import React, { useEffect, useState } from 'react';

interface TradingViewAdvancedChartProps {
  symbol: string;
  locale?: string;
  theme?: 'dark' | 'light';
  height?: number | string;
  onPriceUpdate?: (price: { close: number; changePct: number; changeAbs: number }) => void;
}

export function TradingViewAdvancedChart({
  symbol,
  locale = 'ar',
  theme = 'dark',
  height = 500,
}: TradingViewAdvancedChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const tvSymbol = `EGX:${symbol.toUpperCase()}`;
  const lang = locale === 'ar' ? 'ar' : 'en';
  const h = typeof height === 'number' ? `${height}px` : height;

  const iframeSrc = [
    'https://www.tradingview.com/widgetembed/',
    `?frameElementId=tradingview_${symbol.toLowerCase()}`,
    `&symbol=${encodeURIComponent(tvSymbol)}`,
    `&interval=D`,
    `&timezone=Africa%2FCairo`,
    `&theme=${theme}`,
    `&style=1`,
    `&locale=${lang}`,
    `&toolbar_bg=%230f172a`,
    `&enable_publishing=false`,
    `&allow_symbol_change=true`,
    `&save_image=true`,
    `&hide_side_toolbar=0`,
    `&studies=MASimple%40tv-basicstudies%2CRSI%40tv-basicstudies%2CMACD%40tv-basicstudies`,
    `&utm_source=localhost&utm_medium=widget&utm_campaign=chart`,
  ].join('');

  if (!isMounted) {
    return (
      <div
        className="w-full rounded-2xl overflow-hidden border border-white/10 bg-slate-950 flex items-center justify-center"
        style={{ height: h }}
      >
        <div className="text-slate-400 text-sm animate-pulse">جاري تحميل الشارت...</div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-slate-950 shadow-2xl">
      <iframe
        key={symbol}
        src={iframeSrc}
        style={{ width: '100%', height: h, border: 'none', display: 'block' }}
        allowFullScreen
        allow="fullscreen"
        title={`TradingView Chart - ${symbol}`}
        id={`tradingview_${symbol.toLowerCase()}`}
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

