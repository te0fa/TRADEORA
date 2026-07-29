from tvDatafeed import TvDatafeed, Interval
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv
import os, time, sys, logging, argparse
from datetime import date, datetime

# Configure logging
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
os.makedirs(log_dir, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join(log_dir, 'tv_backfill.log'), encoding='utf-8')
    ]
)
logger = logging.getLogger("tradeora.tv_backfill")

# Load environment
load_dotenv()
url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not url or not key:
    logger.error("Missing SUPABASE_URL or SUPABASE_KEY in environment variables.")
    sys.exit(1)

sb: Client = create_client(url, key)

# TradingView credentials (optional)
TV_USERNAME = os.getenv('TV_USERNAME', '')
TV_PASSWORD = os.getenv('TV_PASSWORD', '')

def get_tv():
    if TV_USERNAME and TV_PASSWORD:
        return TvDatafeed(TV_USERNAME, TV_PASSWORD)
    return TvDatafeed()

INTERVAL_MAP = {
    '15m':  Interval.in_15_minute,
    '30m':  Interval.in_30_minute,
    '1h':   Interval.in_1_hour,
    '4h':   Interval.in_4_hour,
    '1d':   Interval.in_daily,
}

CONFIG = {
    '1d':  {'bars': 365, 'source': 'tradingview_1d'},
    '1h':  {'bars': 500, 'source': 'tradingview_1h'},
    '15m': {'bars': 500, 'source': 'tradingview_15m'},
    '30m': {'bars': 500, 'source': 'tradingview_30m'},
    '4h':  {'bars': 500, 'source': 'tradingview_4h'},
}

ALIAS_MAP = {
    'MNHD': 'MASR',      # Madinet Nasr -> Madinet Masr
    'ACRO': 'ACAMD',     # Acrow Misr
    'PHGC': 'PHDC',
}

def get_last_date(sb: Client, company_id: str, source: str) -> str | None:
    """
    Returns last snapshot_time or price_date in DB for source & company.
    """
    table = 'intraday_snapshots' if source != 'tradingview_1d' else 'market_prices'
    date_col = 'snapshot_time' if source != 'tradingview_1d' else 'price_date'

    try:
        res = sb.table(table) \
                 .select(date_col) \
                 .eq('company_id', company_id) \
                 .eq('source', source) \
                 .order(date_col, desc=True) \
                 .limit(1).execute()

        if res.data and len(res.data) > 0:
            return res.data[0][date_col]
    except Exception as e:
        logger.error(f"Error checking last date for {company_id} ({source}): {e}")
    return None

def backfill_symbol_interval(tv, symbol: str, company_id: str, interval_key: str, incremental: bool = True):
    """
    Backfills a single interval for a single symbol with retry logic and incremental check.
    Returns tuple: (status: 'processed' | 'skipped' | 'failed', candles_count: int)
    """
    cfg = CONFIG[interval_key]
    source_name = cfg['source']

    bars_needed = cfg['bars']
    days_missing = None

    if incremental:
        last = get_last_date(sb, company_id, source_name)
        if last:
            try:
                last_dt = datetime.fromisoformat(str(last)[:10]).date()
                days_missing = (date.today() - last_dt).days

                if days_missing <= 1:
                    logger.debug(f"[{symbol}] {source_name}: up-to-date. Skip.")
                    return 'skipped', 0

                bars_needed = min(days_missing + 5, cfg['bars'])
                logger.info(f"[{symbol}] {source_name}: fetching last {bars_needed} bars ({days_missing} days missing)")
            except Exception as e:
                logger.warning(f"[{symbol}] Could not parse last date '{last}': {e}. Fetching full {bars_needed} bars.")
        else:
            logger.info(f"[{symbol}] {source_name}: first time — fetching {bars_needed} bars")

    tv_symbol = ALIAS_MAP.get(symbol, symbol)
    df = None

    for attempt in range(1, 4):
        try:
            df = tv.get_hist(
                symbol=tv_symbol,
                exchange='EGX',
                interval=INTERVAL_MAP[interval_key],
                n_bars=bars_needed,
            )
            break
        except Exception as e:
            err_msg = str(e)
            logger.warning(f"  [RETRY {attempt}/3] {symbol} ({interval_key}): {err_msg}")
            if 'getaddrinfo' in err_msg or 'Connection' in err_msg or 'timed out' in err_msg:
                time.sleep(2)
                try:
                    tv = get_tv()
                except Exception:
                    pass

    if df is None or df.empty:
        logger.warning(f"  [SKIP] {symbol} ({interval_key}) — No data returned from TradingView")
        return 'skipped', 0

    try:
        rows = []
        market_price_rows = []
        df_sorted = df.sort_index()

        prev_close = None
        for ts, row in df_sorted.iterrows():
            ts_str = ts.isoformat()
            date_str = ts.strftime('%Y-%m-%d')
            close_p = float(row['close'])
            open_p  = float(row['open'])
            high_p  = float(row['high'])
            low_p   = float(row['low'])
            vol_val = int(row['volume']) if pd.notna(row['volume']) else 0

            rows.append({
                'company_id':    company_id,
                'snapshot_time': ts_str,
                'price':         close_p,
                'open_price':    open_p,
                'high_price':    high_p,
                'low_price':     low_p,
                'volume':        vol_val,
                'source':        source_name,
            })

            if interval_key == '1d':
                c_val = round(close_p - prev_close, 4) if prev_close is not None else round(close_p - open_p, 4)
                c_pct = round((c_val / prev_close) * 100, 2) if (prev_close and prev_close > 0) else (round(((close_p - open_p) / open_p) * 100, 2) if open_p > 0 else 0.0)

                market_price_rows.append({
                    'company_id':     company_id,
                    'price_date':     date_str,
                    'open_price':     open_p,
                    'high_price':     high_p,
                    'low_price':      low_p,
                    'close_price':    close_p,
                    'volume':         vol_val,
                    'change_value':   c_val,
                    'change_percent': c_pct,
                    'source':         'tradingview_1d'
                })
                prev_close = close_p

        batch = 500
        for i in range(0, len(rows), batch):
            sb.table('intraday_snapshots')\
              .upsert(rows[i:i+batch], on_conflict='company_id,snapshot_time,source')\
              .execute()

        if market_price_rows:
            for i in range(0, len(market_price_rows), batch):
                try:
                    sb.table('market_prices')\
                      .upsert(market_price_rows[i:i+batch], on_conflict='company_id,price_date,source')\
                      .execute()
                except Exception as ex:
                    logger.error(f"Error upserting market_prices for {symbol}: {ex}")

        logger.info(f"  [OK] {symbol} ({interval_key}): written {len(rows)} candles")
        return 'processed', len(rows)

    except Exception as e:
        logger.error(f"  [ERR] {symbol} ({interval_key}): {e}")
        return 'failed', 0

def main():
    parser = argparse.ArgumentParser(description="TradingView Daily Incremental Backfill Utility")
    parser.add_argument('--incremental', action='store_true', default=True, help="Fetch only missing candles (default: True)")
    parser.add_argument('--symbol', type=str, default=None, help="Target specific symbol for backfill")
    parser.add_argument('symbols_positional', nargs='*', help="Target specific symbols (positional args)")
    args = parser.parse_args()

    target_symbol = args.symbol
    if not target_symbol and args.symbols_positional:
        target_symbol = args.symbols_positional[0]

    companies_res = sb.table('companies').select('id, symbol').eq('status', 'active').execute()
    companies = companies_res.data or []
    comp_map = {c['symbol'].split('.')[0].upper(): c for c in companies}

    if target_symbol:
        sym_clean = target_symbol.upper().split('.')[0]
        if sym_clean in comp_map:
            target_companies = [comp_map[sym_clean]]
        else:
            logger.error(f"Symbol {target_symbol} not found among active companies in DB.")
            sys.exit(1)
        logger.info(f"Starting targeted backfill for symbol: {sym_clean}")
    else:
        priority_symbols = ['TMGH', 'COMI', 'FWRY', 'SWDY', 'ABUK', 'AMOC', 'EKHO', 'ORAS', 'CCAP', 'PHDC', 'EAST', 'TALM', 'TAQA', 'CICH']
        all_symbols = [c['symbol'].split('.')[0].upper() for c in companies]
        ordered_syms = [s for s in priority_symbols if s in all_symbols] + [s for s in all_symbols if s not in priority_symbols]
        target_companies = [comp_map[s] for s in ordered_syms if s in comp_map]
        logger.info(f"Starting daily backfill for {len(target_companies)} active companies...")

    tv = get_tv()
    intervals = ['15m', '30m', '1h', '4h', '1d']

    processed_count = 0
    skipped_count = 0
    failed_count = 0
    total_written = 0

    for i, comp in enumerate(target_companies):
        sym = comp['symbol'].split('.')[0].upper()
        cid = comp['id']
        logger.info(f"[{i+1}/{len(target_companies)}] Processing symbol: {sym}...")

        symbol_skipped = True
        symbol_failed = False

        for ivl in intervals:
            try:
                status, count = backfill_symbol_interval(tv, sym, cid, ivl, incremental=args.incremental)
                total_written += count
                if status == 'processed':
                    symbol_skipped = False
                elif status == 'failed':
                    symbol_failed = True
            except Exception as e:
                logger.error(f"[{sym}] Backfill failed for interval {ivl}: {e}")
                symbol_failed = True
            time.sleep(0.3)

        if symbol_failed:
            failed_count += 1
        elif symbol_skipped:
            skipped_count += 1
        else:
            processed_count += 1

    logger.info("═" * 50)
    logger.info("TV Backfill Daily Complete:")
    logger.info(f"  Symbols processed: {processed_count}")
    logger.info(f"  Symbols skipped (up-to-date): {skipped_count}")
    logger.info(f"  Symbols failed: {failed_count}")
    logger.info(f"  New candles written: {total_written}")
    logger.info("═" * 50)

if __name__ == '__main__':
    main()
