import asyncio
import sys
import os

# Ensure e:\TRADEORA is on path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from scrapers.tradingview_provider import TradingViewProvider
from scrapers.mubasher_provider import MubasherProvider
from scrapers.investing_provider import InvestingProvider

# Define 35 major active EGX symbols for testing
symbols = [
    "COMI", "FWRY", "SWDY", "EAST", "ABUK", "AMOC", "TMGH", "ETEL", "CCAP", 
    "HELI", "OCDI", "HRHO", "TALM", "JUFO", "ORAS", "EGAL", "CICH", "MFPC", 
    "CIEB", "BTFH", "CLHO", "RMDA", "ADIB", "ASCM", "MICH", "PHDC", "EGCH",
    "ELKA", "RAYA", "DSCW", "ALCN", "AJWA", "APPC", "ATQA", "BTFH"
]
# Remove duplicates and sort
symbols = sorted(list(set(symbols)))

async def main():
    print("=" * 90)
    print("                 STARTING PRIMARY 3-SOURCE INTRADAY PRICE COMPARISON           ")
    print("=" * 90)
    print(f"Total symbols in test universe: {len(symbols)}")
    print(f"Symbols: {', '.join(symbols)}")
    print("-" * 90)
    
    # Instantiate primary providers
    tv = TradingViewProvider()
    mub = MubasherProvider(max_concurrency=4)
    inv = InvestingProvider(mapping_dir="data")
    
    # 1. Fetch TradingView prices (bypassing guard for testing)
    tv_results = tv.fetch_prices(symbols, bypass_session_guard=True)
    tv_map = {r["symbol"]: r for r in tv_results}
    
    # 2. Fetch Investing.com prices (bypassing guard for testing)
    inv_results, fuzzy_matches = await inv.fetch_prices(bypass_session_guard=True)
    inv_map = {r["symbol"]: r for r in inv_results}
    
    # 3. Fetch Mubasher prices (bypassing guard for testing)
    mub_results = await mub.fetch_prices(symbols, bypass_session_guard=True)
    mub_map = {r["symbol"]: r for r in mub_results}
    
    # Output Price Comparison Table
    print("\n" + "=" * 90)
    print("                      PRICE COMPARISON MATRIX (3 SOURCES)                      ")
    print("=" * 90)
    print(f"{'Symbol':<8} | {'Mubasher':<14} | {'Investing':<14} | {'TradingView':<14} | {'M vs TV %':<11} | {'I vs TV %':<11}")
    print("-" * 90)
    
    for sym in symbols:
        m_price = mub_map.get(sym, {}).get("price")
        i_price = inv_map.get(sym, {}).get("price")
        t_price = tv_map.get(sym, {}).get("price")
        
        m_str = f"{m_price:.3f}" if m_price is not None else "N/A"
        i_str = f"{i_price:.3f}" if i_price is not None else "N/A"
        t_str = f"{t_price:.3f}" if t_price is not None else "N/A"
        
        # Calculate percentage differences
        diff_m_tv = "N/A"
        if m_price and t_price:
            diff_m_tv = f"{abs(m_price - t_price) / t_price * 100:.2f}%"
            
        diff_i_tv = "N/A"
        if i_price and t_price:
            diff_i_tv = f"{abs(i_price - t_price) / t_price * 100:.2f}%"
            
        print(f"{sym:<8} | {m_str:<14} | {i_str:<14} | {t_str:<14} | {diff_m_tv:<11} | {diff_i_tv:<11}")
    print("=" * 90)
    
    # Output Fuzzy Match Verification Table
    print("\n" + "=" * 90)
    print("                     INVESTING.COM FUZZY MATCH VERIFICATION                    ")
    print("=" * 90)
    print(f"{'Original Name (Investing)':<45} | {'Mapped Symbol':<13} | {'Mapped Name (Database)'}")
    print("-" * 90)
    
    if fuzzy_matches:
        for raw_name, sym, db_name in sorted(fuzzy_matches, key=lambda x: x[1]):
            print(f"{raw_name:<45} | {sym:<13} | {db_name}")
    else:
        print("No fuzzy matches detected. All matches were exact matches!")
    print("=" * 90 + "\n")

if __name__ == "__main__":
    asyncio.run(main())
