import datetime
import requests
import pytz
from scrapers.utils import is_market_open, MarketClosedException

class TradingViewProvider:
    """
    Data provider for TradingView Egypt market prices.
    """
    
    def __init__(self):
        self.url = "https://scanner.tradingview.com/egypt/scan"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json"
        }
        
    def fetch_prices(self, symbols: list, bypass_session_guard: bool = False) -> list:
        """
        Fetches prices for specified symbols from TradingView scanner.
        Returns a list of dictionaries with standard keys.
        """
        if not bypass_session_guard and not is_market_open():
            print("[TradingViewProvider] Market Closed. Skipping scraping.")
            raise MarketClosedException("Market Closed")
            
        tickers = [f"EGX:{sym.upper()}" for sym in symbols]
        
        # We request name, close, volume, change (which is change percentage), change_abs (absolute change)
        payload = {
            "filter": [],
            "options": { "lang": "en" },
            "markets": ["egypt"],
            "symbols": { "tickers": tickers },
            "columns": ["close", "change", "change_abs", "volume", "open", "high", "low"]
        }
        
        results = []
        try:
            r = requests.post(self.url, json=payload, headers=self.headers, timeout=15)
            if r.status_code == 200:
                data = r.json().get("data", [])
                cairo_tz = pytz.timezone('Africa/Cairo')
                timestamp = datetime.datetime.now(cairo_tz).isoformat()
                
                for row in data:
                    sym = row["s"].split(":")[1].upper()
                    d = row["d"]
                    price = float(d[0]) if d[0] is not None else None
                    change_percent = float(d[1]) if d[1] is not None else None
                    change = float(d[2]) if d[2] is not None else None
                    volume = int(d[3]) if d[3] is not None else 0
                    open_price = float(d[4]) if len(d) > 4 and d[4] is not None else price
                    high_price = float(d[5]) if len(d) > 5 and d[5] is not None else price
                    low_price = float(d[6]) if len(d) > 6 and d[6] is not None else price
                    
                    results.append({
                        "symbol": sym,
                        "price": price,
                        "open": open_price,
                        "high": high_price,
                        "low": low_price,
                        "change": change,
                        "change_percent": change_percent,
                        "volume": volume,
                        "timestamp": timestamp,
                        "source": "tradingview"
                    })
            else:
                print(f"[TradingViewProvider] Failed to fetch. Status: {r.status_code}")
        except Exception as e:
            print(f"[TradingViewProvider] Error: {e}")
            
        return results
