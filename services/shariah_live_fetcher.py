#!/usr/bin/env python3
"""
EGX 33 Shariah Live Price Fetcher
Runs every 60 seconds during EGX market hours.
Writes live price and official daily change to local JSON cache & Supabase.
Uses tvDatafeed (already installed in project).
"""

import time
import logging
import json
from datetime import datetime
import pytz
import os
from tvDatafeed import TvDatafeed, Interval

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CAIRO_TZ = pytz.timezone('Africa/Cairo')

def is_market_open() -> bool:
    now = datetime.now(CAIRO_TZ)
    # EGX: Sunday=6, Monday=0, Tuesday=1, Wednesday=2, Thursday=3
    trading_days = [0, 1, 2, 3, 6]
    if now.weekday() not in trading_days:
        return False
    market_open  = now.replace(hour=10, minute=0, second=0, microsecond=0)
    market_close = now.replace(hour=14, minute=30, second=0, microsecond=0)
    return market_open <= now <= market_close

def fetch_shariah_price() -> dict | None:
    """
    Fetch EGX Shariah latest price & daily change using tvDatafeed.
    Compares live tick price vs previous day close for accurate daily change %.
    """
    try:
        tv = TvDatafeed()
        
        # 1. Get daily bars to obtain yesterday's official close
        daily_data = tv.get_hist(
            symbol='SHARIAH',
            exchange='EGX',
            interval=Interval.in_daily,
            n_bars=3
        )

        # 2. Get 1-minute intraday bars for live price tick
        intraday_data = tv.get_hist(
            symbol='SHARIAH',
            exchange='EGX',
            interval=Interval.in_1_minute,
            n_bars=5
        )

        if intraday_data is None or len(intraday_data) < 1:
            intraday_data = daily_data

        if intraday_data is None or len(intraday_data) < 1:
            logger.error('No data returned from tvDatafeed')
            return None

        current_price = float(intraday_data.iloc[-1]['close'])

        # Determine reference previous close (yesterday's close)
        prev_close = current_price
        if daily_data is not None and len(daily_data) >= 2:
            # If the last bar in daily_data is today, use iloc[-2] as yesterday's close
            # If the last bar in daily_data is yesterday, use iloc[-1]
            last_daily_date = daily_data.index[-1].date() if hasattr(daily_data.index[-1], 'date') else daily_data.index[-1]
            today_date = datetime.now(CAIRO_TZ).date()
            if last_daily_date == today_date and len(daily_data) >= 2:
                prev_close = float(daily_data.iloc[-2]['close'])
            else:
                prev_close = float(daily_data.iloc[-1]['close'])

        change_abs = round(current_price - prev_close, 2)
        change_pct = round((change_abs / prev_close) * 100, 2) if prev_close != 0 else 0.0

        logger.info(f'SHARIAH: {current_price} (Prev: {prev_close}, Chg: {change_abs}, {change_pct:+.2f}%)')

        return {
            'close_price': current_price,
            'change_abs':  change_abs,
            'change_pct':  change_pct,
            'fetched_at':  datetime.now(CAIRO_TZ).isoformat()
        }

    except Exception as e:
        logger.error(f'tvDatafeed error: {e}')
        return None

def write_to_cache(price_data: dict) -> bool:
    """
    Write Shariah price to local JSON cache and Supabase if available.
    """
    # 1. Local JSON cache
    try:
        cache_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
        os.makedirs(cache_dir, exist_ok=True)
        cache_file = os.path.join(cache_dir, 'shariah_live_cache.json')
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump({
                'symbol': 'SHARIAH',
                'exchange': 'EGX',
                'close_price': price_data['close_price'],
                'change_abs': price_data['change_abs'],
                'change_pct': price_data['change_pct'],
                'source': 'tvdatafeed',
                'updated_at': price_data['fetched_at']
            }, f, indent=2)
        logger.info('Written to local JSON cache successfully')
    except Exception as e:
        logger.error(f'Local cache write error: {e}')

    # 2. Supabase table write
    try:
        from dotenv import load_dotenv
        load_dotenv()
        from supabase import create_client
        url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
        key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
        if url and key:
            sb = create_client(url, key)
            sb.table('index_live_cache').upsert({
                'symbol':      'SHARIAH',
                'exchange':    'EGX',
                'close_price': price_data['close_price'],
                'change_abs':  price_data['change_abs'],
                'change_pct':  price_data['change_pct'],
                'source':      'tvdatafeed',
                'updated_at':  price_data['fetched_at']
            }, on_conflict='symbol,exchange').execute()
            logger.info('Written to Supabase successfully')
    except Exception as e:
        logger.warning(f'Supabase write note: {e}')

    return True

def run_once():
    """Execute single fetch and update cache."""
    price_data = fetch_shariah_price()
    if price_data:
        write_to_cache(price_data)

def run():
    """Main loop — runs every 60 seconds during market hours."""
    logger.info('EGX Shariah Live Fetcher started')

    # Initial run
    run_once()

    while True:
        try:
            if is_market_open():
                logger.info('Market open — fetching...')
                run_once()
            else:
                logger.info('Market closed — skipping')

        except Exception as e:
            logger.error(f'Loop error: {e}')

        time.sleep(3)

if __name__ == '__main__':
    run()


