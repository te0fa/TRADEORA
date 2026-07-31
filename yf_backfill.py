"""
yf_backfill.py
==============
Yahoo Finance Intraday Backfill for EGX companies.
يُستخدم كمصدر ثاني مجاني لجلب الشموع أثناء جلسة التداول
ولسد فجوات البيانات المفقودة من tvDatafeed.

EGX ticker format: SYMBOL.CA (e.g. COMI.CA, TMGH.CA)

Intervals supported by yfinance:
  1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d

Usage:
  python yf_backfill.py --intervals 15m,1h,1d          # كل الشركات
  python yf_backfill.py --symbol COMI --intervals 1d    # سهم واحد
  python yf_backfill.py --fill-gaps                     # سد الفجوات فقط
  python yf_backfill.py --live                          # وضع الجلسة الحية
"""

import yfinance as yf
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv
import os, sys, time, logging, argparse
from datetime import date, datetime, timedelta, timezone

# ── Logging ────────────────────────────────────────────────────────────────────
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
os.makedirs(log_dir, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join(log_dir, 'yf_backfill.log'), encoding='utf-8'),
    ]
)
logger = logging.getLogger('tradeora.yf_backfill')

# ── Supabase ───────────────────────────────────────────────────────────────────
load_dotenv()
url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
if not url or not key:
    logger.error('Missing SUPABASE_URL or SUPABASE_KEY')
    sys.exit(1)
sb: Client = create_client(url, key)

# ── Config ─────────────────────────────────────────────────────────────────────
INTERVAL_CONFIG = {
    '5m':  {'period': '5d',   'source': 'yahoo_5m',  'table': 'intraday_snapshots', 'date_col': 'snapshot_time'},
    '15m': {'period': '7d',   'source': 'yahoo_15m', 'table': 'intraday_snapshots', 'date_col': 'snapshot_time'},
    '30m': {'period': '30d',  'source': 'yahoo_30m', 'table': 'intraday_snapshots', 'date_col': 'snapshot_time'},
    '1h':  {'period': '60d',  'source': 'yahoo_1h',  'table': 'intraday_snapshots', 'date_col': 'snapshot_time'},
    '1d':  {'period': '2y',   'source': 'yahoo_1d',  'table': 'market_prices',      'date_col': 'price_date'},
}

# Known symbol mismatches EGX vs Yahoo Finance
YF_ALIAS = {
    'MNHD': 'MASR',
    # Add more as discovered
}

def get_yf_ticker(symbol: str) -> str:
    sym = YF_ALIAS.get(symbol.upper(), symbol.upper())
    return f'{sym}.CA'

def get_last_date_in_db(company_id: str, source: str, cfg: dict) -> str | None:
    try:
        res = sb.table(cfg['table'])\
                 .select(cfg['date_col'])\
                 .eq('company_id', company_id)\
                 .eq('source', source)\
                 .order(cfg['date_col'], desc=True)\
                 .limit(1).execute()
        if res.data:
            return res.data[0][cfg['date_col']]
    except Exception as e:
        logger.warning(f'DB check error for {company_id} ({source}): {e}')
    return None

def fetch_and_store(symbol: str, company_id: str, interval: str, period: str = None, fill_gaps: bool = False) -> tuple[str, int]:
    """
    Fetch OHLCV from Yahoo Finance and upsert into Supabase.
    Returns: (status, candles_written)
    """
    cfg = INTERVAL_CONFIG.get(interval)
    if not cfg:
        return 'skipped', 0

    ticker_sym = get_yf_ticker(symbol)
    use_period = period or cfg['period']
    source     = cfg['source']
    table      = cfg['table']
    date_col   = cfg['date_col']

    # Check if up-to-date (skip if incremental and fresh)
    if not fill_gaps:
        last = get_last_date_in_db(company_id, source, cfg)
        if last:
            last_dt = datetime.fromisoformat(str(last)[:10]).date()
            days_missing = (date.today() - last_dt).days
            if days_missing <= 1 and interval == '1d':
                logger.debug(f'[{symbol}] {source}: up-to-date, skip')
                return 'skipped', 0
            # For intraday, skip if last candle is < 30 min ago
            if interval in ('5m', '15m', '30m', '1h') and days_missing < 1:
                try:
                    last_ts = datetime.fromisoformat(str(last).replace('Z', '+00:00'))
                    if (datetime.now(timezone.utc) - last_ts).seconds < 1800:
                        logger.debug(f'[{symbol}] {source}: fresh, skip')
                        return 'skipped', 0
                except:
                    pass

    try:
        ticker = yf.Ticker(ticker_sym)
        df = ticker.history(period=use_period, interval=interval, auto_adjust=True)

        if df is None or df.empty:
            logger.warning(f'[{symbol}] {source}: no data from Yahoo (ticker: {ticker_sym})')
            return 'no_data', 0

        df = df.reset_index()
        # Normalize datetime column name (Datetime or Date)
        dt_col = 'Datetime' if 'Datetime' in df.columns else 'Date'
        df = df.rename(columns={
            dt_col: 'ts',
            'Open': 'open', 'High': 'high', 'Low': 'low',
            'Close': 'close', 'Volume': 'volume'
        })

        rows = []
        for _, row in df.iterrows():
            try:
                ts = row['ts']
                if hasattr(ts, 'to_pydatetime'):
                    ts = ts.to_pydatetime()
                ts_iso = ts.isoformat() if hasattr(ts, 'isoformat') else str(ts)[:10]

                if table == 'intraday_snapshots':
                    rows.append({
                        'company_id':   company_id,
                        'source':       source,
                        'snapshot_time': ts_iso,
                        'price':        float(row['close']),
                        'open_price':   float(row['open']),
                        'high_price':   float(row['high']),
                        'low_price':    float(row['low']),
                        'volume':       int(row['volume']) if pd.notna(row['volume']) else 0,
                    })
                else:  # market_prices (1d)
                    rows.append({
                        'company_id':   company_id,
                        'source':       source,
                        'price_date':   ts_iso[:10],
                        'close_price':  float(row['close']),
                        'open_price':   float(row['open']),
                        'high_price':   float(row['high']),
                        'low_price':    float(row['low']),
                        'volume':       int(row['volume']) if pd.notna(row['volume']) else 0,
                    })
            except Exception as ex:
                logger.warning(f'[{symbol}] Row parse error: {ex}')
                continue

        if not rows:
            return 'no_data', 0

        # Upsert in batches of 200
        conflict_col = 'company_id,snapshot_time,source' if table == 'intraday_snapshots' else 'company_id,price_date,source'
        for i in range(0, len(rows), 200):
            try:
                sb.table(table).upsert(rows[i:i+200], on_conflict=conflict_col).execute()
            except Exception as ex:
                logger.error(f'[{symbol}] Upsert error batch {i}: {ex}')

        logger.info(f'  ✅ {symbol} ({interval}): {len(rows)} candles via Yahoo Finance')
        return 'processed', len(rows)

    except Exception as e:
        logger.error(f'  ❌ {symbol} ({interval}): {e}')
        return 'failed', 0


def main():
    parser = argparse.ArgumentParser(description='Yahoo Finance Backfill for EGX')
    parser.add_argument('--symbol',     type=str, default=None,  help='Single symbol to backfill (e.g. COMI)')
    parser.add_argument('--intervals',  type=str, default='1d',  help='Comma-separated: 5m,15m,30m,1h,1d')
    parser.add_argument('--fill-gaps',  action='store_true',     help='Force re-fetch to fill missing candles')
    parser.add_argument('--live',       action='store_true',     help='Live session mode: fetch 15m+1h every run')
    args = parser.parse_args()

    # Live mode overrides intervals to intraday
    if args.live:
        intervals = ['5m', '15m', '1h']
        logger.info('📡 LIVE SESSION MODE – fetching intraday candles')
    else:
        intervals = [x.strip() for x in args.intervals.split(',') if x.strip() in INTERVAL_CONFIG]

    if not intervals:
        logger.error(f'No valid intervals. Choose from: {list(INTERVAL_CONFIG.keys())}')
        sys.exit(1)

    # Get companies
    companies_res = sb.table('companies').select('id,symbol').eq('status', 'active').execute()
    companies = companies_res.data or []

    if args.symbol:
        sym = args.symbol.upper()
        companies = [c for c in companies if c['symbol'].upper().split('.')[0] == sym]
        if not companies:
            logger.error(f'Symbol {sym} not found in DB')
            sys.exit(1)

    logger.info(f'🚀 Yahoo Finance Backfill: {len(companies)} companies × {intervals}')

    total_written = 0
    processed = skipped = failed = 0

    for i, comp in enumerate(companies):
        sym = comp['symbol'].split('.')[0].upper()
        cid = comp['id']
        logger.info(f'[{i+1}/{len(companies)}] {sym}')

        sym_written = 0
        for ivl in intervals:
            status, count = fetch_and_store(sym, cid, ivl, fill_gaps=args.fill_gaps)
            total_written += count
            sym_written   += count
            if status == 'processed': processed += 1
            elif status == 'skipped': skipped   += 1
            else:                     failed    += 1
            time.sleep(0.2)  # polite rate limiting

    logger.info('═' * 50)
    logger.info(f'Yahoo Finance Backfill Complete:')
    logger.info(f'  Processed: {processed}')
    logger.info(f'  Skipped:   {skipped}')
    logger.info(f'  Failed:    {failed}')
    logger.info(f'  Candles:   {total_written}')
    logger.info('═' * 50)

if __name__ == '__main__':
    main()
