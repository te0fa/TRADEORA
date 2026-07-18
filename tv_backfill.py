from tvDatafeed import TvDatafeed, Interval
import pandas as pd
from supabase import create_client
from dotenv import load_dotenv
import os, time, sys

load_dotenv()
sb = create_client(os.getenv('SUPABASE_URL'),
                   os.getenv('SUPABASE_KEY'))

# TradingView credentials (optional)
TV_USERNAME = os.getenv('TV_USERNAME', '')
TV_PASSWORD = os.getenv('TV_PASSWORD', '')

def get_tv():
    if TV_USERNAME and TV_PASSWORD:
        return TvDatafeed(TV_USERNAME, TV_PASSWORD)
    return TvDatafeed()  # anonymous

INTERVAL_MAP = {
    '15m':  Interval.in_15_minute,
    '30m':  Interval.in_30_minute,
    '1h':   Interval.in_1_hour,
    '4h':   Interval.in_4_hour,
}

def backfill_symbol(tv, symbol: str, interval_key: str,
                    n_bars: int = 2000):
    """جيب وخزّن البيانات التاريخية لسهم واحد"""
    try:
        df = tv.get_hist(
            symbol=symbol,
            exchange='EGX',
            interval=INTERVAL_MAP[interval_key],
            n_bars=n_bars,
        )
        if df is None or df.empty:
            print(f"  [SKIP] {symbol} ({interval_key}) — لا توجد بيانات على TradingView", flush=True)
            return 0

        # جيب company_id
        res = sb.table('companies')\
                .select('id')\
                .ilike('symbol', f'%{symbol}%')\
                .execute()
        if not res.data:
            print(f"  [SKIP] {symbol} — غير موجود بقاعدة البيانات", flush=True)
            return 0

        company_id = res.data[0]['id']
        rows = []

        for ts, row in df.iterrows():
            rows.append({
                'company_id':   company_id,
                'snapshot_time': ts.isoformat(),
                'price':        float(row['close']),
                'open_price':   float(row['open']),
                'high_price':   float(row['high']),
                'low_price':    float(row['low']),
                'volume':       int(row['volume'])
                                if pd.notna(row['volume']) else 0,
                'source':       f'tradingview_{interval_key}',
            })

        # upsert في دفعات
        batch = 500
        for i in range(0, len(rows), batch):
            sb.table('intraday_snapshots')\
              .upsert(rows[i:i+batch],
                      on_conflict='company_id,snapshot_time,source')\
              .execute()

        print(f"  [OK] {symbol} — تم إدخال {len(rows)} شمعة لفريم {interval_key}", flush=True)
        return len(rows)

    except Exception as e:
        print(f"  [ERR] {symbol} ({interval_key}): {e}", flush=True)
        return 0

def main():
    # التحقق من تمرير وسيطات سهم معين
    args = sys.argv[1:]
    
    if args:
        symbols = [s.upper().split('.')[0] for s in args]
        print(f"بدء Backfill مخصص للأسهم المحددة: {symbols}", flush=True)
    else:
        # جيب كل الشركات
        companies = sb.table('companies')\
                      .select('symbol')\
                      .execute().data
        all_symbols = [c['symbol'].split('.')[0] for c in companies]
        
        # ترتيب الشركات الأهم أولاً لتسريع الحصول على بيانات الأسهم النشطة
        priority_symbols = ['TMGH', 'COMI', 'FWRY', 'SWDY', 'ABUK', 'AMOC', 'EKHO', 'ORAS', 'CCAP', 'PHDC', 'EAST', 'TALM', 'TAQA', 'CICH']
        
        # دمج الترتيب (الأولوية أولاً ثم البقية)
        symbols = [s for s in priority_symbols if s in all_symbols]
        symbols += [s for s in all_symbols if s not in priority_symbols]
        print(f"بدء backfill لـ {len(symbols)} سهم (مع أولوية الأسهم النشطة)...", flush=True)

    tv = get_tv()
    intervals = ['15m', '30m', '1h', '4h']

    for i, sym in enumerate(symbols):
        print(f"\n[{i+1}/{len(symbols)}] معالجة السهم: {sym}...", flush=True)
        for ivl in intervals:
            backfill_symbol(tv, sym, ivl, n_bars=2000)
            time.sleep(0.5)  # تجنب rate limiting

    print("\n✅ انتهى الـ backfill بنجاح!", flush=True)

if __name__ == '__main__':
    main()
