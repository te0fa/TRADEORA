import os
import sys
import argparse
import logging
from datetime import datetime
from config import settings
from scrapers.egx_scraper import EGXScraper
from services.importer import DataImporter
import traceback

def setup_logging():
    """Sets up logging to write to console and logs/egx_scraper.log."""
    log_dir = os.path.join(settings.BASE_DIR, "logs")
    os.makedirs(log_dir, exist_ok=True)
    
    log_file = os.path.join(log_dir, "egx_scraper.log")
    
    # Get level from settings
    numeric_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    # Root logger configuration
    logging.basicConfig(
        level=numeric_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[
            logging.FileHandler(log_file, encoding="utf-8"),
            logging.StreamHandler(sys.stdout)
        ]
    )

def main():
    # EGX Holidays Check (Friday & Saturday)
    from datetime import datetime
    import pytz
    cairo = pytz.timezone('Africa/Cairo')
    now = datetime.now(cairo)
    weekday = now.weekday()  # 0=Mon, 4=Fri, 5=Sat, 6=Sun in Python
    
    if weekday in [4, 5]:
        print(f"[{now.strftime('%Y-%m-%d')}] عطلة — لا تداول في EGX اليوم")
        sys.exit(0)

    parser = argparse.ArgumentParser(description="Tradeora EGX Scraper and Importer Pipeline")
    parser.add_argument("--file", help="Path to a specific local HTML, Excel, or CSV file to parse directly.")
    parser.add_argument("--dry-run", action="store_true", help="Run the pipeline in dry-run mode (no database insertions).")
    parser.add_argument("--source", default="egx_bulletin", help="Data source name (default: egx_bulletin).")
    args = parser.parse_args()
    
    # 1. Setup logs
    setup_logging()
    logger = logging.getLogger("tradeora.main")
    logger.info("=" * 60)
    logger.info("Tradeora EGX Importer Pipeline Started")
    logger.info(f"Arguments: {args}")
    
    # Set default source in settings if overridden
    if args.source:
        settings.DEFAULT_SOURCE = args.source

    try:
        scraper = EGXScraper()
        records = []
        
        # 2. Extract Data
        if args.file:
            logger.info(f"Direct file parse requested for: {args.file}")
            if not os.path.exists(args.file):
                logger.error(f"Specified file not found: {args.file}")
                sys.exit(1)
            
            # Identify extension
            ext = os.path.splitext(args.file)[1].lower()
            if ext == ".html":
                with open(args.file, "r", encoding="utf-8") as f:
                    content = f.read()
                records = scraper._parse_html(content, source_name=os.path.basename(args.file))
            elif ext in (".xlsx", ".xls"):
                records = scraper._parse_excel(args.file)
            elif ext == ".csv":
                records = scraper._parse_csv(args.file)
            else:
                logger.error(f"Unsupported file format: {ext}")
                sys.exit(1)
        else:
            # Normal flow (Online with fallbacks)
            if args.source == "tradingview":
                from scrapers.tradingview_scraper import TradingViewScraper
                logger.info("Initializing TradingView price scraper...")
                scraper_tv = TradingViewScraper()
                records = scraper_tv.fetch_data()
            else:
                try:
                    records = scraper.fetch_data()
                except Exception as e:
                    logger.warning(
                        f"EGX Scraper failed (no PDF file or network block): {e}.\n"
                        "Automatically falling back to TradingView End-of-Day prices..."
                    )
                    # Override source in statistics & settings so it logs as tradingview
                    args.source = "tradingview"
                    settings.DEFAULT_SOURCE = "tradingview"
                    from scrapers.tradingview_scraper import TradingViewScraper
                    scraper_tv = TradingViewScraper()
                    records = scraper_tv.fetch_data()
            
        if not records:
            logger.error("No records retrieved. Pipeline terminated.")
            sys.exit(1)
            
        logger.info(f"Retrieved {len(records)} records. Commencing database import...")

        # 3. Import Data
        importer = DataImporter(dry_run=args.dry_run)
        summary = importer.import_records(records)
        
        # 4. Print Summary Report to Terminal
        print("\n" + "=" * 50)
        print("          TRADEORA EXECUTION SUMMARY REPORT          ")
        print("=" * 50)
        print(f"Execution Time    : {summary['execution_time_seconds']:.2f} seconds")
        print(f"Started At        : {summary['started_at']}")
        print(f"Finished At       : {summary['finished_at']}")
        print(f"Data Source       : {summary['source']}")
        print(f"Rows Read         : {summary['rows_read']}")
        print(f"New Companies     : {summary['new_companies']}")
        print(f"Updated Companies : {summary['updated_companies']}")
        print(f"Inserted Prices   : {summary['inserted_prices']}")
        print(f"Updated Prices    : {summary['updated_prices']}")
        print(f"Warnings Count    : {summary['warnings_count']}")
        print(f"Errors Count      : {summary['errors_count']}")
        
        if summary["warnings_count"] > 0:
            print("\nWarnings:")
            for w in summary["warnings"][:5]:
                print(f"  - [WARNING] {w}")
            if len(summary["warnings"]) > 5:
                print(f"  ... and {len(summary['warnings']) - 5} more warnings.")
                
        if summary["errors_count"] > 0:
            print("\nErrors:")
            for e in summary["errors"][:5]:
                print(f"  - [ERROR] {e}")
            if len(summary["errors"]) > 5:
                print(f"  ... and {len(summary['errors']) - 5} more errors.")
        print("=" * 50 + "\n")

        # 5. Weekly Fundamentals Update (Sundays)
        if now.weekday() == 6:  # 6 = Sunday in Python (0=Mon, 6=Sun)
            try:
                logger.info("Sunday detected — Running weekly fundamentals update from Yahoo Finance...")
                from scrapers.fundamentals_scraper import fetch_fundamentals_yahoo
                from database import db
                companies = db.get_all_companies()
                company_symbols = [c["symbol"] for c in companies] if companies else []
                if company_symbols:
                    fund_data = fetch_fundamentals_yahoo(company_symbols)
                    if fund_data:
                        db.upsert_company_fundamentals(fund_data)
                        logger.info(f"Weekly fundamentals update completed ({len(fund_data)} companies updated).")
            except Exception as e:
                logger.warning(f"Fundamentals update failed (non-fatal): {e}")

        logger.info("Tradeora EGX Importer Pipeline Completed Successfully.")
        
    except Exception as e:
        logger.critical(f"Unhandled exception in pipeline: {e}")
        logger.critical(traceback.format_exc())
        sys.exit(1)

if __name__ == "__main__":
    main()
