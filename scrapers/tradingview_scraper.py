import requests
import logging
from datetime import date
from config import settings

logger = logging.getLogger(__name__)

class TradingViewScraper:
    def __init__(self):
        self.url = "https://scanner.tradingview.com/egypt/scan"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Content-Type": "application/json"
        }

    def fetch_data(self) -> list[dict]:
        """
        Fetches stock price records from TradingView Egypt scanner API.
        Combines English and Arabic requests to get localized names.
        Returns a list of price records in standard dictionary format.
        """
        logger.info("Starting TradingView prices scraper...")
        
        # 1. Fetch English descriptions & prices
        payload_en = {
            "filter": [],
            "options": { "lang": "en" },
            "markets": ["egypt"],
            "symbols": { "query": { "types": [] }, "tickers": [] },
            "columns": [
                "name",
                "description",
                "open",
                "high",
                "low",
                "close",
                "volume",
                "Value.Traded",
                "change",
                "change_abs"
            ],
            "sort": { "sortBy": "name", "sortOrder": "asc" },
            "range": [0, 1000]
        }
        
        # 2. Fetch Arabic descriptions
        payload_ar = {
            "filter": [],
            "options": { "lang": "ar" },
            "markets": ["egypt"],
            "symbols": { "query": { "types": [] }, "tickers": [] },
            "columns": ["name", "description"],
            "sort": { "sortBy": "name", "sortOrder": "asc" },
            "range": [0, 1000]
        }

        try:
            logger.info("Fetching English price data from TradingView...")
            r_en = requests.post(self.url, json=payload_en, headers=self.headers, timeout=15)
            if r_en.status_code != 200:
                raise RuntimeError(f"TradingView English scan failed with status: {r_en.status_code}")
            rows_en = r_en.json().get("data", [])
            
            logger.info("Fetching Arabic descriptions from TradingView...")
            r_ar = requests.post(self.url, json=payload_ar, headers=self.headers, timeout=15)
            if r_ar.status_code != 200:
                raise RuntimeError(f"TradingView Arabic scan failed with status: {r_ar.status_code}")
            rows_ar = r_ar.json().get("data", [])
            
        except Exception as e:
            logger.error(f"Failed to communicate with TradingView API: {e}")
            raise e

        # 3. Combine English and Arabic data by ticker symbol
        ar_desc_map = {}
        for row in rows_ar:
            ticker = row["s"].split(":")[1].upper()
            desc_ar = row["d"][1]
            ar_desc_map[ticker] = desc_ar

        today = date.today()
        records = []
        
        for row in rows_en:
            ticker = row["s"].split(":")[1].upper()
            d = row["d"]
            
            # Extract fields based on English payload columns index:
            # 0: name, 1: description, 2: open, 3: high, 4: low, 5: close, 6: volume, 7: Value.Traded, 8: change, 9: change_abs
            open_price = d[2]
            high_price = d[3]
            low_price = d[4]
            close_price = d[5]
            volume = d[6]
            value_traded = d[7]
            change_percent = d[8]
            change_value = d[9]
            
            # Mathematically compute previous close: previous_close = close - change_abs
            previous_close = None
            if close_price is not None and change_value is not None:
                previous_close = round(close_price - change_value, 4)
                
            name_en = d[1]
            name_ar = ar_desc_map.get(ticker, name_en)
            
            # Skip records that have no trades/prices (e.g. volume is 0 and prices are None)
            if close_price is None or open_price is None:
                continue

            records.append({
                "symbol": ticker,
                "name_ar": name_ar,
                "name_en": name_en,
                "open_price": open_price,
                "high_price": high_price,
                "low_price": low_price,
                "close_price": close_price,
                "previous_close": previous_close,
                "change_value": change_value,
                "change_percent": change_percent,
                "volume": volume,
                "value_traded": value_traded,
                "price_date": today.isoformat()
            })

        logger.info(f"Successfully scraped and combined {len(records)} active price records from TradingView.")
        return records
