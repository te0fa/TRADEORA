'use client';

import { useState, useEffect } from 'react';
import { getCairoTime, isMarketOpen } from '@/lib/market-utils';

export function useMarketStatus() {
  const [cairoTime, setCairoTime] = useState<string>('');
  const [cairoDate, setCairoDate] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    const update = () => {
      const info = getCairoTime();
      setCairoTime(info.timeString);
      setCairoDate(info.dateString);
      setIsOpen(isMarketOpen());
    };
    update();

    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return { cairoTime, cairoDate, isOpen };
}
