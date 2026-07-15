import sys
import os
import time
import datetime
import logging
import yfinance as yf
from bs4 import BeautifulSoup

# Ensure project root is on path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config import settings
from database import db

# Set up simple console logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def backfill_symbol(symbol: str, company_id: str, limit_days: int = 300) -> list[dict]:
    """
    Downloads historical prices for a symbol from Yahoo Finance and formats them.
    Returns a list of price records to insert.
    """
    yahoo_ticker = f"{symbol.upper()}.CA"
    records = []
    
    try:
        t = yf.Ticker(yahoo_ticker)
        # Fetch historical data (auto_adjust=False retrieves raw close prices)
        df = t.history(period="2y", auto_adjust=False)
        
        if df is None or df.empty:
            logger.warning(f"No history found on Yahoo Finance for {yahoo_ticker}")
            return []
            
        # Get the last limit_days of records
        df = df.tail(limit_days)
        
        for dt, row in df.iterrows():
            close_price = row.get("Close")
            open_price = row.get("Open")
            high_price = row.get("High")
            low_price = row.get("Low")
            volume = row.get("Volume")
            
            if close_price is None or open_price is None or high_price is None or low_price is None:
                continue
                
            # Date string
            date_str = dt.strftime("%Y-%m-%d")
            
            records.append({
                "company_id": company_id,
                "open": float(open_price),
                "high": float(high_price),
                "low": float(low_price),
                "close": float(close_price),
                "volume": int(volume or 0),
                "source": "yahoo_finance_historical",
                "price_date": date_str
            })
            
        return records
    except Exception as e:
        logger.error(f"Error fetching history from Yahoo Finance for {yahoo_ticker}: {e}")
        raise e

def run_backfill(dry_run: bool = False, limit_days: int = 300, single_symbol: str = None):
    print("============================================================")
    print("               HISTORICAL PRICES BACKFILL SCRIPT            ")
    print("============================================================")
    
    # 1. Fetch Active Universe
    if single_symbol:
        logger.info(f"Filtering active universe for single symbol: {single_symbol}")
        # Fetch company by symbol
        company = db.get_company_by_symbol(single_symbol)
        active_companies = [company] if company else []
    else:
        logger.info("Fetching active universe (is_shariah_compliant = True) from database...")
        active_companies = db.get_active_universe()
        
    total_companies = len(active_companies)
    logger.info(f"Loaded {total_companies} companies to backfill.")
    
    if total_companies == 0:
        logger.warning("No companies found to backfill. Exiting.")
        return
        
    client = db.get_db_client()
    if not client and not dry_run:
        logger.error("Database connection is not available. Switch to dry-run or check settings.")
        return
        
    success_count = 0
    failures = [] # list of (symbol, error_msg)
    total_records_inserted = 0
    
    # Create market_source for history if not exists
    if not dry_run:
        try:
            db.upsert_market_sources([{
                "id": "yahoo_finance_historical",
                "name": "Yahoo Finance Historical Prices",
                "priority": 10,
                "enabled": True
            }])
        except Exception as e:
            logger.warning(f"Could not register market source: {e}")
            
    for idx, comp in enumerate(active_companies):
        sym = comp["symbol"].upper()
        comp_id = comp["id"]
        logger.info(f"[{idx+1}/{total_companies}] Processing {sym} (ID: {comp_id})...")
        
        try:
            records = backfill_symbol(sym, comp_id, limit_days=limit_days)
            
            if records:
                if dry_run:
                    logger.info(f"  [DRY RUN] Would insert {len(records)} records for {sym}.")
                    total_records_inserted += len(records)
                else:
                    # Supabase bulk insert using upsert
                    # Split into batches of 200 to be safe
                    batch_size = 200
                    inserted_for_symbol = 0
                    for i in range(0, len(records), batch_size):
                        batch = records[i:i+batch_size]
                        res = client.table("historical_prices").upsert(batch, on_conflict="company_id,price_date,source").execute()
                        inserted_for_symbol += len(res.data) if res.data else len(batch)
                    
                    logger.info(f"  Successfully inserted/updated {inserted_for_symbol} price records for {sym}.")
                    total_records_inserted += inserted_for_symbol
                    
                success_count += 1
            else:
                failures.append((sym, "No history returned or parsing failed."))
                
            # Polite delay of 0.2s between tickers to avoid rate limiting
            time.sleep(0.2)
            
        except Exception as e:
            failures.append((sym, str(e)))
            logger.error(f"  Failed backfilling {sym}: {e}")
            
    print("\n============================================================")
    print("                BACKFILL SUMMARY REPORT                     ")
    print("============================================================")
    print(f"Total Companies processed  : {total_companies}")
    print(f"Successfully Backfilled    : {success_count}")
    print(f"Failed Companies           : {len(failures)}")
    print(f"Total Price records loaded : {total_records_inserted}")
    
    if failures:
        print("\n--- FAILED SYMBOLS ---")
        for sym, err in failures:
            print(f"  - {sym}: {err}")
    else:
        print("\nAll processed symbols completed with no failures!")
        
    print("============================================================")
    
    # Return details for verification/audit
    return success_count, failures, total_records_inserted

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Historical backfill utility using yfinance.")
    parser.add_argument("--dry-run", action="store_true", help="Perform a dry run without database writes.")
    parser.add_argument("--limit-days", type=int, default=300, help="Number of historical days to backfill per symbol (default: 300).")
    parser.add_argument("--symbol", default=None, help="Backfill a single specific symbol (for test/debug).")
    args = parser.parse_args()
    
    run_backfill(dry_run=args.dry_run, limit_days=args.limit_days, single_symbol=args.symbol)
