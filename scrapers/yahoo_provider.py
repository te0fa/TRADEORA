import requests
import datetime
import pytz
from scrapers.utils import is_market_open, MarketClosedException, get_yahoo_ticker

class YahooProvider:
    """
    Data provider for Yahoo Finance Egypt market prices (Observational).
    Uses the public Chart API.
    """
    
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
    def fetch_prices(self, symbols: list, bypass_session_guard: bool = False) -> list:
        """
        Fetches prices for specified symbols from Yahoo Finance Chart API.
        Returns a list of dictionaries with standard keys.
        """
        if not bypass_session_guard and not is_market_open():
            print("[YahooProvider] Market Closed. Skipping scraping.")
            raise MarketClosedException("Market Closed")
            
        results = []
        cairo_tz = pytz.timezone('Africa/Cairo')
        timestamp = datetime.datetime.now(cairo_tz).isoformat()
        
        for sym in symbols:
            # Map symbol to standard or special ISIN Yahoo symbol
            yahoo_sym = get_yahoo_ticker(sym)
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{yahoo_sym}?interval=1m&range=1d"
            
            try:
                r = requests.get(url, headers=self.headers, timeout=10)
                if r.status_code == 200:
                    data = r.json()
                    meta = data.get("chart", {}).get("result", [{}])[0].get("meta", {})
                    
                    price = meta.get("regularMarketPrice")
                    prev_close = meta.get("previousClose")
                    volume = meta.get("regularMarketVolume", 0)
                    
                    change = None
                    change_percent = None
                    if price is not None and prev_close is not None and prev_close > 0:
                        change = price - prev_close
                        change_percent = (price - prev_close) / prev_close * 100
                        
                    if price is not None:
                        results.append({
                            "symbol": sym.upper(),
                            "price": float(price),
                            "change": float(change) if change is not None else 0.0,
                            "change_percent": float(change_percent) if change_percent is not None else 0.0,
                            "volume": int(volume) if volume else 0,
                            "timestamp": timestamp,
                            "source": "Yahoo"
                        })
            except Exception as e:
                print(f"[YahooProvider] Error fetching {sym}: {e}")
                
        return results
