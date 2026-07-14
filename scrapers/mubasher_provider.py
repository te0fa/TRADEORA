import asyncio
import datetime
import random
import pytz
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from scrapers.utils import is_market_open, MarketClosedException

class MubasherProvider:
    """
    Data provider for Mubasher Egypt market prices.
    Uses async page fetching with concurrency limits and random delays.
    """
    
    def __init__(self, max_concurrency: int = 3):
        self.max_concurrency = max_concurrency
        
    async def fetch_prices(self, symbols: list, bypass_session_guard: bool = False) -> list:
        """
        Fetches prices for specified symbols concurrently.
        Returns a list of dictionaries with standard keys.
        """
        if not bypass_session_guard and not is_market_open():
            print("[MubasherProvider] Market Closed. Skipping scraping.")
            raise MarketClosedException("Market Closed")
            
        results = []
        semaphore = asyncio.Semaphore(self.max_concurrency)
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                viewport={"width": 1280, "height": 720}
            )
            # Modify navigator.webdriver
            await context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            
            async def fetch_one(symbol):
                async with semaphore:
                    # Random delay to simulate human browsing
                    delay = random.uniform(0.5, 1.5)
                    await asyncio.sleep(delay)
                    
                    page = await context.new_page()
                    url = f"https://www.mubasher.info/markets/EGX/stocks/{symbol.upper()}"
                    
                    price = None
                    change = None
                    change_percent = None
                    volume = 0
                    cairo_tz = pytz.timezone('Africa/Cairo')
                    timestamp = datetime.datetime.now(cairo_tz).isoformat()
                    
                    try:
                        await page.goto(url, wait_until="domcontentloaded", timeout=25000)
                        await page.wait_for_timeout(2000)
                        
                        content = await page.content()
                        soup = BeautifulSoup(content, 'html.parser')
                        
                        # 1. Last Price
                        price_el = soup.find(class_="market-summary__last-price")
                        if price_el:
                            price_str = "".join(c for c in price_el.text.strip().replace(",", "") if c.isdigit() or c == ".")
                            if price_str:
                                price = float(price_str)
                                
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
                        # We search for block rows containing 'حجم التداول' or 'إجمالي الحجم'
                        rows = soup.find_all(class_="market-summary__block-row")
                        for r in rows:
                            text_el = r.find(class_="market-summary__block-text")
                            if text_el and any(term in text_el.text for term in ["حجم التداول", "إجمالي الحجم"]):
                                num_el = r.find(class_="market-summary__block-number")
                                if num_el:
                                    vol_str = "".join(c for c in num_el.text.strip().replace(",", "") if c.isdigit())
                                    if vol_str:
                                        volume = int(vol_str)
                                        break
                                        
                        if price is not None:
                            results.append({
                                "symbol": symbol.upper(),
                                "price": price,
                                "change": change,
                                "change_percent": change_percent,
                                "volume": volume,
                                "timestamp": timestamp,
                                "source": "Mubasher"
                            })
                    except Exception as e:
                        print(f"[MubasherProvider] Error fetching {symbol}: {e}")
                    finally:
                        await page.close()
            
            tasks = [fetch_one(sym) for sym in symbols]
            await asyncio.gather(*tasks)
            await browser.close()
            
        return results
