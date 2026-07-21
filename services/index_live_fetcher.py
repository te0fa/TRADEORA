import requests
from bs4 import BeautifulSoup
import yfinance as yf
import logging
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger("tradeora.index_live_fetcher")

def fetch_tradingview_indices() -> dict:
    """Fetch EGX indices from TradingView scanner API."""
    url = "https://scanner.tradingview.com/egypt/scan"
    headers = {"User-Agent": "Mozilla/5.0", "Content-Type": "application/json"}
    payload = {
        "symbols": {"tickers": ["EGX:EGX30", "EGX:EGX70", "EGX:EGX100", "EGX:EGX33"]},
        "columns": ["name", "description", "close", "change", "change_abs"]
    }
    tv_res = {}
    try:
        r = requests.post(url, json=payload, headers=headers, timeout=8)
        if r.status_code == 200:
            for row in r.json().get("data", []):
                sym = row["s"].split(":")[1].upper() # EGX30, EGX70, etc.
                d = row["d"]
                if d[2] is not None:
                    tv_res[sym] = {
                        "value": float(d[2]),
                        "change_percent": float(d[3]) if d[3] is not None else 0.0,
                        "change_value": float(d[4]) if d[4] is not None else 0.0,
                        "source": "tradingview"
                    }
    except Exception as e:
        logger.warning(f"Error fetching TradingView indices: {e}")
    return tv_res


def fetch_mubasher_indices() -> dict:
    """Fetch EGX indices live from Mubasher Egypt market summary page."""
    url = "https://www.mubasher.info/markets/EGX"
    headers = {"User-Agent": "Mozilla/5.0"}
    mub_res = {}
    try:
        r = requests.get(url, headers=headers, timeout=8)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            # Parse main EGX30 index block
            # Mubasher contains elements with index name and values
            text = soup.text
            import re
            # Match patterns like EGX 30 53,599.44 0.89%
            egx30_match = re.search(r"EGX\s*30\s*([\d,.]+)\s*([\d,.+\-]+)%?", text, re.IGNORECASE)
            if egx30_match:
                val_str = egx30_match.group(1).replace(",", "")
                chg_str = egx30_match.group(2).replace(",", "").replace("%", "")
                mub_res["EGX30"] = {
                    "value": float(val_str),
                    "change_percent": float(chg_str),
                    "source": "mubasher"
                }
    except Exception as e:
        logger.warning(f"Error fetching Mubasher indices: {e}")
    return mub_res


def fetch_yahoo_indices() -> dict:
    """Fetch EGX indices from Yahoo Finance."""
    yf_symbols = {
        "EGX30": "^CASE30",
        "EGX70": "^EGX70EWI.CA",
        "EGX100": "^EGX100EWI.CA"
    }
    yf_res = {}
    for idx_name, sym in yf_symbols.items():
        try:
            t = yf.Ticker(sym)
            hist = t.history(period="5d")
            if len(hist) >= 2:
                latest = float(hist["Close"].iloc[-1])
                prev = float(hist["Close"].iloc[-2])
                chg_pct = round(((latest - prev) / prev) * 100, 2)
                yf_res[idx_name] = {
                    "value": round(latest, 2),
                    "change_percent": chg_pct,
                    "source": "yahoo"
                }
        except Exception:
            pass
    return yf_res


def get_live_index_consensus(index_name: str = "EGX30") -> dict:
    """
    Returns multi-provider live index data & resolved consensus for EGX30, EGX70, EGX100, or EGX33.
    """
    idx_key = index_name.upper().replace(" ", "").replace("_", "")
    
    with ThreadPoolExecutor(max_workers=3) as executor:
        f_tv = executor.submit(fetch_tradingview_indices)
        f_mub = executor.submit(fetch_mubasher_indices)
        f_yf = executor.submit(fetch_yahoo_indices)
        
        tv_all = f_tv.result()
        mub_all = f_mub.result()
        yf_all = f_yf.result()

    providers = {}
    if idx_key in tv_all: providers["tradingview"] = tv_all[idx_key]
    if idx_key in mub_all: providers["mubasher"] = mub_all[idx_key]
    if idx_key in yf_all: providers["yahoo"] = yf_all[idx_key]

    if not providers:
        return {"value": None, "change_percent": None, "consensus": None, "providers": {}}

    values = [p["value"] for p in providers.values() if p.get("value") is not None]
    changes = [p["change_percent"] for p in providers.values() if p.get("change_percent") is not None]

    consensus_value = round(sum(values) / len(values), 2) if values else None
    consensus_change = round(sum(changes) / len(changes), 2) if changes else None

    return {
        "index": idx_key,
        "value": consensus_value,
        "change_percent": consensus_change,
        "providers_count": len(providers),
        "providers": providers
    }

if __name__ == "__main__":
    print("EGX30 Consensus:", get_live_index_consensus("EGX30"))
    print("EGX70 Consensus:", get_live_index_consensus("EGX70"))
