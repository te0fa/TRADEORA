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

INTERVAL_MAP = {
    '15m': (Interval.in_15_minute, 'tradingview_15m', 150),
    '30m': (Interval.in_30_minute, 'tradingview_30m', 150),
    '1h':  (Interval.in_1_hour,    'tradingview_1h',  150),
    '4h':  (Interval.in_4_hour,    'tradingview_4h',  150),
}

def fetch_and_upsert_symbol(comp: dict, intervals: list[str]):
    raw_sym = comp['symbol'].split('.')[0].upper()
    tv_sym = ALIAS_MAP.get(raw_sym, raw_sym)
    cid = comp['id']

    for ivl_key in intervals:
        tv_interval, source_name, bars_count = INTERVAL_MAP[ivl_key]
        df = None
        for attempt in range(1, 4):
            try:
                tv = TvDatafeed()
                df = tv.get_hist(
                    symbol=tv_sym,
                    exchange='EGX',
                    interval=tv_interval,
                    n_bars=bars_count
                )
                if df is not None and not df.empty:
                    break
            except Exception as e:
                time.sleep(1)

        if df is None or df.empty:
            logger.warning(f"[{raw_sym}] {ivl_key}: No data from TradingView")
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
                'source': source_name
            })

        if rows:
            try:
                for i in range(0, len(rows), 200):
                    sb.table('intraday_snapshots').upsert(
                        rows[i:i+200],
                        on_conflict='company_id,snapshot_time,source'
                    ).execute()
                logger.info(f"✅ [{raw_sym}] {ivl_key}: {len(rows)} candles written")
            except Exception as ex:
                logger.error(f"❌ [{raw_sym}] {ivl_key} Upsert error: {ex}")

        time.sleep(0.2)

def main():
    comps_res = sb.table('companies').select('id, symbol').eq('status', 'active').execute()
    companies = comps_res.data or []
    logger.info(f"🚀 Starting TV Intraday History Fill for {len(companies)} active companies...")

    for i, c in enumerate(companies):
        logger.info(f"[{i+1}/{len(companies)}] Processing {c['symbol']}...")
        fetch_and_upsert_symbol(c, ['15m', '30m', '1h', '4h'])

if __name__ == '__main__':
    main()
