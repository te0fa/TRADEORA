
export function getCairoTime(): {
  dateString: string; // YYYY-MM-DD
  timeString: string; // HH:MM:SS
  dayOfWeek: number;  // 0 (Sun) - 6 (Sat)
  hour: number;
  minute: number;
  second: number;
} {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(new Date());
  
  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }
  
  const year = map.year;
  const month = map.month;
  const day = map.day;
  const hour = parseInt(map.hour || '0', 10);
  const minute = parseInt(map.minute || '0', 10);
  const second = parseInt(map.second || '0', 10);
  
  const dateString = `${year}-${month}-${day}`;
  const timeString = `${map.hour}:${map.minute}:${map.second}`;
  
  // Day of week in Cairo
  const cairoDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));
  const dayOfWeek = cairoDate.getDay();
  
  return { dateString, timeString, dayOfWeek, hour, minute, second };
}

/**
 * Detects if the EGX is currently open.
 * EGX hours: Sunday-Thursday, 10:00 AM to 2:30 PM Cairo Time (10:00 -> 14:30)
 */
export function isMarketOpen(): boolean {
  const { dayOfWeek, hour, minute } = getCairoTime();
  
  // Sunday (0) to Thursday (4)
  const isBusinessDay = dayOfWeek >= 0 && dayOfWeek <= 4;
  if (!isBusinessDay) return false;
  
  // 10:00 to 14:30
  const timeInMinutes = hour * 60 + minute;
  const startInMinutes = 10 * 60; // 600
  const endInMinutes = 14 * 60 + 30; // 870
  
  return timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes;
}

export interface PriceRecord {
  id: string;
  company_id: string;
  open_price: number | null;
  high_price: number | null;
  low_price: number | null;
  close_price: number;
  change_value: number | null;
  change_percent: number | null;
  volume: number | null;
  source: string;
  price_date: string;
  data_quality_flag: string | null;
  fetched_at: string;
}

/**
 * Resolves the primary price record for a company based on business priority logic:
 * 1. If market is open today -> check for today's intraday_consensus
 * 2. When market is closed (or today's consensus isn't ready yet):
 *    - Determine the date of the most recent price record in the system (the "last session date").
 *    - A. Look for egx_bulletin on this last session date (Official EOD closing price)
 *    - B. Look for tradingview EOD on this last session date
 *    - C. Look for intraday_consensus on this last session date
 *    - D. Fallback: Any other record on this last session date
 * 3. Absolute Fallback: use absolute latest record overall.
 */
export function resolveLatestPrice(prices: PriceRecord[]): {
  priceRecord: PriceRecord | null;
  isLastResort: boolean;
  labelAr: string;
  labelEn: string;
} {
  if (!prices || prices.length === 0) {
    return { priceRecord: null, isLastResort: false, labelAr: '', labelEn: '' };
  }

  const { dateString } = getCairoTime();
  const marketOpen = isMarketOpen();

  // Sort prices globally by price_date DESC to ensure latest dates are first
  const sortedPrices = [...prices].sort((a, b) => {
    return new Date(b.price_date).getTime() - new Date(a.price_date).getTime();
  });

  // 1. If market is open today -> check for today's intraday_consensus
  if (marketOpen) {
    const todayConsensus = sortedPrices.find(
      p => p.price_date === dateString && p.source === 'intraday_consensus'
    );
    if (todayConsensus) {
      return {
        priceRecord: todayConsensus,
        isLastResort: false,
        labelAr: 'إجماع',
        labelEn: 'Consensus'
      };
    }
  }

  // 2. Locate the most recent session date (date of the latest price point in dataset)
  const lastSessionDate = sortedPrices[0].price_date;

  // Filter records belonging to the last session date
  const lastSessionPrices = sortedPrices.filter(p => p.price_date === lastSessionDate);

  // A. Prioritize egx_bulletin on the last session date
  const egxOnLastSession = lastSessionPrices.find(p => p.source === 'egx_bulletin');
  if (egxOnLastSession) {
    return {
      priceRecord: egxOnLastSession,
      isLastResort: false,
      labelAr: 'نشرة EGX',
      labelEn: 'EGX Bulletin'
    };
  }

  // B. Fallback to tradingview EOD on the last session date
  const tvOnLastSession = lastSessionPrices.find(p => p.source === 'tradingview');
  if (tvOnLastSession) {
    return {
      priceRecord: tvOnLastSession,
      isLastResort: false,
      labelAr: 'مباشر',
      labelEn: 'Live'
    };
  }

  // C. Fallback to intraday_consensus on the last session date
  const consensusOnLastSession = lastSessionPrices.find(p => p.source === 'intraday_consensus');
  if (consensusOnLastSession) {
    return {
      priceRecord: consensusOnLastSession,
      isLastResort: false,
      labelAr: 'إجماع',
      labelEn: 'Consensus'
    };
  }

  // D. Fallback to any record on the last session date
  if (lastSessionPrices.length > 0) {
    return {
      priceRecord: lastSessionPrices[0],
      isLastResort: true,
      labelAr: 'آخر سعر متاح',
      labelEn: 'Last Known'
    };
  }

  // 3. Absolute Fallback
  const absoluteLatest = sortedPrices[0];
  return {
    priceRecord: absoluteLatest,
    isLastResort: true,
    labelAr: 'آخر سعر متاح',
    labelEn: 'Last Known'
  };
}
