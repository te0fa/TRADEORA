import asyncio
import datetime
import random
import pytz
import requests
import logging
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor
from scrapers.utils import is_market_open, MarketClosedException

logger = logging.getLogger(__name__)

class MubasherProvider:
    """
    Data provider for Mubasher Egypt market prices.
    Uses multi-threaded requests and BeautifulSoup parser for extremely fast and stable execution.
    """
    
    def __init__(self, max_concurrency: int = 15):
        self.max_concurrency = max_concurrency
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
    def _fetch_one_sync(self, symbol: str) -> dict | None:
        url = f"https://www.mubasher.info/markets/EGX/stocks/{symbol.upper()}"
        
        price = None
        change = None
        change_percent = None
        volume = 0
        cairo_tz = pytz.timezone('Africa/Cairo')
        timestamp = datetime.datetime.now(cairo_tz).isoformat()
        
        try:
            r = requests.get(url, headers=self.headers, timeout=8)
            if r.status_code != 200:
                if r.status_code != 404:
                    logger.warning(f"[MubasherProvider] Non-200 response for {symbol}: {r.status_code}")
                return None
                
            soup = BeautifulSoup(r.text, 'html.parser')
            
            # 1. Last Price
            price_el = soup.find(class_="market-summary__last-price")
            if price_el:
                price_str = "".join(c for c in price_el.text.strip().replace(",", "") if c.isdigit() or c == ".")
                if price_str:
                    price = float(price_str)
                    
            if price is None:
                return None
                
            # 2. Change
            change_el = soup.find(class_="market-summary__change")
            if change_el:
                change_str = "".join(c for c in change_el.text.strip().replace(",", "") if c.isdigit() or c in [".", "-"])
                if change_str:
                    change = float(change_str)
                    
            # 3. Change Percentage
            change_pct_el = soup.find(class_="market-summary__change-percentage")
            if change_pct_el:
                change_pct_str = "".join(c for c in change_pct_el.text.strip().replace(",", "") if c.isdigit() or c in [".", "-"])
                if change_pct_str:
                    change_percent = float(change_pct_str)
                    
            # 4. Volume (Trading Volume)
            rows = soup.find_all(class_="market-summary__block-row")
            for r_row in rows:
                text_el = r_row.find(class_="market-summary__block-text")
                if text_el and any(term in text_el.text for term in ["حجم التداول", "إجمالي الحجم"]):
                    num_el = r_row.find(class_="market-summary__block-number")
                    if num_el:
                        vol_str = "".join(c for c in num_el.text.strip().replace(",", "") if c.isdigit())
                        if vol_str:
                            volume = int(vol_str)
                            break
                            
            return {
                "symbol": symbol.upper(),
                "price": price,
                "change": change,
                "change_percent": change_percent,
                "volume": volume,
                "timestamp": timestamp,
                "source": "Mubasher"
            }
        except Exception as e:
            logger.error(f"[MubasherProvider] Connection/Parsing error for {symbol}: {e}")
            return None

    def _fetch_all_sync(self, symbols: list) -> list:
        results = []
        with ThreadPoolExecutor(max_workers=self.max_concurrency) as executor:
            fetched = list(executor.map(self._fetch_one_sync, symbols))
            results = [r for r in fetched if r is not None]
        return results

    async def fetch_prices(self, symbols: list, bypass_session_guard: bool = False) -> list:
        if not bypass_session_guard and not is_market_open():
            logger.info("[MubasherProvider] Market Closed. Skipping scraping.")
            raise MarketClosedException("Market Closed")
            
        logger.info(f"[MubasherProvider] Firing concurrent requests for {len(symbols)} symbols with max_workers={self.max_concurrency}...")
        
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(None, self._fetch_all_sync, symbols)
        
        logger.info(f"[MubasherProvider] Successfully fetched {len(results)} / {len(symbols)} prices.")
        return results
