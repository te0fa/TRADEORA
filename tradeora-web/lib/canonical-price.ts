/**
 * tradeora-web/lib/canonical-price.ts
 * ====================================
 * Authoritative Canonical Price Resolution Engine (TypeScript)
 * 
 * Strict Truth Policy:
 * 1. Daily Priorities:
 *    Priority 1: 'tradingview_1d'
 *    Priority 2: 'egx_bulletin'
 *    Priority 3: 'yahoo_historical'
 *    Priority 4: 'tradingview'
 *    Priority 5: 'yahoo_live'
 * 
 * 2. Strictly FORBIDDEN Sources (Zero Tolerance):
 *    - 'mubasher'
 *    - 'mubasher_close_only'
 *    - 'intraday_consensus'
 *    - 'investing'
 *    - 'tradingview_provider'
 * 
 * 3. Freshness Gate: Price record must be within the last 10 days.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export const CANONICAL_SOURCES_DAILY = [
  'tradingview_1d',
  'egx_bulletin',
  'yahoo_historical',
  'tradingview',
  'yahoo_live',
] as const;

export const FORBIDDEN_SOURCES = [
  'mubasher',
  'mubasher_close_only',
  'intraday_consensus',
  'investing',
  'tradingview_provider',
] as const;

export const FRESHNESS_WINDOW_DAYS = 45;

export interface RawPriceRecord {
  company_id: string;
  close_price: number | string | null;
  open_price?: number | string | null;
  high_price?: number | string | null;
  low_price?: number | string | null;
  volume?: number | string | null;
  change_value?: number | string | null;
  change_percent?: number | string | null;
  price_date: string;
  source: string;
  fetched_at?: string | null;
  data_quality_flag?: string | null;
}

export interface CanonicalPriceRecord {
  company_id: string;
  close_price: number;
  open_price?: number;
  high_price?: number;
  low_price?: number;
  volume: number;
  change_value: number;
  change_percent: number;
  price_date: string;
  source: string;
  fetched_at?: string | null;
  data_quality_flag?: string | null;
  is_stale: boolean;
}

/**
 * Pure Canonical Resolver: Filters and sorts candidate price records to determine
 * the single authoritative price for each company.
 */
export function resolveCanonicalPrices(records: RawPriceRecord[]): Map<string, CanonicalPriceRecord> {
  const priceMap = new Map<string, CanonicalPriceRecord>();
  const now = Date.now();
  const freshnessThresholdMs = FRESHNESS_WINDOW_DAYS * 86400000;

  // Filter out forbidden sources and invalid prices
  const cleanRecords = records.filter(r => {
    if (!r.company_id || !r.price_date || !r.source) return false;
    if (FORBIDDEN_SOURCES.includes(r.source as any)) return false;
    const close = typeof r.close_price === 'number' ? r.close_price : parseFloat(String(r.close_price ?? '0'));
    if (isNaN(close) || close <= 0) return false;
    return true;
  });

  // Group and select the highest-priority record per company
  for (const row of cleanRecords) {
    const cid = row.company_id;
    const closeVal = typeof row.close_price === 'number' ? row.close_price : parseFloat(String(row.close_price));
    const openVal = row.open_price != null ? Number(row.open_price) : undefined;
    const highVal = row.high_price != null ? Number(row.high_price) : undefined;
    const lowVal = row.low_price != null ? Number(row.low_price) : undefined;
    const volVal = row.volume != null ? Math.max(0, parseInt(String(row.volume))) : 0;
    const chgVal = row.change_value != null ? Number(row.change_value) : 0;
    const chgPct = row.change_percent != null ? Number(row.change_percent) : 0;

    const rowDateMs = new Date(`${row.price_date.slice(0, 10)}T12:00:00Z`).getTime();
    const isStale = (now - rowDateMs) > freshnessThresholdMs;

    const candidate: CanonicalPriceRecord = {
      company_id: cid,
      close_price: closeVal,
      open_price: openVal,
      high_price: highVal,
      low_price: lowVal,
      volume: volVal,
      change_value: chgVal,
      change_percent: chgPct,
      price_date: row.price_date.slice(0, 10),
      source: row.source,
      fetched_at: row.fetched_at,
      is_stale: isStale,
    };

    if (!priceMap.has(cid)) {
      priceMap.set(cid, candidate);
    } else {
      const existing = priceMap.get(cid)!;
      // 1. Compare dates (Newer date always wins)
      if (candidate.price_date > existing.price_date) {
        priceMap.set(cid, candidate);
      } else if (candidate.price_date === existing.price_date) {
        // 2. Same date -> Compare source priorities
        const candPriority = CANONICAL_SOURCES_DAILY.indexOf(candidate.source as any);
        const existPriority = CANONICAL_SOURCES_DAILY.indexOf(existing.source as any);

        const candRank = candPriority === -1 ? 999 : candPriority;
        const existRank = existPriority === -1 ? 999 : existPriority;

        if (candRank < existRank) {
          priceMap.set(cid, candidate);
        } else if (candRank === existRank) {
          // 3. Same source rank -> Compare fetched_at
          const candFetch = candidate.fetched_at ? new Date(candidate.fetched_at).getTime() : 0;
          const existFetch = existing.fetched_at ? new Date(existing.fetched_at).getTime() : 0;
          if (candFetch > existFetch) {
            priceMap.set(cid, candidate);
          }
        }
      }
    }
  }

  return priceMap;
}

/**
 * Queries Supabase using the standardized get_latest_prices RPC or fallback query
 */
export async function fetchCanonicalLatestPrices(
  supabase: SupabaseClient,
  companyIds?: string[]
): Promise<Map<string, CanonicalPriceRecord>> {
  // 1. Try RPC get_latest_prices
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc('get_latest_prices');
    if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
      const filtered = companyIds && companyIds.length > 0
        ? rpcData.filter((r: any) => companyIds.includes(r.company_id))
        : rpcData;
      return resolveCanonicalPrices(filtered);
    }
  } catch (e) {
    console.warn('[CanonicalPrice] RPC get_latest_prices failed, using direct query fallback:', e);
  }

  // 2. Direct Query Fallback
  const minDate = new Date(Date.now() - FRESHNESS_WINDOW_DAYS * 86400000).toISOString().split('T')[0];
  let query = supabase
    .from('market_prices')
    .select('company_id, close_price, open_price, high_price, low_price, volume, change_value, change_percent, price_date, source, fetched_at')
    .in('source', [...CANONICAL_SOURCES_DAILY])
    .gte('price_date', minDate)
    .gt('close_price', 0)
    .order('price_date', { ascending: false });

  if (companyIds && companyIds.length > 0) {
    query = query.in('company_id', companyIds);
  }

  const { data, error } = await query.limit(1000);
  if (error || !data) {
    console.error('[CanonicalPrice] Direct query fallback failed:', error);
    return new Map();
  }

  return resolveCanonicalPrices(data);
}
