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
from scrapers.mubasher_provider import MubasherProvider
from scrapers.investing_provider import InvestingProvider
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

def calculate_consensus(prices: dict, changes: dict, change_pcts: dict, volumes: dict, run_type: str = "dynamic") -> tuple[float, float, float, int, str | None]:
    """
    Outlier-Filtering Consensus Cross-validation Algorithm.
    Resolves the final price, change, change_percent, and volume based on:
    - Excludes N/A or <= 0 values.
    - If 1 source: use it.
    - If 2 sources: average if difference <= 1.5%, else use higher priority (TV > Mubasher > Investing > Yahoo).
    - If 3-4 sources: check outliers against median (> 1.5% diff). Discard outliers, average remaining.
    """
    import statistics
    valid_p = {k: v for k, v in prices.items() if v is not None and v > 0}
    if not valid_p:
        return None, None, None, None, None
        
    resolved_source = None
    resolved_price = None
    quality_flag = None
    
    if len(valid_p) == 1:
        resolved_source = list(valid_p.keys())[0]
        resolved_price = valid_p[resolved_source]
        quality_flag = "single_source_warning"
    elif len(valid_p) == 2:
        sources_list = sorted(list(valid_p.keys()))
        src0, src1 = sources_list[0], sources_list[1]
        p0, p1 = valid_p[src0], valid_p[src1]
        diff = abs(p0 - p1) / min(p0, p1) * 100
        
        if diff <= 1.5:
            resolved_price = (p0 + p1) / 2
            # Find priority source for extra fields (tv > mub > inv > yah)
            for src in ["tv", "mub", "inv", "yah"]:
                if src in valid_p:
                    resolved_source = src
                    break
            
            # Label based on which source is missing
            if "inv" not in valid_p:
                quality_flag = "2_source_consensus_investing_unavailable"
            elif "mub" not in valid_p:
                quality_flag = "2_source_consensus_mubasher_unavailable"
            else:
                quality_flag = "2_source_consensus_tradingview_unavailable"
        else:
            # Large difference: use higher priority source
            for src in ["tv", "mub", "inv", "yah"]:
                if src in valid_p:
                    resolved_source = src
                    resolved_price = valid_p[src]
                    break
            
            # Set quality flag for unresolved conflict without a 3rd source
            quality_flag = "conflict_over_1.5_no_source3"
            
    else: # len(valid_p) >= 3 (All 3-4 sources are valid!)
        # Calculate median
        vals = sorted(list(valid_p.values()))
        median = statistics.median(vals)
        
        # Check outliers relative to median (difference > 1.5%)
        non_outliers = {}
        for src, p in valid_p.items():
            diff = abs(p - median) / median * 100
            if diff <= 1.5:
                non_outliers[src] = p
                
        if len(non_outliers) >= 3:
            # Perfect consensus or discarded outliers, leaving 3-4 sources
            resolved_price = sum(non_outliers.values()) / len(non_outliers)
            # Find priority source among non-outliers
            for src in ["tv", "mub", "inv", "yah"]:
                if src in non_outliers:
                    resolved_source = src
                    break
            quality_flag = None if len(non_outliers) == len(valid_p) else "outlier_discarded"
        elif len(non_outliers) == 2:
            resolved_price = sum(non_outliers.values()) / len(non_outliers)
            # Find priority source among non-outliers
            for src in ["tv", "mub", "inv", "yah"]:
                if src in non_outliers:
                    resolved_source = src
                    break
            quality_flag = "outlier_discarded"
        else:
            # Fallback to median
            resolved_price = median
            # Find priority source among all valid
            for src in ["tv", "mub", "inv", "yah"]:
                if src in valid_p:
                    resolved_source = src
                    break
            quality_flag = "low_consensus_fallback_to_median"
            
    # Extract fields from the resolved source
    change = changes.get(resolved_source) or 0.0
    change_pct = change_pcts.get(resolved_source) or 0.0
    volume = volumes.get(resolved_source) or 0
    
    return resolved_price, change, change_pct, volume, quality_flag

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
    sources = [
        {"id": "tradingview", "name": "TradingView Scanner", "priority": 1, "enabled": True},
        {"id": "mubasher", "name": "Mubasher Portal", "priority": 2, "enabled": True},
        {"id": "investing", "name": "Investing.com", "priority": 3, "enabled": True},
        {"id": "yahoo", "name": "Yahoo Finance", "priority": 4, "enabled": True},
        {"id": "intraday_consensus", "name": "Intraday Consensus Price", "priority": 0, "enabled": True}
    ]
    db.upsert_market_sources(sources)
    
    # 3. Create Import Job
    job_id = db.create_import_job("intraday_consensus")
    
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
        
        # 1:00 PM Cairo (hour 13) safety-upgrade check
        if run_type == "dynamic" and now_cairo.hour == 13:
            logger.info("Cairo Time is 1:00 PM (13:00). Upgrading run_type to 'full' for the daily safety consensus audit.")
            run_type = "full"
            
        # 5. Fetch Prices from 3 Providers
        tv_provider = TradingViewProvider()
        mub_provider = MubasherProvider(max_concurrency=15)  # Concurrency optimized to 15 for fast threaded requests
        inv_provider = InvestingProvider(mapping_dir="data")
        
        logger.info("Fetching prices from TradingView...")
        tv_results = tv_provider.fetch_prices(symbols, bypass_session_guard=True)
        tv_map = {r["symbol"]: r for r in tv_results}
        
        logger.info("Fetching prices from Investing.com...")
        inv_results, _ = await inv_provider.fetch_prices(bypass_session_guard=True)
        inv_map = {r["symbol"]: r for r in inv_results}
        
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
        
        # Decide Mubasher fetching logic based on run_type
        mub_map = {}
        
        if run_type == "full":
            logger.info("Full Run: Fetching all prices from Mubasher...")
            mub_results = await mub_provider.fetch_prices(symbols, bypass_session_guard=True)
            mub_map = {r["symbol"]: r for r in mub_results}
        elif run_type == "light":
            logger.info("Light Run: Skipping Mubasher completely.")
            mub_map = {}
        elif run_type == "dynamic":
            if not inv_map:
                logger.warning("Investing.com is completely unavailable (likely due to Cloudflare block). Upgrading dynamic run to fetch all symbols from Mubasher to maintain a 2-source consensus baseline.")
                mub_results = await mub_provider.fetch_prices(symbols, bypass_session_guard=True)
                mub_map = {r["symbol"]: r for r in mub_results}
            else:
                conflicting_symbols = []
                for sym in symbols:
                    tv_p = tv_map.get(sym, {}).get("price")
                    inv_p = inv_map.get(sym, {}).get("price")
                    if tv_p is not None and inv_p is not None and tv_p > 0 and inv_p > 0:
                        diff = abs(tv_p - inv_p) / min(tv_p, inv_p) * 100
                        if diff > 1.5:
                            conflicting_symbols.append(sym)
                
                if conflicting_symbols:
                    logger.info(f"Dynamic Run: Found {len(conflicting_symbols)} conflicting symbols (>1.5% discrepancy). Fetching from Mubasher: {conflicting_symbols}")
                    mub_results = await mub_provider.fetch_prices(conflicting_symbols, bypass_session_guard=True)
                    mub_map = {r["symbol"]: r for r in mub_results}
                else:
                    logger.info("Dynamic Run: No price discrepancies found between TradingView and Investing. Skipping Mubasher.")
                    mub_map = {}
        
        # 6. Apply Cross-validation & Outlier Filtering Consensus
        logger.info("Applying Outlier-Filtering Consensus Cross-validation...")
        consensus_records = []
        price_date = now_cairo.date().isoformat()
        fetched_at = now_cairo.isoformat()
        
        for sym in symbols:
            # Get values
            prices = {
                "tv": tv_map.get(sym, {}).get("price"),
                "inv": inv_map.get(sym, {}).get("price"),
                "mub": mub_map.get(sym, {}).get("price"),
                "yah": yahoo_map.get(sym, {}).get("price")
            }
            changes = {
                "tv": tv_map.get(sym, {}).get("change"),
                "inv": inv_map.get(sym, {}).get("change"),
                "mub": mub_map.get(sym, {}).get("change"),
                "yah": yahoo_map.get(sym, {}).get("change")
            }
            change_pcts = {
                "tv": tv_map.get(sym, {}).get("change_percent"),
                "inv": inv_map.get(sym, {}).get("change_percent"),
                "mub": mub_map.get(sym, {}).get("change_percent"),
                "yah": yahoo_map.get(sym, {}).get("change_percent")
            }
            volumes = {
                "tv": tv_map.get(sym, {}).get("volume"),
                "inv": inv_map.get(sym, {}).get("volume"),
                "mub": mub_map.get(sym, {}).get("volume"),
                "yah": yahoo_map.get(sym, {}).get("volume")
            }
            
            p_final, chg_final, chg_pct_final, vol_final, q_flag = calculate_consensus(
                prices, changes, change_pcts, volumes, run_type=run_type
            )
            
            if p_final is None:
                # No price fetched from any source
                logger.warning(f"No price data available for {sym} from any of the sources. Skipping.")
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
                "close_price": p_final,
                "change_value": chg_final,
                "change_percent": chg_pct_final,
                "volume": vol_final,
                "source": "intraday_consensus",
                "price_date": price_date,
                "fetched_at": fetched_at,
                "data_quality_flag": q_flag
            })
        # Check conflict rate warning
        if consensus_records:
            conflict_count = sum(1 for r in consensus_records if r["data_quality_flag"] == "conflict_over_1.5_no_source3")
            conflict_pct = (conflict_count / len(consensus_records)) * 100
            if conflict_pct > 10.0:
                msg = f"[CRITICAL WARNING] Discrepancy rate is high: {conflict_pct:.2f}% (>10%) of symbols have price conflicts without a 3rd source!"
                logger.critical(msg)
                warnings_list.append(msg)

        # 7. Database storage
        inserted_count = 0
        if consensus_records:
            logger.info(f"Upserting {len(consensus_records)} consensus prices to database...")
            # If in mock fallback, we don't hit the DB to avoid constraints violation
            records_to_save = [r for r in consensus_records if not str(r["company_id"]).startswith("mock_id_")]
            
            if records_to_save:
                inserted_count, _ = db.upsert_market_prices(records_to_save)
                logger.info(f"Successfully upserted {inserted_count} prices to database.")
            else:
                inserted_count = len(consensus_records)
                logger.info(f"[Dry-run/Mock] Simulated upsert of {inserted_count} prices.")
        else:
            logger.warning("No consensus records resolved to insert.")
            
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
