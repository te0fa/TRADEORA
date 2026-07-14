import asyncio
import datetime
import pytz
import random
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from scrapers.utils import is_market_open, MarketClosedException

class GoogleProvider:
    """
    Data provider for Google Finance Egypt market prices (Observational).
    Uses Playwright to directly load the quote page to bypass captchas.
    """
    
    def __init__(self, max_concurrency: int = 3):
        self.max_concurrency = max_concurrency
        
    async def fetch_prices(self, symbols: list, bypass_session_guard: bool = False) -> list:
        """
        Fetches prices for specified symbols from Google Finance.
        Returns a list of dictionaries with standard keys.
        """
        if not bypass_session_guard and not is_market_open():
            print("[GoogleProvider] Market Closed. Skipping scraping.")
            raise MarketClosedException("Market Closed")
            
        results = []
        semaphore = asyncio.Semaphore(self.max_concurrency)
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                viewport={"width": 1024, "height": 768}
            )
            await context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            
            async def fetch_one(symbol):
                async with semaphore:
                    # Random delay
                    await asyncio.sleep(random.uniform(0.5, 1.2))
                    
                    page = await context.new_page()
                    url = f"https://www.google.com/finance/quote/{symbol.upper()}:EGX"
                    
                    price = None
                    change = None
                    change_percent = None
                    cairo_tz = pytz.timezone('Africa/Cairo')
                    timestamp = datetime.datetime.now(cairo_tz).isoformat()
                    
                    try:
                        await page.goto(url, wait_until="domcontentloaded", timeout=20000)
                        await page.wait_for_timeout(2000)
                        
                        content = await page.content()
                        soup = BeautifulSoup(content, 'html.parser')
                        
                        # 1. Try to find last price using Google's standard classes
                        # Standard class is often 'YMlAec' (or 'fxKbKc' for some)
                        price_el = soup.select_one(".YMlAec, .fxKbKc")
                        if price_el:
                            price_str = "".join(c for c in price_el.text.strip().replace(",", "") if c.isdigit() or c == ".")
                            if price_str:
                                price = float(price_str)
                                
                        # 2. Try to find change and change percent
                        # Change value & change % are often under elements with class 'Jw716c' or similar
                        change_el = soup.select_one(".Jw716c")
                        if change_el:
                            # Text is usually like "+0.15 (+1.52%)" or "-0.10 (-0.80%)"
                            text = change_el.text.strip()
                            parts = text.split()
                            if len(parts) >= 2:
                                chg_str = "".join(c for c in parts[0].replace(",", "") if c.isdigit() or c in [".", "-", "+"])
                                chg_pct_str = "".join(c for c in parts[1].replace(",", "").replace("%", "") if c.isdigit() or c in [".", "-", "+"])
                                if chg_str:
                                    change = float(chg_str)
                                if chg_pct_str:
                                    change_percent = float(chg_pct_str)
                                    
                        if price is not None:
                            results.append({
                                "symbol": symbol.upper(),
                                "price": price,
                                "change": change if change is not None else 0.0,
                                "change_percent": change_percent if change_percent is not None else 0.0,
                                "volume": 0, # Google Finance doesn't show volume clearly on quote pages in a standard selector
                                "timestamp": timestamp,
                                "source": "Google"
                            })
                    except Exception as e:
                        print(f"[GoogleProvider] Error fetching {symbol}: {e}")
                    finally:
                        await page.close()
                        
            tasks = [fetch_one(sym) for sym in symbols]
            await asyncio.gather(*tasks)
            await browser.close()
            
        return results
