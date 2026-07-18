import { supabase } from './supabase';
import { PriceRecord, resolveLatestPrice } from './market-utils';

export interface Company {
  id: string;
  symbol: string;
  isin: string | null;
  name_ar: string | null;
  name_en: string | null;
  sector: string | null;
  market_type: string | null;
  currency: string | null;
  is_shariah_compliant: boolean;
  listing_status: string | null;
}

export interface CompanyWithPrice extends Company {
  priceRecord: PriceRecord | null;
  isLastResort: boolean;
  sourceLabelAr: string;
  sourceLabelEn: string;
}

/**
 * Fetches all companies and their latest 5 price records, then resolves the priority price.
 */
export async function fetchCompaniesWithPrices(): Promise<CompanyWithPrice[]> {
  // Fetch companies profile data
  const { data: companies, error: compError } = await supabase
    .from('companies')
    .select(`
      id,
      symbol,
      isin,
      name_ar,
      name_en,
      sector,
      market_type,
      currency,
      is_shariah_compliant,
      listing_status
    `);

  if (compError) {
    console.error('Error fetching companies:', compError);
    throw compError;
  }

  // Call the database RPC function to retrieve the resolved latest price for each company
  const { data: prices, error: rpcError } = await supabase.rpc('get_latest_prices');

  if (rpcError) {
    console.error('Error calling get_latest_prices RPC:', rpcError);
    throw rpcError;
  }

  // Group latest price records by company_id for quick lookup
  const priceMap = new Map<string, any>();
  if (prices) {
    prices.forEach((p: any) => {
      priceMap.set(p.company_id, p);
    });
  }

  return (companies || []).map((item: any) => {
    const rawPrice = priceMap.get(item.id);
    let priceRecord: PriceRecord | null = null;
    let labelAr = '';
    let labelEn = '';

    if (rawPrice) {
      priceRecord = {
        id: `${rawPrice.company_id}-${rawPrice.source}`,
        company_id: rawPrice.company_id,
        open_price: null,
        high_price: null,
        low_price: null,
        close_price: Number(rawPrice.close_price),
        change_value: rawPrice.change_value !== null ? Number(rawPrice.change_value) : null,
        change_percent: rawPrice.change_percent !== null ? Number(rawPrice.change_percent) : null,
        volume: rawPrice.volume !== null ? Number(rawPrice.volume) : null,
        source: rawPrice.source,
        price_date: rawPrice.price_date,
        data_quality_flag: rawPrice.data_quality_flag,
        fetched_at: rawPrice.fetched_at
      };

      // Set translations based on source
      if (rawPrice.source === 'egx_bulletin') {
        labelAr = 'نشرة EGX';
        labelEn = 'EGX Bulletin';
      } else if (rawPrice.source === 'tradingview') {
        labelAr = 'مباشر';
        labelEn = 'Live';
      } else {
        labelAr = 'إجماع';
        labelEn = 'Consensus';
      }
    }

    return {
      id: item.id,
      symbol: item.symbol,
      isin: item.isin,
      name_ar: item.name_ar,
      name_en: item.name_en,
      sector: item.sector,
      market_type: item.market_type,
      currency: item.currency,
      is_shariah_compliant: item.is_shariah_compliant,
      listing_status: item.listing_status,
      priceRecord,
      isLastResort: false,
      sourceLabelAr: labelAr,
      sourceLabelEn: labelEn
    };
  });
}

/**
 * Fetches detail information for a single stock by its symbol.
 */
export async function fetchStockDetail(symbol: string): Promise<CompanyWithPrice | null> {
  const { data: company, error: compError } = await supabase
    .from('companies')
    .select(`
      id,
      symbol,
      isin,
      name_ar,
      name_en,
      sector,
      market_type,
      currency,
      is_shariah_compliant,
      listing_status
    `)
    .eq('symbol', symbol.toUpperCase())
    .single();

  if (compError || !company) {
    console.error(`Error fetching stock detail company for ${symbol}:`, compError);
    return null;
  }

  // Get the latest resolved price for this specific company using RPC
  const { data: prices, error: rpcError } = await supabase.rpc('get_latest_prices');
  if (rpcError) {
    console.error('Error calling get_latest_prices RPC for detail:', rpcError);
    return null;
  }

  const rawPrice = (prices || []).find((p: any) => p.company_id === company.id);
  let priceRecord: PriceRecord | null = null;
  let labelAr = '';
  let labelEn = '';

  if (rawPrice) {
    priceRecord = {
      id: `${rawPrice.company_id}-${rawPrice.source}`,
      company_id: rawPrice.company_id,
      open_price: null,
      high_price: null,
      low_price: null,
      close_price: Number(rawPrice.close_price),
      change_value: rawPrice.change_value !== null ? Number(rawPrice.change_value) : null,
      change_percent: rawPrice.change_percent !== null ? Number(rawPrice.change_percent) : null,
      volume: rawPrice.volume !== null ? Number(rawPrice.volume) : null,
      source: rawPrice.source,
      price_date: rawPrice.price_date,
      data_quality_flag: rawPrice.data_quality_flag,
      fetched_at: rawPrice.fetched_at
    };

    if (rawPrice.source === 'egx_bulletin') {
      labelAr = 'نشرة EGX';
      labelEn = 'EGX Bulletin';
    } else if (rawPrice.source === 'tradingview') {
      labelAr = 'مباشر';
      labelEn = 'Live';
    } else {
      labelAr = 'إجماع';
      labelEn = 'Consensus';
    }
  }

  return {
    id: company.id,
    symbol: company.symbol,
    isin: company.isin,
    name_ar: company.name_ar,
    name_en: company.name_en,
    sector: company.sector,
    market_type: company.market_type,
    currency: company.currency,
    is_shariah_compliant: company.is_shariah_compliant,
    listing_status: company.listing_status,
    priceRecord,
    isLastResort: false,
    sourceLabelAr: labelAr,
    sourceLabelEn: labelEn
  };
}

/**
 * Fetches intraday prices for a specific company.
 * Finds the latest date that has intraday data and retrieves all provider data points for that date.
 */
export async function fetchIntradayPrices(companyId: string): Promise<{
  date: string;
  points: {
    time: string; // e.g. "10:15"
    consensus: number | null;
    tradingview: number | null;
    mubasher: number | null;
    investing: number | null;
  }[];
}> {
  // 1. Find the latest date with intraday consensus data
  const { data: latestDateData, error: dateError } = await supabase
    .from('market_prices')
    .select('price_date')
    .eq('company_id', companyId)
    .eq('source', 'intraday_consensus')
    .order('price_date', { ascending: false })
    .limit(1);

  let targetDate = '';
  if (dateError || !latestDateData || latestDateData.length === 0) {
    // If no consensus, fallback to any intraday source date
    const { data: fallbackDateData } = await supabase
      .from('market_prices')
      .select('price_date')
      .eq('company_id', companyId)
      .in('source', ['tradingview', 'mubasher', 'investing'])
      .order('price_date', { ascending: false })
      .limit(1);

    if (!fallbackDateData || fallbackDateData.length === 0) {
      return { date: '', points: [] };
    }
    targetDate = fallbackDateData[0].price_date;
  } else {
    targetDate = latestDateData[0].price_date;
  }

  // 2. Fetch all records for that date from all intraday sources
  const { data: prices, error: pricesError } = await supabase
    .from('market_prices')
    .select('*')
    .eq('company_id', companyId)
    .eq('price_date', targetDate)
    .in('source', ['intraday_consensus', 'tradingview', 'mubasher', 'investing']);

  if (pricesError || !prices) {
    return { date: targetDate, points: [] };
  }

  // 3. Group by timestamp (15-min intervals)
  // fetched_at holds the timestamp (e.g. "2026-07-17T10:15:00+03:00")
  const timeGroups: Record<string, {
    consensus: number | null;
    tradingview: number | null;
    mubasher: number | null;
    investing: number | null;
  }> = {};

  prices.forEach((p: any) => {
    if (!p.fetched_at) return;
    
    // Extract HH:MM from fetched_at
    // E.g. "2026-07-17T10:15:00+03:00" -> "10:15"
    const dateObj = new Date(p.fetched_at);
    // Format to Cairo time representation HH:MM
    const cairoTimeStr = dateObj.toLocaleTimeString('en-US', {
      timeZone: 'Africa/Cairo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    if (!timeGroups[cairoTimeStr]) {
      timeGroups[cairoTimeStr] = {
        consensus: null,
        tradingview: null,
        mubasher: null,
        investing: null
      };
    }
    
    if (p.source === 'intraday_consensus') {
      timeGroups[cairoTimeStr].consensus = p.close_price;
    } else if (p.source === 'tradingview') {
      timeGroups[cairoTimeStr].tradingview = p.close_price;
    } else if (p.source === 'mubasher') {
      timeGroups[cairoTimeStr].mubasher = p.close_price;
    } else if (p.source === 'investing') {
      timeGroups[cairoTimeStr].investing = p.close_price;
    }
  });

  // Convert to sorted array of points
  const points = Object.keys(timeGroups)
    .map(time => ({
      time,
      ...timeGroups[time]
    }))
    .sort((a, b) => a.time.localeCompare(b.time));

  return { date: targetDate, points };
}

/**
 * Fetches historical close prices for a company up to 300 days.
 * Prefers egx_bulletin, falls back to tradingview for each date.
 */
export async function fetchHistoricalPrices(companyId: string, limit: number = 500): Promise<PriceRecord[]> {
  const { data, error } = await supabase
    .from('market_prices')
    .select('*')
    .eq('company_id', companyId)
    .in('source', ['egx_bulletin', 'tradingview', 'yahoo_historical', 'mubasher', 'investing'])
    .order('price_date', { ascending: false }); // get latest first

  if (error || !data) {
    console.error('Error fetching historical prices:', error);
    return [];
  }

  // De-duplicate: prefer egx_bulletin > tradingview > yahoo_historical > mubasher > investing
  const dailyMap: Record<string, PriceRecord> = {};
  const priority = (src: string) => {
    if (src === 'egx_bulletin') return 1;
    if (src === 'tradingview') return 2;
    if (src === 'yahoo_historical') return 3;
    if (src === 'mubasher') return 4;
    if (src === 'investing') return 5;
    return 6;
  };
  
  data.forEach((p: any) => {
    const date = p.price_date;
    const existing = dailyMap[date];
    if (!existing || priority(p.source) < priority(existing.source)) {
      dailyMap[date] = p;
    }
  });

  // Sort chronologically and slice to limit
  const historical = Object.values(dailyMap)
    .sort((a, b) => new Date(a.price_date).getTime() - new Date(b.price_date).getTime());
    
  return historical.slice(-limit);
}

/**
 * Fetches all daily price histories (unsorted, for details table)
 */
export async function fetchPriceHistoryTable(companyId: string): Promise<PriceRecord[]> {
  const { data, error } = await supabase
    .from('market_prices')
    .select('*')
    .eq('company_id', companyId)
    .order('price_date', { ascending: false });

  if (error || !data) {
    console.error('Error fetching full price history:', error);
    return [];
  }

  return data;
}

export interface SignalStat {
  id: string;
  company_id: string;
  symbol: string;
  timeframe: string;
  signal_type: string;
  total_signals: number;
  tp1_hits: number;
  tp2_hits: number;
  avg_bars_tp1: number | null;
  avg_bars_tp2: number | null;
  win_rate_tp1: number;
  win_rate_tp2: number;
  last_updated: string;
}

export async function fetchSignalStats(
  companyId: string
): Promise<SignalStat[]> {
  const { data, error } = await supabase
    .from('signal_stats')
    .select('*')
    .eq('company_id', companyId);
  if (error) {
    console.error('Error fetching signal stats:', error);
    return [];
  }
  return data ?? [];
}
