/**
 * tradeora-web/lib/quality-gate.ts
 * ================================
 * Market Data Quality Gate & Quarantine Subsystem (TypeScript)
 */

import { CANONICAL_SOURCES_DAILY, FORBIDDEN_SOURCES, FRESHNESS_WINDOW_DAYS } from './canonical-price';

export type QualityStatus = 'VALID' | 'INVALID' | 'SUSPICIOUS' | 'STALE' | 'MISSING' | 'CORPORATE_ACTION_RELATED';

export interface QualityValidationResult {
  status: QualityStatus;
  isPass: boolean;
  rejectionReason: string | null;
  details?: Record<string, any>;
}

export function validatePriceRecord(
  record: {
    symbol?: string;
    company_id?: string;
    price_date?: string;
    open_price?: number | null;
    high_price?: number | null;
    low_price?: number | null;
    close_price?: number | null;
    volume?: number | null;
    source?: string;
  },
  previousClose?: number | null,
  knownCorporateActions?: Array<{ symbol: string; event_date: string; ratio?: number }>
): QualityValidationResult {
  const sym = record.symbol || record.company_id;
  const source = record.source || '';
  const dateStr = record.price_date ? record.price_date.slice(0, 10) : '';

  // 1. Mandatory Fields
  if (!sym) {
    return { status: 'MISSING', isPass: false, rejectionReason: 'Missing company identifier / symbol' };
  }
  if (!dateStr || isNaN(new Date(dateStr).getTime())) {
    return { status: 'MISSING', isPass: false, rejectionReason: `Invalid date: ${record.price_date}` };
  }

  // 2. Future Date Check
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
  if (dateStr > tomorrow) {
    return { status: 'INVALID', isPass: false, rejectionReason: `Future date: ${dateStr}` };
  }

  // 3. Source Checks
  if (FORBIDDEN_SOURCES.includes(source as any)) {
    return { status: 'INVALID', isPass: false, rejectionReason: `Forbidden data source: ${source}` };
  }

  // 4. Prices & OHLC Geometry
  const close = record.close_price != null ? Number(record.close_price) : 0;
  if (isNaN(close) || close <= 0) {
    return { status: 'INVALID', isPass: false, rejectionReason: `Non-positive close price: ${close}` };
  }

  const open = record.open_price != null ? Number(record.open_price) : null;
  const high = record.high_price != null ? Number(record.high_price) : null;
  const low = record.low_price != null ? Number(record.low_price) : null;

  if (high != null && low != null) {
    if (high < low) {
      return { status: 'INVALID', isPass: false, rejectionReason: `Geometry Violation: High (${high}) < Low (${low})` };
    }
    const maxBound = Math.max(close, open ?? close);
    if (high < maxBound) {
      return { status: 'INVALID', isPass: false, rejectionReason: `Geometry Violation: High (${high}) < max(Open, Close) (${maxBound})` };
    }
    const minBound = Math.min(close, open ?? close);
    if (low > minBound) {
      return { status: 'INVALID', isPass: false, rejectionReason: `Geometry Violation: Low (${low}) > min(Open, Close) (${minBound})` };
    }
  }

  // 5. Volume Check
  const vol = record.volume != null ? Number(record.volume) : null;
  if (vol != null && vol < 0) {
    return { status: 'INVALID', isPass: false, rejectionReason: `Negative volume: ${vol}` };
  }

  // 6. Price Drift & Corporate Action
  if (previousClose != null && previousClose > 0) {
    const drift = (close - previousClose) / previousClose;
    if (Math.abs(drift) >= 0.40) {
      const isConfirmed = knownCorporateActions?.some(
        ca => ca.symbol === sym && Math.abs(new Date(ca.event_date).getTime() - new Date(dateStr).getTime()) <= 2 * 86400000
      );
      if (isConfirmed) {
        return {
          status: 'CORPORATE_ACTION_RELATED',
          isPass: true,
          rejectionReason: null,
          details: { drift, note: 'Confirmed corporate action adjustment' }
        };
      } else {
        return {
          status: 'SUSPICIOUS',
          isPass: false,
          rejectionReason: `Large single-day price drift (${(drift * 100).toFixed(1)}%) without confirmed corporate action`
        };
      }
    }
  }

  // 7. Freshness
  const daysOld = Math.floor((now.getTime() - new Date(dateStr).getTime()) / 86400000);
  if (daysOld > FRESHNESS_WINDOW_DAYS) {
    return { status: 'STALE', isPass: true, rejectionReason: null, details: { daysOld } };
  }

  return { status: 'VALID', isPass: true, rejectionReason: null };
}
