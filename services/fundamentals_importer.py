import os
import sys
import math
import logging
import requests
import pytz
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
import yfinance as yf
from concurrent.futures import ThreadPoolExecutor

# Setup path and logging
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

load_dotenv(BASE_DIR / ".env")

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s [%(name)s]: %(message)s')
logger = logging.getLogger("tradeora.fundamentals_importer")

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

from supabase import create_client, Client
sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def fetch_tradingview_fundamentals() -> dict:
    """Fetch fundamental indicators from TradingView Egypt Scanner API."""
    logger.info("Fetching TradingView fundamental indicators...")
    url = "https://scanner.tradingview.com/egypt/scan"
    headers = {"User-Agent": "Mozilla/5.0", "Content-Type": "application/json"}

    columns = [
        "name",                           # 0
        "description",                    # 1
        "close",                          # 2
        "market_cap_basic",               # 3
        "price_earnings_ttm",             # 4
        "price_book_fq",                  # 5
        "earnings_per_share_basic_ttm",   # 6
        "dps_common_stock_prim_issue_fy", # 7 (Last Dividend per Share)
        "dividend_yield_recent",          # 8 (Dividend Yield %)
        "target_price_1y",                # 9 (Fair Value Target)
        "average_target_price",           # 10
        "book_value_per_share_fq",        # 11
        "return_on_equity_fq",            # 12
        "return_on_assets_fq",            # 13
        "total_revenue",                  # 14
        "net_income"                      # 15
    ]

    payload = {
        "filter": [],
        "options": {"lang": "en"},
        "markets": ["egypt"],
        "symbols": {"query": {"types": []}, "tickers": []},
        "columns": columns,
        "range": [0, 1000]
    }

    tv_map = {}
    try:
        r = requests.post(url, json=payload, headers=headers, timeout=20)
        if r.status_code == 200:
            rows = r.json().get("data", [])
            for row in rows:
                sym = row["s"].split(":")[1].upper()
                d = row["d"]
                tv_map[sym] = {
                    "close": d[2],
                    "market_cap": d[3],
                    "pe_ratio": d[4],
                    "pb_ratio": d[5],
                    "eps": d[6],
                    "dps": d[7],
                    "dividend_yield": d[8],
                    "target_price_1y": d[9] or d[10],
                    "book_value_ps": d[11],
                    "roe": d[12],
                    "roa": d[13],
                    "revenue": d[14],
                    "net_income": d[15]
                }
            logger.info(f"Retrieved TradingView fundamentals for {len(tv_map)} tickers.")
    except Exception as e:
        logger.error(f"Error fetching TradingView fundamentals: {e}")
    return tv_map


def _fetch_yahoo_single(symbol: str) -> dict | None:
    try:
        t = yf.Ticker(f"{symbol}.CA")
        info = t.info or {}
        return {
            "symbol": symbol,
            "target_mean_price": info.get("targetMeanPrice") or info.get("targetMedianPrice"),
            "last_dividend_value": info.get("lastDividendValue"),
            "dividend_yield": (info.get("dividendYield") or 0) * 100 if info.get("dividendYield") else None,
            "trailing_pe": info.get("trailingPE"),
            "price_to_book": info.get("priceToBook"),
            "trailing_eps": info.get("trailingEps"),
            "book_value": info.get("bookValue"),
            "roe": (info.get("returnOnEquity") or 0) * 100 if info.get("returnOnEquity") else None,
        }
    except Exception:
        return None


def fetch_yahoo_fundamentals(symbols: list[str]) -> dict:
    """Fetch Yahoo Finance target price and dividend metrics in parallel."""
    logger.info(f"Fetching Yahoo Finance fundamentals for {len(symbols)} symbols...")
    yf_map = {}
    with ThreadPoolExecutor(max_workers=10) as executor:
        results = executor.map(_fetch_yahoo_single, symbols)
        for res in results:
            if res:
                yf_map[res["symbol"]] = res
    logger.info(f"Retrieved Yahoo Finance fundamentals for {len(yf_map)} tickers.")
    return yf_map


def calculate_fair_value(close_price: float | None, eps: float | None, bvps: float | None, roe: float | None, analyst_target: float | None) -> tuple[float | None, str | None]:
    """
    Multi-Tier Valuation Strategy:
    1. Analyst Target Price (TradingView / Yahoo)
    2. Benjamin Graham Formula: sqrt(22.5 * EPS * BVPS)
    3. Book Value & ROE Growth Model: BVPS * (1 + ROE/100)
    4. Relative P/E Valuation Model: EPS * 12.0 (Average EGX P/E)
    """
    if analyst_target and analyst_target > 0:
        return round(float(analyst_target), 2), "analyst_consensus"

    if eps and eps > 0 and bvps and bvps > 0:
        graham_val = math.sqrt(22.5 * float(eps) * float(bvps))
        if 0.1 <= graham_val <= 5000:
            return round(graham_val, 2), "graham_formula"

    if bvps and bvps > 0 and roe and roe > 0:
        bv_roe_val = float(bvps) * (1.0 + (float(roe) / 100.0))
        if 0.1 <= bv_roe_val <= 5000:
            return round(bv_roe_val, 2), "book_value_roe"

    if eps and eps > 0:
        pe_val = float(eps) * 12.0
        if 0.1 <= pe_val <= 5000:
            return round(pe_val, 2), "pe_relative"

    return None, None


def run_fundamentals_import():
    logger.info("=== Starting Unified Multi-Source Fundamentals Import ===")

    # 1. Fetch companies from Supabase
    comp_res = sb.table("companies").select("id, symbol, name_ar").execute()
    companies = comp_res.data or []
    if not companies:
        logger.error("No companies found in database.")
        return

    symbols = [c["symbol"].split(".")[0] for c in companies]
    comp_id_map = {c["symbol"].split(".")[0]: c["id"] for c in companies}

    # 2. Fetch data from providers
    tv_data = fetch_tradingview_fundamentals()
    yf_data = fetch_yahoo_fundamentals(symbols[:100]) # top symbols

    # 3. Synthesize & Calculate metrics
    now_iso = datetime.now(pytz.timezone('Africa/Cairo')).isoformat()
    payloads = []
    
    updated_count = 0
    fair_val_count = 0
    div_count = 0

    for sym, cid in comp_id_map.items():
        tv = tv_data.get(sym, {})
        yf_info = yf_data.get(sym, {})

        close_p = tv.get("close")
        mcap = tv.get("market_cap") or yf_info.get("market_cap")
        pe = tv.get("pe_ratio") or yf_info.get("trailing_pe")
        pb = tv.get("pb_ratio") or yf_info.get("price_to_book")
        eps = tv.get("eps") or yf_info.get("trailing_eps")
        bvps = tv.get("book_value_ps") or yf_info.get("book_value")
        roe = tv.get("roe") or yf_info.get("roe")
        roa = tv.get("roa")
        rev = tv.get("revenue")
        net_inc = tv.get("net_income")

        # Dividend metrics
        last_div = tv.get("dps") or yf_info.get("last_dividend_value")
        if last_div is not None:
            last_div = round(float(last_div), 2)
            if last_div > 0: div_count += 1

        div_yield = tv.get("dividend_yield") or yf_info.get("dividend_yield")
        if (div_yield is None or div_yield == 0) and last_div and close_p and float(close_p) > 0:
            div_yield = round((last_div / float(close_p)) * 100, 2)
        elif div_yield is not None:
            div_yield = round(float(div_yield), 2)

        # Fair Value & Upside
        analyst_target = tv.get("target_price_1y") or yf_info.get("target_mean_price")
        fair_val, fv_source = calculate_fair_value(close_p, eps, bvps, roe, analyst_target)
        
        upside = None
        if fair_val and close_p and float(close_p) > 0:
            upside = round(((fair_val - float(close_p)) / float(close_p)) * 100, 2)
            fair_val_count += 1

        payload = {
            "company_id": cid,
            "pe_ratio": round(float(pe), 2) if pe else None,
            "pb_ratio": round(float(pb), 2) if pb else None,
            "eps": round(float(eps), 2) if eps else None,
            "book_value_ps": round(float(bvps), 2) if bvps else None,
            "roe": round(float(roe), 2) if roe else None,
            "roa": round(float(roa), 2) if roa else None,
            "revenue": round(float(rev), 2) if rev else None,
            "net_income": round(float(net_inc), 2) if net_inc else None,
            "market_cap": round(float(mcap), 2) if mcap else None,
            "dividend_yield": div_yield,
            "last_dividend_amount": last_div,
            "fair_value": fair_val,
            "fair_value_source": fv_source,
            "upside_potential": upside,
            "source": "tradingview_yahoo_synthesis",
            "updated_at": now_iso
        }
        payloads.append(payload)

    # 4. Upsert to Supabase
    logger.info(f"Upserting {len(payloads)} fundamental records to Supabase...")
    # Upsert in chunks of 50
    chunk_size = 50
    for i in range(0, len(payloads), chunk_size):
        chunk = payloads[i:i+chunk_size]
        sb.table("company_fundamentals").upsert(chunk, on_conflict="company_id").execute()

    logger.info("="*60)
    logger.info(f"SUCCESS: Import complete.")
    logger.info(f"Total Companies Updated: {len(payloads)}")
    logger.info(f"Companies with Fair Value Calculated: {fair_val_count}")
    logger.info(f"Companies with Dividend Data: {div_count}")
    logger.info("="*60)

if __name__ == "__main__":
    run_fundamentals_import()
