import os
import time
import logging
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client
from tvDatafeed import TvDatafeed, Interval

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

load_dotenv()
url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_KEY')

if not url or not key:
    logger.error("Missing Supabase credentials.")
    exit(1)

sb: Client = create_client(url, key)

ALIAS_MAP = {
    'MNHD': 'MASR',
    'ACRO': 'ACAMD',
    'PHGC': 'PHDC',
}

def main():
    comps_res = sb.table('companies').select('id, symbol').eq('status', 'active').execute()
    companies = comps_res.data or []
    logger.info(f"🚀 Starting TV 15m Backfill for {len(companies)} active companies...")

    total_candles = 0
    success = 0
    failed = 0

    for i, c in enumerate(companies):
        raw_sym = c['symbol'].split('.')[0].upper()
        tv_sym = ALIAS_MAP.get(raw_sym, raw_sym)
        cid = c['id']

        df = None
        for attempt in range(1, 3):
            try:
                tv = TvDatafeed()
                df = tv.get_hist(
                    symbol=tv_sym,
                    exchange='EGX',
                    interval=Interval.in_15_minute,
                    n_bars=100
                )
                if df is not None and not df.empty:
                    break
            except Exception as e:
                time.sleep(0.5)

        if df is None or df.empty:
            logger.warning(f"[{i+1}/{len(companies)}] ❌ {raw_sym}: No data")
            failed += 1
            continue

        rows = []
        for ts, r in df.iterrows():
            close_p = float(r['close'])
            open_p  = float(r['open']) if pd.notna(r['open']) else close_p
            high_p  = float(r['high']) if pd.notna(r['high']) else close_p
            low_p   = float(r['low'])  if pd.notna(r['low'])  else close_p
            vol     = int(r['volume']) if pd.notna(r['volume']) else 0

            rows.append({
                'company_id': cid,
                'snapshot_time': ts.isoformat(),
                'price': close_p,
                'open_price': open_p,
                'high_price': high_p,
                'low_price': low_p,
                'volume': vol,
                'source': 'tradingview_15m'
            })

        if rows:
            try:
                for b in range(0, len(rows), 200):
                    sb.table('intraday_snapshots').upsert(
                        rows[b:b+200],
                        on_conflict='company_id,snapshot_time,source'
                    ).execute()
                total_candles += len(rows)
                success += 1
                logger.info(f"[{i+1}/{len(companies)}] ✅ {raw_sym}: {len(rows)} candles")
            except Exception as ex:
                logger.error(f"[{i+1}/{len(companies)}] ❌ {raw_sym} Upsert error: {ex}")
                failed += 1

        time.sleep(0.2)

    logger.info("═" * 50)
    logger.info(f"Complete: {success} succeeded, {failed} failed, {total_candles} total candles written.")
    logger.info("═" * 50)

if __name__ == '__main__':
    main()
