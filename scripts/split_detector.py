import os
import sys
import logging
from datetime import date, timedelta

# Configure logger
logger = logging.getLogger("tradeora.split_detector")

# ─── Corporate Action Thresholds ──────
SPLIT_THRESHOLD   = 0.40   # Change <= -40% in one day = suspicious split
REVERSE_THRESHOLD = 0.40   # Change >= +40% in one day = suspicious reverse split
MIN_DAYS_DATA     = 10     # Minimum days of historical candles required

CLEAN_SOURCES = [
    'tradingview_1d', 'egx_bulletin',
    'yahoo_historical', 'tradingview'
]

def detect_price_anomaly(closes: list[float],
                          dates: list[str],
                          symbol: str) -> dict:
    """
    Scans price list for suspicious single-day price jumps indicating 
    Corporate Actions (Splits / Reverse Splits).
    
    Returns:
      {
        'has_anomaly': bool,
        'anomaly_date': str | None,
        'anomaly_ratio': float | None,
        'anomaly_type': 'split' | 'reverse_split' | None,
        'pre_anomaly_price': float | None,
        'post_anomaly_price': float | None,
      }
    """
    result = {
        'has_anomaly':       False,
        'anomaly_date':      None,
        'anomaly_ratio':     None,
        'anomaly_type':      None,
        'pre_anomaly_price': None,
        'post_anomaly_price': None,
    }
    
    if len(closes) < MIN_DAYS_DATA:
        return result
    
    for i in range(1, len(closes)):
        prev  = closes[i - 1]
        curr  = closes[i]
        
        if prev <= 0 or curr <= 0:
            continue
        
        daily_change = (curr - prev) / prev
        
        # Fall <= -40% in a single day = Suspicious Split
        if daily_change <= -SPLIT_THRESHOLD:
            result.update({
                'has_anomaly':       True,
                'anomaly_date':      dates[i],
                'anomaly_ratio':     round(daily_change, 4),
                'anomaly_type':      'split',
                'pre_anomaly_price':  round(prev, 3),
                'post_anomaly_price': round(curr, 3),
            })
            logger.warning(
                f"[{symbol}] SPLIT DETECTED on {dates[i]}: "
                f"{prev:.2f} → {curr:.2f} "
                f"({daily_change*100:.1f}%)"
            )
            return result
        
        # Rise >= +40% in a single day = Suspicious Reverse Split
        if daily_change >= REVERSE_THRESHOLD:
            result.update({
                'has_anomaly':       True,
                'anomaly_date':      dates[i],
                'anomaly_ratio':     round(daily_change, 4),
                'anomaly_type':      'reverse_split',
                'pre_anomaly_price':  round(prev, 3),
                'post_anomaly_price': round(curr, 3),
            })
            logger.warning(
                f"[{symbol}] REVERSE SPLIT DETECTED on {dates[i]}: "
                f"{prev:.2f} → {curr:.2f} "
                f"({daily_change*100:.1f}%)"
            )
            return result
    
    return result

def check_entry_price_validity(entry_price: float,
                                current_price: float,
                                symbol: str,
                                max_drift: float = 0.60
                                ) -> dict:
    """
    Verifies that entry_price remains reasonable compared to current price.
    max_drift = 0.60 (60%). If drift > 60%, flags as suspicious corporate action.
    
    Returns:
      {
        'is_valid': bool,
        'drift_pct': float,
        'warning': str | None
      }
    """
    if entry_price <= 0 or current_price <= 0:
        return {'is_valid': False,
                'drift_pct': 0,
                'warning': 'Invalid price (zero or negative)'}
    
    drift = abs(current_price - entry_price) / entry_price
    
    if drift > max_drift:
        warning = (
            f"[{symbol}] Entry price drift too large: "
            f"entry={entry_price:.2f}, "
            f"current={current_price:.2f}, "
            f"drift={drift*100:.1f}% > {max_drift*100:.0f}% threshold. "
            f"Possible corporate action — signal flagged."
        )
        logger.warning(warning)
        return {
            'is_valid': False,
            'drift_pct': round(drift, 4),
            'warning': warning
        }
    
    return {
        'is_valid': True,
        'drift_pct': round(drift, 4),
        'warning': None
    }

def scan_all_symbols(sb) -> list[dict]:
    """
    Scans all active companies for corporate action anomalies.
    """
    companies = sb.table('companies') \
                  .select('id, symbol') \
                  .execute().data or []
    
    comp_map = {c['id']: c['symbol'] for c in companies}
    active_ids = set(comp_map.keys())
    
    thirty_days_ago = (date.today() - timedelta(days=30)).isoformat()
    
    all_rows = []
    page_size = 1000
    start = 0
    while True:
        res = sb.table('market_prices') \
                .select('company_id, price_date, close_price') \
                .in_('source', CLEAN_SOURCES) \
                .gte('price_date', thirty_days_ago) \
                .range(start, start + page_size - 1) \
                .order('id').execute()
        data = res.data or []
        if not data:
            break
        all_rows.extend(data)
        if len(data) < page_size:
            break
        start += page_size

    co_prices = {}
    for row in all_rows:
        cid = row['company_id']
        if cid in active_ids and row.get('close_price'):
            co_prices.setdefault(cid, []).append(row)

    anomalies = []
    for cid, rows in co_prices.items():
        symbol = comp_map[cid]
        
        day_map = {}
        for row in rows:
            d = row['price_date']
            if d not in day_map:
                day_map[d] = float(row['close_price'] or 0)
        
        dates  = sorted(day_map.keys())
        closes = [day_map[d] for d in dates]
        
        if len(closes) < MIN_DAYS_DATA:
            continue
            
        anomaly = detect_price_anomaly(closes, dates, symbol)
        if anomaly['has_anomaly']:
            anomaly['symbol']     = symbol
            anomaly['company_id'] = cid
            anomalies.append(anomaly)
    
    return anomalies

if __name__ == '__main__':
    sys.path.insert(0, '.')
    from generate_daily_recommendations import sb
    
    print("Scanning all symbols for corporate actions...")
    anomalies = scan_all_symbols(sb)
    
    if not anomalies:
        print("✅ No corporate actions detected.")
    else:
        print(f"\n⚠️  Found {len(anomalies)} anomalies:\n")
        for a in anomalies:
            print(
                f"  {a['symbol']:8s} | "
                f"{a['anomaly_type']:14s} | "
                f"Date: {a['anomaly_date']} | "
                f"Before: {a['pre_anomaly_price']:.2f} | "
                f"After: {a['post_anomaly_price']:.2f} | "
                f"Change: {a['anomaly_ratio']*100:.1f}%"
            )
        
        print(f"\nRecommendation: Review these symbols manually")
        print(f"and adjust entry_price or close affected signals.")
