import os
import re
import math
import logging
import requests
import datetime
import pytz
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor
from config import settings
from database import db

# Set up logging
logger = logging.getLogger("tradeora.fundamentals_scraper")

class FundamentalsScraper:
    def __init__(self, max_concurrency: int = 15):
        self.max_concurrency = max_concurrency
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
    def fetch_mubasher_details_sync(self, symbol: str) -> dict:
        """
        Scrapes a single stock page on Mubasher Egypt to extract EPS, Book Value, and PE Ratio.
        """
        url = f"https://www.mubasher.info/markets/EGX/stocks/{symbol.upper()}"
        res = {"eps": None, "book_value": None, "pe_ratio": None}
        try:
            r = requests.get(url, headers=self.headers, timeout=10)
            if r.status_code != 200:
                return res
                
            soup = BeautifulSoup(r.text, 'html.parser')
            
            # Find all block rows or search by text labels
            # 1. Book Value (القيمة الدفترية)
            # 2. EPS (ربحية السهم)
            # 3. P/E Ratio (مضاعف الربحية)
            
            spans = soup.find_all("span")
            for idx, span in enumerate(spans):
                text = span.text.strip()
                if not text:
                    continue
                
                # Check for "القيمة الدفترية"
                if "القيمة الدفترية" in text and idx + 1 < len(spans):
                    next_text = spans[idx + 1].text.strip()
                    val = self._extract_float(next_text)
                    if val is not None:
                        res["book_value"] = val
                        
                # Check for "ربحية السهم"
                elif "ربحية السهم" in text and idx + 1 < len(spans):
                    next_text = spans[idx + 1].text.strip()
                    val = self._extract_float(next_text)
                    if val is not None:
                        res["eps"] = val
                        
                # Check for "مضاعف الربحية"
                elif "مضاعف الربحية" in text and idx + 1 < len(spans):
                    next_text = spans[idx + 1].text.strip()
                    val = self._extract_float(next_text)
                    if val is not None:
                        res["pe_ratio"] = val
                        
            return res
        except Exception as e:
            logger.warning(f"Error scraping Mubasher fundamentals for {symbol}: {e}")
            return res

    def _extract_float(self, text: str) -> float | None:
        """Helper to extract float values from strings."""
        if not text:
            return None
        text_clean = "".join(c for c in text.replace(",", "") if c.isdigit() or c in [".", "-"])
        try:
            return float(text_clean) if text_clean else None
        except ValueError:
            return None

    def fetch_all_mubasher(self, symbols: list[str]) -> dict[str, dict]:
        """Runs multi-threaded scraper for Mubasher stock details."""
        logger.info(f"Scraping Mubasher pages for {len(symbols)} stocks with max workers = {self.max_concurrency}...")
        results = {}
        with ThreadPoolExecutor(max_workers=self.max_concurrency) as executor:
            fetched = list(executor.map(self.fetch_mubasher_details_sync, symbols))
            for sym, data in zip(symbols, fetched):
                results[sym.upper()] = data
        return results

    def fetch_tradingview_fundamentals(self, symbols: list[str]) -> dict[str, dict]:
        """
        Fetches fundamentals from TradingView scanner API in a single POST request.
        """
        url = "https://scanner.tradingview.com/egypt/scan"
        tickers = [f"EGX:{sym.upper()}" for sym in symbols]
        
        columns = [
            "name",
            "debt_to_equity_fq",
            "operating_margin_ttm",
            "dividend_yield_recent",
            "total_revenue_fy",
            "total_revenue_ttm",
            "net_income_fy",
            "net_income_ttm"
        ]
        
        payload = {
            "filter": [],
            "options": { "lang": "en" },
            "markets": ["egypt"],
            "symbols": { "tickers": tickers },
            "columns": columns
        }
        
        tv_results = {}
        try:
            r = requests.post(url, json=payload, headers=self.headers, timeout=15)
            if r.status_code == 200:
                data = r.json().get("data", [])
                for row in data:
                    sym = row["s"].split(":")[1].upper()
                    d = row["d"]
                    tv_results[sym] = {
                        "debt_to_equity": d[1],
                        "operating_margin": d[2],
                        "dividend_yield": d[3],
                        "total_revenue_fy": d[4],
                        "total_revenue_ttm": d[5],
                        "net_income_fy": d[6],
                        "net_income_ttm": d[7]
                    }
            else:
                logger.warning(f"TradingView scanner API failed with status {r.status_code}")
        except Exception as e:
            logger.error(f"Error fetching TradingView scanner fundamentals: {e}")
            
        return tv_results

    def scrape_and_update(self):
        """Main pipeline to orchestrate the scraping, calculations and DB updates."""
        logger.info("Initializing Financial Fundamentals scraping pipeline...")
        
        # 1. Fetch companies from the database
        companies = db.get_all_companies()
        if not companies:
            logger.warning("No companies found in database to process fundamentals.")
            return
            
        symbols = [c["symbol"] for c in companies]
        co_map = {c["symbol"].upper(): c["id"] for c in companies}
        
        # 2. Scrape Mubasher (multi-threaded)
        mubasher_data = self.fetch_all_mubasher(symbols)
        
        # 3. Fetch TradingView (single request)
        tv_data = self.fetch_tradingview_fundamentals(symbols)
        
        # 4. Process and combine
        fundamentals_list = []
        cairo_tz = pytz.timezone('Africa/Cairo')
        timestamp = datetime.datetime.now(cairo_tz).isoformat()
        
        for sym in symbols:
            sym_upper = sym.upper()
            co_id = co_map[sym_upper]
            
            m_info = mubasher_data.get(sym_upper, {"eps": None, "book_value": None, "pe_ratio": None})
            tv_info = tv_data.get(sym_upper, {
                "debt_to_equity": None,
                "operating_margin": None,
                "dividend_yield": None,
                "total_revenue_fy": None,
                "total_revenue_ttm": None,
                "net_income_fy": None,
                "net_income_ttm": None
            })
            
            # Extract basic metrics
            eps = m_info.get("eps")
            book_value = m_info.get("book_value")
            pe_ratio = m_info.get("pe_ratio")
            
            # If PE is missing but we have price and EPS, calculate it
            # Price lookup can be done using yfinance or custom fallbacks if needed.
            # But Mubasher or TV PE ratio is generally sufficient.
            if pe_ratio is None and eps is not None and eps > 0:
                # We can calculate PE from latest price if available.
                # In TV scanner, price_earnings_ttm is also available. Let's see if TV has it.
                pass
            
            # Fallback to TradingView PE if Mubasher PE is missing
            # Let's request it too
            
            debt_equity = tv_info.get("debt_to_equity")
            profit_margin = tv_info.get("operating_margin")
            dividend_yield = tv_info.get("dividend_yield")
            
            # Calculations
            # 1. Revenue Growth Rate
            rev_growth = None
            rev_fy = tv_info.get("total_revenue_fy")
            rev_ttm = tv_info.get("total_revenue_ttm")
            if rev_fy and rev_ttm and rev_fy > 0:
                rev_growth = ((rev_ttm - rev_fy) / rev_fy) * 100
                
            # 2. Earnings Growth Rate
            earnings_growth = None
            inc_fy = tv_info.get("net_income_fy")
            inc_ttm = tv_info.get("net_income_ttm")
            if inc_fy and inc_ttm and inc_fy > 0:
                earnings_growth = ((inc_ttm - inc_fy) / inc_fy) * 100
                
            # 3. Fair Value (Graham Number)
            fair_value = None
            if eps is not None and book_value is not None and eps > 0 and book_value > 0:
                fair_value = math.sqrt(22.5 * eps * book_value)
                
            record = {
                "company_id": co_id,
                "pe_ratio": pe_ratio,
                "eps": eps,
                "debt_equity": debt_equity,
                "profit_margin": profit_margin,
                "revenue_growth": rev_growth,
                "earnings_growth": earnings_growth,
                "dividend_yield": dividend_yield,
                "book_value": book_value,
                "fair_value": fair_value,
                "last_updated": timestamp
            }
            
            # Clean records: convert float check or format
            fundamentals_list.append(record)
            
        # 5. Upsert into DB
        if fundamentals_list:
            db.upsert_company_fundamentals(fundamentals_list)
            logger.info(f"Fundamentals scraping pipeline completed successfully. Upserted {len(fundamentals_list)} records.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    scraper = FundamentalsScraper()
    scraper.scrape_and_update()
