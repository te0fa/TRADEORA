import os
import sys
import time
import requests
import pytz
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client

# Ensure current directory is in search path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from scrapers.utils import get_yahoo_ticker

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL or SUPABASE_KEY is missing from environment variables.")
    sys.exit(1)

# Initialize Supabase client
sb = create_client(SUPABASE_URL, SUPABASE_KEY)

# Error log helper
os.makedirs("logs", exist_ok=True)
def log_error(msg):
    with open("logs/backfill_errors.txt", "a", encoding="utf-8") as f:
        f.write(f"[{datetime.now().isoformat()}] {msg}\n")

# Safe requests helper with retry on 429
def fetch_yahoo_data(ticker):
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range=2y"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    }
    
    while True:
        try:
            res = requests.get(url, headers=headers, timeout=15)
            if res.status_code == 429:
                print("Received 429 Too Many Requests. Sleeping for 30 seconds...")
                time.sleep(30)
                continue
            return res
        except requests.exceptions.RequestException as e:
            raise e

def main():
    print("Starting backfill for all companies...")
    
    # 0. Register market source 'yahoo_historical' to satisfy foreign key constraints
    try:
        source_record = {
            "id": "yahoo_historical",
            "name": "Yahoo Finance Historical",
            "priority": 5,
            "enabled": True
        }
        sb.table("market_sources").upsert(source_record, on_conflict="id").execute()
        print("Market source 'yahoo_historical' registered successfully.")
    except Exception as e:
        print(f"Warning registering market source: {e}")
        
    # 1. Fetch companies
    try:
        res = sb.table("companies").select("id", "symbol", "name_en").execute()
        companies = res.data if res.data else []
        if not companies:
            print("No companies found in database.")
            return
        print(f"Loaded {len(companies)} companies from Supabase.")
    except Exception as e:
        print(f"Error fetching companies: {e}")
        return

    cairo_tz = pytz.timezone('Africa/Cairo')
    records_to_upsert = []
    consecutive_errors = 0
    total_upserted_count = 0

    # 2. Iterate companies
    for index, company in enumerate(companies):
        symbol = company.get("symbol")
        company_id = company.get("id")
        
        primary_ticker = get_yahoo_ticker(symbol)
        
        # We will try tickers in order of preference to find one with sufficient history (> 100 candles)
        candidate_tickers = [primary_ticker]
        
        std_ca_ticker = f"{symbol.upper()}.CA"
        if std_ca_ticker not in candidate_tickers:
            candidate_tickers.append(std_ca_ticker)
            
        std_raw_ticker = symbol.upper()
        if std_raw_ticker not in candidate_tickers:
            candidate_tickers.append(std_raw_ticker)
            
        res = None
        has_sufficient_data = False
        selected_ticker = None
        parsed_result = None

        # Apply rate limiting sleep based on progress
        if index > 0:
            time.sleep(0.5)

        if consecutive_errors >= 3:
            print("Multiple consecutive errors. Sleeping for 5 seconds...")
            time.sleep(5)

        for ticker in candidate_tickers:
            try:
                res = fetch_yahoo_data(ticker)
                if res.status_code == 200:
                    data = res.json()
                    result = data.get("chart", {}).get("result")
                    if result and result[0].get("timestamp"):
                        timestamps = result[0]["timestamp"]
                        if len(timestamps) >= 100:
                            has_sufficient_data = True
                            selected_ticker = ticker
                            parsed_result = result[0]
                            break
                        else:
                            # Keep it in case no other candidate has better data
                            if parsed_result is None or len(timestamps) > len(parsed_result.get("timestamp", [])):
                                selected_ticker = ticker
                                parsed_result = result[0]
            except Exception as e:
                print(f"Error fetching ticker {ticker} for {symbol}: {e}")
                log_error(f"Error fetching ticker {ticker} for {symbol}: {e}")

        # Check if we got any data at all
        if parsed_result is None or not parsed_result.get("timestamp"):
            print(f"[{index+1}/{len(companies)}] {symbol} -> No data found on Yahoo. Skipping.")
            log_error(f"No data found for {symbol} after trying all candidates {candidate_tickers}")
            continue

        consecutive_errors = 0
        timestamps = parsed_result.get("timestamp", [])
        print(f"[{index+1}/{len(companies)}] {symbol} -> Selected ticker {selected_ticker} with {len(timestamps)} records.")

        # 3. Parse and process historical data
        try:
            quotes = parsed_result.get("indicators", {}).get("quote", [{}])[0]
            opens = quotes.get("open", [])
            highs = quotes.get("high", [])
            lows = quotes.get("low", [])
            closes = quotes.get("close", [])
            volumes = quotes.get("volume", [])

            company_records = []
            last_valid_close = None

            for i in range(len(timestamps)):
                op = opens[i] if i < len(opens) else None
                hi = highs[i] if i < len(highs) else None
                lo = lows[i] if i < len(lows) else None
                cl = closes[i] if i < len(closes) else None
                vol = volumes[i] if i < len(volumes) and volumes[i] is not None else 0

                if op is None or hi is None or lo is None or cl is None:
                    continue

                op = float(op)
                hi = float(hi)
                lo = float(lo)
                cl = float(cl)
                vol = int(vol)

                dt = datetime.fromtimestamp(timestamps[i], tz=pytz.utc).astimezone(cairo_tz)
                date_str = dt.strftime("%Y-%m-%d")

                change_value = None
                change_percent = None

                if last_valid_close is not None:
                    change_value = cl - last_valid_close
                    if last_valid_close != 0:
                        change_percent = (change_value / last_valid_close) * 100

                record = {
                    "company_id": company_id,
                    "price_date": date_str,
                    "source": "yahoo_historical",
                    "open_price": op,
                    "high_price": hi,
                    "low_price": lo,
                    "close_price": cl,
                    "volume": vol,
                    "change_value": change_value,
                    "change_percent": change_percent,
                    "previous_close": last_valid_close,
                    "data_quality_flag": "good",
                    "fetched_at": datetime.now(pytz.utc).isoformat()
                }

                company_records.append(record)
                last_valid_close = cl

            # Add to batch and database upsert
            for record in company_records:
                records_to_upsert.append(record)
                if len(records_to_upsert) >= 50:
                    sb.table("market_prices").upsert(records_to_upsert, on_conflict="company_id,price_date,source").execute()
                    total_upserted_count += len(records_to_upsert)
                    records_to_upsert = []

        except Exception as e:
            print(f"[{index+1}/{len(companies)}] {symbol} -> Error parsing/upserting data: {e}")
            log_error(f"Error parsing data for {symbol}: {e}")
            consecutive_errors += 1

    # Upsert remaining records in buffer
    if records_to_upsert:
        try:
            sb.table("market_prices").upsert(records_to_upsert, on_conflict="company_id,price_date,source").execute()
            total_upserted_count += len(records_to_upsert)
            records_to_upsert = []
        except Exception as e:
            print(f"Error upserting final batch: {e}")

    print(f"Done! Total: {total_upserted_count} records upserted/updated.")

if __name__ == "__main__":
    main()
