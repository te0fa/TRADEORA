import os
import argparse
import pytz
from datetime import datetime, time
from dotenv import load_dotenv
from supabase import create_client, Client
from scrapers.tradingview_scraper import TradingViewScraper
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(message)s', datefmt='%H:%M:%S')
logger = logging.getLogger(__name__)

def is_market_open():
    """Check if the Egyptian Exchange is open."""
    cairo_tz = pytz.timezone('Africa/Cairo')
    now = datetime.now(cairo_tz)
    
    # Sunday to Thursday (0=Monday, 6=Sunday in Python. Better: isoweekday() 1=Mon, 7=Sun)
    # EGX is open Sun(7) to Thu(4). Closed Fri(5), Sat(6)
    if now.isoweekday() in [5, 6]:
        return False
        
    market_start = time(9, 55)
    market_end = time(14, 35)
    
    if market_start <= now.time() <= market_end:
        return True
    return False

def main():
    parser = argparse.ArgumentParser(description="Collect Intraday Snapshots")
    parser.add_argument("--force", action="store_true", help="Force collection even if market is closed")
    args = parser.parse_args()

    if not args.force and not is_market_open():
        logger.info("Market is currently closed. Exiting.")
        return

    # Load env
    load_dotenv()
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY") # Ensure this is service_role key
    
    if not supabase_url or not supabase_key:
        logger.error("Supabase credentials not found in environment.")
        return

    sb: Client = create_client(supabase_url, supabase_key)
    
    logger.info("Fetching TradingView data...")
    try:
        scraper = TradingViewScraper()
        records = scraper.fetch_data()
    except Exception as e:
        logger.error(f"Failed to fetch data from TradingView: {e}")
        return

    if not records:
        logger.warning("No records returned from scraper.")
        return

    logger.info(f"Fetched {len(records)} records from TradingView. Preparing DB payload...")
    
    # Get mapping of symbol to company_id
    try:
        comp_res = sb.table("companies").select("id, symbol").execute()
        # Symbol in DB might be 'COMI.CA', TradingView ticker is 'COMI'
        comp_map = {row["symbol"].split(".")[0]: row["id"] for row in comp_res.data}
    except Exception as e:
        logger.error(f"Failed to fetch companies from Supabase: {e}")
        return

    cairo_tz = pytz.timezone('Africa/Cairo')
    snapshot_time = datetime.now(cairo_tz).isoformat()
    
    payloads = []
    for r in records:
        symbol = r.get("symbol")
        company_id = comp_map.get(symbol)
        if not company_id:
            continue
            
        payloads.append({
            "company_id": company_id,
            "snapshot_time": snapshot_time,
            "price": r.get("close_price"),
            "open_price": r.get("open_price"),
            "high_price": r.get("high_price"),
            "low_price": r.get("low_price"),
            "volume": r.get("volume"),
            "source": "TradingView"
        })

    if not payloads:
        logger.warning("No valid payloads mapped to companies.")
        return

    # Upsert to DB
    logger.info(f"Upserting {len(payloads)} snapshots to DB...")
    try:
        sb.table("intraday_snapshots").upsert(
            payloads, 
            on_conflict="company_id, snapshot_time, source"
        ).execute()
        logger.info(f"Collected {len(payloads)} snapshots from TradingView successfully.")
    except Exception as e:
        logger.error(f"Failed to upsert snapshots: {e}")

if __name__ == "__main__":
    main()
