import os
import sys
import re
import math
import logging
import pytz
import yfinance as yf
from concurrent.futures import ThreadPoolExecutor

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config import settings
from database import db

# Set up logging
logger = logging.getLogger("tradeora.fundamentals_scraper")

def _fetch_single_yahoo(symbol: str, co_id: str) -> dict | None:
    """Helper to fetch fundamentals for a single EGX symbol via yfinance."""
    sym_clean = symbol.upper().strip()
    try:
        ticker = yf.Ticker(f"{sym_clean}.CA")
        info = ticker.info or {}
        
        pe_ratio = info.get('trailingPE')
        pb_ratio = info.get('priceToBook')
        eps = info.get('trailingEps')
        book_value_ps = info.get('bookValue')
        roe = info.get('returnOnEquity')
        roa = info.get('returnOnAssets')
        profit_margin = info.get('profitMargins')
        debt_to_equity = info.get('debtToEquity')
        current_ratio = info.get('currentRatio')
        revenue = info.get('totalRevenue')
        net_income = info.get('netIncomeToCommon')
        dividend_yield = info.get('dividendYield')
        shares_outstanding = info.get('sharesOutstanding')
        market_cap = info.get('marketCap')

        if any(v is not None for v in [pe_ratio, pb_ratio, eps, book_value_ps, market_cap, roe]):
            return {
                'company_id': co_id,
                'pe_ratio': pe_ratio,
                'pb_ratio': pb_ratio,
                'eps': eps,
                'book_value_ps': book_value_ps,
                'roe': roe,
                'roa': roa,
                'profit_margin': profit_margin,
                'debt_to_equity': debt_to_equity,
                'current_ratio': current_ratio,
                'revenue': revenue,
                'net_income': net_income,
                'dividend_yield': dividend_yield,
                'shares_outstanding': shares_outstanding,
                'market_cap': market_cap,
                'source': 'yahoo_finance'
            }
    except Exception as e:
        logger.debug(f"Skip {sym_clean} in yfinance: {e}")
    return None

def fetch_fundamentals_yahoo(symbols: list[str] = None, max_workers: int = 15) -> list[dict]:
    """
    Fetches stock fundamental metrics from Yahoo Finance (yfinance) for EGX stocks (.CA).
    Uses ThreadPoolExecutor for fast parallel fetching.
    Maps symbols to company_id in Supabase company_fundamentals table.
    """
    companies = db.get_all_companies()
    if not companies:
        logger.warning("No companies found in database.")
        return []

    co_map = {c["symbol"].upper(): c["id"] for c in companies}
    if not symbols:
        symbols = [c["symbol"] for c in companies]

    logger.info(f"Fetching fundamentals from Yahoo Finance for {len(symbols)} companies (workers={max_workers})...")
    
    tasks = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [
            executor.submit(_fetch_single_yahoo, sym, co_map[sym.upper()])
            for sym in symbols if sym.upper() in co_map
        ]
        for future in futures:
            res = future.result()
            if res:
                tasks.append(res)

    logger.info(f"Successfully retrieved fundamentals for {len(tasks)} companies.")
    return tasks

class FundamentalsScraper:
    def __init__(self, max_concurrency: int = 15):
        self.max_concurrency = max_concurrency

    def scrape_and_update(self):
        """Main pipeline to orchestrate fundamentals fetch and DB updates."""
        logger.info("Initializing Financial Fundamentals scraping pipeline...")
        try:
            fundamentals = fetch_fundamentals_yahoo(max_workers=self.max_concurrency)
            if fundamentals:
                db.upsert_company_fundamentals(fundamentals)
                logger.info(f"Fundamentals pipeline completed successfully. Upserted {len(fundamentals)} records.")
            else:
                logger.warning("No fundamentals data retrieved from Yahoo Finance.")
        except Exception as e:
            logger.error(f"Error in fundamentals pipeline: {e}")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    scraper = FundamentalsScraper()
    scraper.scrape_and_update()
