"""
canonical.py — Tradeora Market Data Canonical Layer
====================================================
Single Source of Truth for all price data resolution.

Rules:
  - ALL modules must import from here
  - NO module may define its own source priority
  - This file is the ONLY place that decides
    which candle is canonical for a given symbol/date
"""

import logging
from datetime import date, datetime, timezone, timedelta

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════
# CONFIG — يُعدَّل هنا فقط وينعكس على الكل
# ═══════════════════════════════════════════════

CANONICAL_SOURCES_DAILY = [
    'tradingview_1d',     # Priority 1 — أعلى جودة
    'egx_bulletin',       # Priority 2 — رسمي
    'yahoo_historical',   # Priority 3 — موثوق
    'tradingview',        # Priority 4 — intraday backup
    'yahoo_live',         # Priority 5 — fallback
]

CANONICAL_SOURCES_INTRADAY = [
    'tradingview_15m',    # Priority 1
    'tradingview_30m',    # Priority 2
    'tradingview_1h',     # Priority 3
    'tradingview_4h',     # Priority 4
    'tradingview_1d',     # Priority 5 — fallback
]

FORBIDDEN_SOURCES = [
    'mubasher',
    'mubasher_close_only',
    'intraday_consensus',
    'investing',
    'tradingview_provider',
]

FRESHNESS_DAYS = 5       # آخر سعر مقبول لا يتجاوز 5 أيام
MIN_CANDLES    = 50      # حد أدنى للشموع لتوليد إشارة
MAX_DAILY_BARS = 365     # أقصى شموع يومية نجلبها

# ═══════════════════════════════════════════════
# CORE FUNCTION — نسخة محسّنة من fetch_canonical_candles
# ═══════════════════════════════════════════════

def get_canonical_candles(sb,
                           company_id: str,
                           symbol: str,
                           limit: int = 300,
                           interval: str = '1d') -> list[dict]:
    """
    THE canonical candle resolver for Tradeora.
    
    Returns clean, deduplicated, source-prioritized OHLCV candles
    for the given symbol. This is the ONLY function that should
    be called to get historical candles for any purpose:
      - Signal generation
      - Chart rendering  
      - Indicator calculation
      - Backtesting
      - AI training
    
    Args:
      sb:         Supabase client
      company_id: UUID of the company
      symbol:     Ticker symbol (for logging)
      limit:      Max candles to return
      interval:   '1d' for daily, '15m'/'1h'/'4h' for intraday
    
    Returns:
      List of clean candle dicts sorted ascending by date.
      Empty list if data is insufficient or stale.
    """
    # اختر المصادر المناسبة للفريم
    if interval == '1d':
        sources = CANONICAL_SOURCES_DAILY
        table   = 'market_prices'
        date_col = 'price_date'
        close_col = 'close_price'
        max_bars  = max(limit * 2, MAX_DAILY_BARS)
    else:
        sources = CANONICAL_SOURCES_INTRADAY
        table   = 'intraday_snapshots'
        date_col = 'snapshot_time'
        close_col = 'price'
        max_bars  = limit * 3
    
    # جلب البيانات
    res = sb.table(table).select(
        f"{date_col}, open_price, high_price, "
        f"low_price, {close_col}, volume, source"
    ).eq('company_id', company_id) \
     .in_('source', sources) \
     .order(date_col, desc=False) \
     .limit(max_bars).execute()
    
    rows = res.data or []
    
    if not rows:
        logger.debug(f"[{symbol}] No canonical data found")
        return []
    
    # Deduplication: أفضل مصدر لكل طابع زمني/يوم
    day_map = {}
    for row in rows:
        key = row[date_col] if interval != '1d' else row[date_col][:10]
        if key not in day_map:
            day_map[key] = row
        else:
            curr_pri = sources.index(day_map[key]['source']) \
                       if day_map[key]['source'] in sources else 99
            new_pri  = sources.index(row['source']) \
                       if row['source'] in sources else 99
            if new_pri < curr_pri:
                day_map[key] = row
    
    sorted_rows = sorted(day_map.values(), key=lambda r: r[date_col])
    
    # Freshness check
    if sorted_rows:
        last_date_str = sorted_rows[-1][date_col][:10]
        last_date     = date.fromisoformat(last_date_str)
        days_old      = (date.today() - last_date).days
        
        if days_old > FRESHNESS_DAYS:
            logger.warning(
                f"[{symbol}] Stale data: last record {days_old}d old "
                f"({last_date_str}). Skipping."
            )
            return []
    
    # Candle cleaning
    candles = []
    for row in sorted_rows:
        h = float(row.get('high_price')  or 0)
        l = float(row.get('low_price')   or 0)
        c = float(row.get(close_col) or row.get('close_price') or row.get('price') or 0)
        o = float(row.get('open_price')  or c)
        v = int(row.get('volume') or 0)
        
        if c <= 0:          continue  # سعر صفر
        if h == l == c:     continue  # Flat candle (Mubasher)
        if h < l:           continue  # بيانات مستحيلة
        if c > h * 1.5:     continue  # خطأ فادح
        
        candles.append({
            'date':   row[date_col],
            'open':   o if o > 0 else c,
            'high':   h if h > 0 else c,
            'low':    l if l > 0 else c,
            'close':  c,
            'volume': v,
            'source': row.get('source', 'unknown'),
        })
    
    result = candles[-limit:]
    
    logger.debug(
        f"[{symbol}] Canonical: {len(result)} candles "
        f"(interval={interval}, "
        f"sources={set(c['source'] for c in result)})"
    )
    
    return result


def get_canonical_price(sb,
                         company_id: str,
                         symbol: str) -> dict | None:
    """
    Returns the single canonical current price for a symbol.
    Used by: Guardian, Signal Engine, Chart header, API.
    
    Returns:
      {
        'price':      float,
        'source':     str,
        'updated_at': str,  # ISO timestamp
        'is_stale':   bool, # True if > 20 min old
      }
    or None if no price found.
    """
    # جلب أحدث سعر من المصادر الموثوقة
    res = sb.table('market_prices').select(
        'close_price, source, updated_at, price_date'
    ).eq('company_id', company_id) \
     .in_('source', CANONICAL_SOURCES_DAILY) \
     .order('price_date', desc=True) \
     .limit(5).execute()
    
    rows = res.data or []
    if not rows:
        return None
    
    # أخذ أفضل مصدر من أحدث يوم
    best = None
    for row in rows:
        if best is None:
            best = row
        else:
            curr_p = CANONICAL_SOURCES_DAILY.index(best['source']) \
                     if best['source'] in CANONICAL_SOURCES_DAILY else 99
            new_p  = CANONICAL_SOURCES_DAILY.index(row['source']) \
                     if row['source'] in CANONICAL_SOURCES_DAILY else 99
            if new_p < curr_p:
                best = row
    
    price      = float(best['close_price'] or 0)
    updated_at = best.get('updated_at') or best.get('price_date')
    
    # هل السعر قديم؟ (> 20 دقيقة)
    is_stale = False
    if updated_at:
        try:
            upd = datetime.fromisoformat(
                updated_at.replace('Z', '+00:00')
            )
            age_min = (datetime.now(timezone.utc) - upd).seconds / 60
            is_stale = age_min > 20
        except Exception:
            is_stale = True
    
    return {
        'price':      price,
        'source':     best['source'],
        'updated_at': updated_at,
        'is_stale':   is_stale,
    }
