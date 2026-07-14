import asyncio
import datetime
import pytz
import random
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from scrapers.utils import is_market_open, MarketClosedException

class MsnProvider:
    """
    Data provider for MSN/Bing Finance Egypt market prices (Observational).
    Uses Playwright to query Bing Search widget for the stock price.
    """
    
    def __init__(self, max_concurrency: int = 3):
        self.max_concurrency = max_concurrency
        
    async def fetch_prices(self, symbols: list, bypass_session_guard: bool = False) -> list:
        """
        Fetches prices for specified symbols from Bing Finance widget.
        Returns a list of dictionaries with standard keys.
        """
        if not bypass_session_guard and not is_market_open():
            print("[MsnProvider] Market Closed. Skipping scraping.")
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
                    # Query for EGX stock price on Bing
                    url = f"https://www.bing.com/search?q=EGX+{symbol.upper()}+price+stock"
                    
                    price = None
                    cairo_tz = pytz.timezone('Africa/Cairo')
                    timestamp = datetime.datetime.now(cairo_tz).isoformat()
                    
                    try:
                        await page.goto(url, wait_until="domcontentloaded", timeout=20000)
                        await page.wait_for_timeout(2000)
                        
                        content = await page.content()
                        soup = BeautifulSoup(content, 'html.parser')
                        
                        # Bing Finance Widget selectors:
                        # Price is usually in .b_focusTextLarge, .b_focusText, or inside a financial widget container
                        price_el = soup.select_one(".b_focusTextLarge, .b_focusText, [class*='fin_class'], .fin_price")
                        if price_el:
                            price_str = "".join(c for c in price_el.text.strip().replace(",", "") if c.isdigit() or c == ".")
                            if price_str:
                                price = float(price_str)
                                
                        if price is not None:
                            results.append({
                                "symbol": symbol.upper(),
                                "price": price,
                                "change": 0.0,
                                "change_percent": 0.0,
                                "volume": 0,
                                "timestamp": timestamp,
                                "source": "Bing"
                            })
                    except Exception as e:
                        print(f"[MsnProvider] Error fetching {symbol}: {e}")
                    finally:
                        await page.close()
                        
            tasks = [fetch_one(sym) for sym in symbols]
            await asyncio.gather(*tasks)
            await browser.close()
            
        return results
