import asyncio
import sys
import os
import logging
import traceback
from datetime import datetime
import argparse
import pytz

# Ensure project root is on path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config import settings
from database import db
from scrapers.tradingview_provider import TradingViewProvider
from scrapers.yahoo_intraday_provider import YahooIntradayProvider
from scrapers.utils import is_market_open, MarketClosedException

logger = logging.getLogger(__name__)

# Fallback/Static list of 34 major EGX symbols
STATIC_FALLBACK_SYMBOLS = [
    "COMI", "FWRY", "SWDY", "EAST", "ABUK", "AMOC", "TMGH", "ETEL", "CCAP", 
    "HELI", "OCDI", "HRHO", "TALM", "JUFO", "ORAS", "EGAL", "CICH", "MFPC", 
    "CIEB", "BTFH", "CLHO", "RMDA", "ADIB", "ASCM", "MICH", "PHDC", "EGCH",
    "ELKA", "RAYA", "DSCW", "ALCN", "AJWA", "APPC", "ATQA"
]

def setup_logging():
    """Sets up logging to write to console and logs/intraday_importer.log."""
    log_dir = os.path.join(settings.BASE_DIR, "logs")
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "intraday_importer.log")
    
    numeric_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    logging.basicConfig(
        level=numeric_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[
            logging.FileHandler(log_file, encoding="utf-8"),
            logging.StreamHandler(sys.stdout)
        ]
    )

def calculate_consensus(tv_data: dict | None, yahoo_data: dict | None):
    tv_price = tv_data.get("price") if tv_data and tv_data.get("price") and tv_data.get("price") > 0 else None
    yahoo_price = yahoo_data.get("price") if yahoo_data and yahoo_data.get("price") and yahoo_data.get("price") > 0 else None

    if tv_price is not None:
        return (
            tv_data.get("open") or tv_price,
            tv_data.get("high") or tv_price,
            tv_data.get("low") or tv_price,
            tv_price,
            tv_data.get("change") or 0.0,
            tv_data.get("change_percent") or 0.0,
            tv_data.get("volume") or 0,
            "tradingview",
            None
        )
    elif yahoo_price is not None:
        return (
            yahoo_data.get("open") or yahoo_price,
            yahoo_data.get("high") or yahoo_price,
            yahoo_data.get("low") or yahoo_price,
            yahoo_price,
            yahoo_data.get("change") or 0.0,
            yahoo_data.get("change_percent") or 0.0,
            yahoo_data.get("volume") or 0,
            "yahoo_live",
            "yahoo_fallback"
        )
    else:
        return None, None, None, None, None, None, None, None, None

async def run_pipeline(dry_run: bool = False, bypass_session_guard: bool = False, run_type: str = "dynamic"):
    start_time = datetime.now()
    setup_logging()
    
    logger.info("=" * 60)
    logger.info("Tradeora Intraday Ingestion Pipeline Started")
    logger.info(f"Parameters: dry_run={dry_run}, bypass_session_guard={bypass_session_guard}, run_type={run_type}")
    
    # 1. Market Session Guard
    if not bypass_session_guard and not is_market_open():
        logger.info("Market is closed. Intraday importer exited.")
        print("Market Closed")
        return
        
    db.set_dry_run(dry_run)
    
    # 2. Register/Upsert Intraday Sources
    # Mubasher excluded: provides close-only price, no OHLCV. Using TV + Yahoo consensus instead.
    # Investing.com excluded: frequent Cloudflare blocks make it unreliable for production use.
    sources = [
        {"id": "tradingview", "name": "TradingView Scanner", "priority": 1, "enabled": True},
        {"id": "yahoo_live", "name": "Yahoo Finance Live", "priority": 2, "enabled": True}
    ]
    db.upsert_market_sources(sources)
    
    # 3. Create Import Job
    job_id = db.create_import_job("tradingview")
    
    warnings_list = []
    errors_list = []
    partial_coverage = False
    
    try:
        # 4. Retrieve Active Companies from DB
        logger.info("Fetching companies from database...")
        db_companies = db.get_all_companies()
        
        companies_map = {}
        symbols = []
        
        if not db_companies:
            msg = "[WARN] Database companies list is empty! Falling back to static list of 34 major symbols."
            logger.warning(msg)
            warnings_list.append(msg)
            partial_coverage = True
            symbols = STATIC_FALLBACK_SYMBOLS
        else:
            symbols = [c["symbol"].upper() for c in db_companies]
            companies_map = {c["symbol"].upper(): c for c in db_companies}
            logger.info(f"Loaded {len(symbols)} companies from database.")
            
        cairo_tz = pytz.timezone('Africa/Cairo')
        now_cairo = datetime.now(cairo_tz)
        
        logger.info("# Mubasher excluded: provides close-only price, no OHLCV. Using TV + Yahoo consensus instead.")
        logger.info("# Investing.com excluded: frequent Cloudflare blocks make it unreliable for production use.")

        # 5. Fetch Prices from TradingView and Yahoo Finance
        tv_provider = TradingViewProvider()
        logger.info("Fetching prices from TradingView...")
        tv_results = tv_provider.fetch_prices(symbols, bypass_session_guard=True)
        tv_map = {r["symbol"]: r for r in tv_results}
        
        logger.info("Fetching prices from Yahoo Finance...")
        yahoo_provider = YahooIntradayProvider()
        yahoo_map = {}
        try:
            yahoo_results = await asyncio.get_event_loop().run_in_executor(
                None,
                yahoo_provider.fetch_prices,
                symbols,
                bypass_session_guard
            )
            yahoo_map = {r["symbol"]: r for r in yahoo_results}
        except Exception as e:
            logger.warning(f"Yahoo provider failed: {e}")
        
        # 6. Apply Primary (TradingView) + Fallback (Yahoo) Consensus Logic
        logger.info("Applying TV + Yahoo Consensus Logic...")
        consensus_records = []
        price_date = now_cairo.date().isoformat()
        fetched_at = now_cairo.isoformat()
        
        for sym in symbols:
            tv_data = tv_map.get(sym)
            yahoo_data = yahoo_map.get(sym)
            
            open_final, high_final, low_final, p_final, chg_final, chg_pct_final, vol_final, resolved_source, q_flag = calculate_consensus(
                tv_data, yahoo_data
            )
            
            if p_final is None or resolved_source is None:
                logger.info(f"[SKIP] {sym}: No price from TV or Yahoo — skipping")
                continue
                
            # Resolve company ID
            company_id = None
            if sym in companies_map:
                company_id = companies_map[sym]["id"]
            else:
                # In fallback/dry-run mode, we mock the ID if missing
                company_id = f"mock_id_{sym}"
                
            consensus_records.append({
                "company_id": company_id,
                "open_price": open_final,
                "high_price": high_final,
                "low_price": low_final,
                "close_price": p_final,
                "change_value": chg_final,
                "change_percent": chg_pct_final,
                "volume": vol_final,
                "source": resolved_source,
                "price_date": price_date,
                "fetched_at": fetched_at,
                "data_quality_flag": q_flag
            })

        # 7. Database storage
        inserted_count = 0
        if consensus_records:
            logger.info(f"Upserting {len(consensus_records)} market prices to database...")
            records_to_save = [r for r in consensus_records if not str(r["company_id"]).startswith("mock_id_")]
            
            if records_to_save:
                inserted_count, _ = db.upsert_market_prices(records_to_save)
                logger.info(f"Successfully upserted {inserted_count} prices to database.")
            else:
                inserted_count = len(consensus_records)
                logger.info(f"[Dry-run/Mock] Simulated upsert of {inserted_count} prices.")
        else:
            logger.warning("No records resolved to insert.")
            
        # 8. Update Job Status
        status = "completed"
        error_msg = None
        if partial_coverage:
            status = "warnings"
            error_msg = "Partial Coverage: Fallback to 34 symbols used instead of full database list."
            
        if errors_list:
            status = "failed"
            error_msg = "; ".join(errors_list[:3])
            
        job_updates = {
            "status": status,
            "finished_at": datetime.now(pytz.utc).isoformat(),
            "rows_read": len(symbols),
            "rows_inserted": inserted_count,
            "warnings_count": len(warnings_list),
            "errors_count": len(errors_list),
            "error_message": error_msg
        }
        db.update_import_job(job_id, job_updates)
        
        logger.info(f"Pipeline completed with status: {status}")
        
    except Exception as e:
        err_msg = f"Fatal pipeline error: {e}"
        logger.critical(err_msg)
        logger.critical(traceback.format_exc())
        
        job_updates = {
            "status": "failed",
            "finished_at": datetime.now(pytz.utc).isoformat(),
            "errors_count": 1,
            "error_message": err_msg
        }
        db.update_import_job(job_id, job_updates)
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Tradeora Intraday Price Ingestion Pipeline")
    parser.add_argument("--dry-run", action="store_true", help="Run in dry-run mode (no DB inserts)")
    parser.add_argument("--bypass-session-guard", action="store_true", help="Bypass market hours check")
    parser.add_argument("--run-type", default="dynamic", choices=["full", "light", "dynamic"], help="Type of run: full, light, or dynamic (default: dynamic)")
    args = parser.parse_args()
    
    asyncio.run(run_pipeline(dry_run=args.dry_run, bypass_session_guard=args.bypass_session_guard, run_type=args.run_type))
