import yfinance as yf
import datetime
import pytz
import logging
from scrapers.utils import is_market_open, MarketClosedException

logger = logging.getLogger(__name__)

class YahooIntradayProvider:
    """Yahoo Finance intraday price provider for EGX stocks."""
    
    SUFFIX = ".CA"  # EGX suffix in Yahoo
    
    def __init__(self):
        pass
    
    def fetch_prices(self, symbols: list,
                     bypass_session_guard: bool = False) -> list:
        if not bypass_session_guard and not is_market_open():
            raise MarketClosedException("Market Closed")
        
        cairo_tz = pytz.timezone('Africa/Cairo')
        timestamp = datetime.datetime.now(cairo_tz).isoformat()
        results = []
        
        # Yahoo يقبل batch للـ tickers
        tickers_str = " ".join(
            f"{s.upper()}{self.SUFFIX}" for s in symbols
        )
        
        try:
            data = yf.download(
                tickers=tickers_str,
                period="1d",
                interval="1m",
                progress=False,
                group_by="ticker"
            )
            
            for sym in symbols:
                ticker = f"{sym.upper()}{self.SUFFIX}"
                try:
                    if len(symbols) == 1:
                        df = data
                    else:
                        df = data[ticker]
                    
                    if df is None or df.empty:
                        continue
                    
                    last = df.iloc[-1]
                    price = float(last["Close"])
                    volume = int(last["Volume"]) if last["Volume"] else 0
                    open_p = float(last["Open"])
                    high_p = float(last["High"])
                    low_p  = float(last["Low"])
                    
                    if price <= 0:
                        continue
                    
                    results.append({
                        "symbol": sym.upper(),
                        "price": price,
                        "change": None,
                        "change_percent": None,
                        "volume": volume,
                        "open_price": open_p,
                        "high_price": high_p,
                        "low_price": low_p,
                        "timestamp": timestamp,
                        "source": "Yahoo"
                    })
                except Exception as e:
                    logger.warning(f"Yahoo: failed for {sym}: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"YahooIntradayProvider error: {e}")
        
        logger.info(f"[Yahoo] Fetched {len(results)}/{len(symbols)}")
        return results
