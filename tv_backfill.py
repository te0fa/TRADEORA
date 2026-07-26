from tvDatafeed import TvDatafeed, Interval
import pandas as pd
from supabase import create_client
from dotenv import load_dotenv
import os, time, sys

load_dotenv()
url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
sb = create_client(url, key)

# TradingView credentials (optional)
TV_USERNAME = os.getenv('TV_USERNAME', '')
TV_PASSWORD = os.getenv('TV_PASSWORD', '')

def get_tv():
    if TV_USERNAME and TV_PASSWORD:
        return TvDatafeed(TV_USERNAME, TV_PASSWORD)
    return TvDatafeed()  # anonymous

INTERVAL_MAP = {
    '1m':   Interval.in_1_minute,
    '5m':   Interval.in_5_minute,
    '15m':  Interval.in_15_minute,
    '30m':  Interval.in_30_minute,
    '1h':   Interval.in_1_hour,
    '4h':   Interval.in_4_hour,
    '1d':   Interval.in_daily,
}

# Known symbol alias map for EGX stocks on TradingView
ALIAS_MAP = {
    'MNHD': 'MASR',      # Madinet Nasr -> Madinet Masr
    'ACRO': 'ACAMD',     # Acrow Misr
    'PHGC': 'PHDC',
}

def backfill_symbol(tv, symbol: str, interval_key: str, n_bars: int = 2000):
    """جيب وخزّن البيانات التاريخية لسهم واحد مع محاولات إعادة الاتصال عند انقطاع الشبكة"""
    tv_symbol = ALIAS_MAP.get(symbol, symbol)
    df = None

    # محاولة الجلب مع إمكانية إعادة إنشاء الاتصال عند حدوث خطأ شبكة
    for attempt in range(1, 4):
        try:
            df = tv.get_hist(
                symbol=tv_symbol,
                exchange='EGX',
                interval=INTERVAL_MAP[interval_key],
                n_bars=n_bars,
            )
            break
        except Exception as e:
            err_msg = str(e)
            print(f"  [RETRY {attempt}/3] {symbol} ({interval_key}): {err_msg}", flush=True)
            if 'getaddrinfo' in err_msg or 'Connection' in err_msg or 'timed out' in err_msg:
                time.sleep(2)
                try:
                    tv = get_tv()  # إعادة فتح الاتصال
                except Exception:
                    pass

    if df is None or df.empty:
        print(f"  [SKIP] {symbol} ({interval_key}) — لا توجد بيانات على TradingView", flush=True)
        return 0

    try:
        # جيب company_id بمطابقة دقيقة أولاً
        res = sb.table('companies')\
                .select('id, symbol')\
                .eq('status', 'active')\
                .ilike('symbol', symbol)\
                .execute()
        if not res.data:
            res = sb.table('companies')\
                    .select('id, symbol')\
                    .eq('status', 'active')\
                    .ilike('symbol', f'%{symbol}%')\
                    .execute()

        if not res.data:
            print(f"  [SKIP] {symbol} — غير موجود بقاعدة البيانات", flush=True)
            return 0

        company_id = res.data[0]['id']
        rows = []
        market_price_rows = []

        for ts, row in df.iterrows():
            ts_str = ts.isoformat()
            date_str = ts.strftime('%Y-%m-%d')
            rows.append({
                'company_id':   company_id,
                'snapshot_time': ts_str,
                'price':        float(row['close']),
                'open_price':   float(row['open']),
                'high_price':   float(row['high']),
                'low_price':    float(row['low']),
                'volume':       int(row['volume']) if pd.notna(row['volume']) else 0,
                'source':       f'tradingview_{interval_key}',
            })

            if interval_key == '1d':
                market_price_rows.append({
                    'company_id':   company_id,
                    'price_date':   date_str,
                    'open_price':   float(row['open']),
                    'high_price':   float(row['high']),
                    'low_price':    float(row['low']),
                    'close_price':  float(row['close']),
                    'volume':       int(row['volume']) if pd.notna(row['volume']) else 0,
                    'change_value': round(float(row['close']) - float(row['open']), 4),
                    'change_percent': round(((float(row['close']) - float(row['open'])) / float(row['open'])) * 100, 2) if float(row['open']) > 0 else 0.0,
                    'source':       'tradingview_1d'
                })

        # upsert في دفعات لـ intraday_snapshots
        batch = 500
        for i in range(0, len(rows), batch):
            sb.table('intraday_snapshots')\
              .upsert(rows[i:i+batch], on_conflict='company_id,snapshot_time,source')\
              .execute()

        # إذا كانت يومية، أدخل في market_prices أيضاً
        if market_price_rows:
            for i in range(0, len(market_price_rows), batch):
                try:
                    sb.table('market_prices')\
                      .upsert(market_price_rows[i:i+batch], on_conflict='company_id,price_date')\
                      .execute()
                except Exception:
                    pass

        print(f"  [OK] {symbol} — تم إدخال {len(rows)} شمعة لفريم {interval_key}", flush=True)
        return len(rows)

    except Exception as e:
        print(f"  [ERR] {symbol} ({interval_key}): {e}", flush=True)
        return 0

def main():
    args = sys.argv[1:]
    
    if args:
        symbols = [s.upper().split('.')[0] for s in args]
        print(f"بدء Backfill مخصص للأسهم المحددة: {symbols}", flush=True)
    else:
        companies = sb.table('companies')\
                      .select('symbol')\
                      .eq('status', 'active')\
                      .execute().data
        all_symbols = [c['symbol'].split('.')[0] for c in companies]
        
        priority_symbols = ['TMGH', 'COMI', 'FWRY', 'SWDY', 'ABUK', 'AMOC', 'EKHO', 'ORAS', 'CCAP', 'PHDC', 'EAST', 'TALM', 'TAQA', 'CICH']
        
        symbols = [s for s in priority_symbols if s in all_symbols]
        symbols += [s for s in all_symbols if s not in priority_symbols]
        print(f"بدء backfill لـ {len(symbols)} سهم نشط...", flush=True)

    tv = get_tv()
    intervals = ['1m', '5m', '15m', '30m', '1h', '4h', '1d']

    for i, sym in enumerate(symbols):
        print(f"\n[{i+1}/{len(symbols)}] معالجة السهم: {sym}...", flush=True)
        for ivl in intervals:
            backfill_symbol(tv, sym, ivl, n_bars=2000)
            time.sleep(0.3)

    print("\n✅ انتهى الـ backfill بنجاح!", flush=True)

if __name__ == '__main__':
    main()
