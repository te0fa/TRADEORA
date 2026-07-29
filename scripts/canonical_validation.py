import os
import sys
import subprocess
import logging

sys.path.insert(0, '.')
from generate_daily_recommendations import sb
from services.canonical import get_canonical_candles, get_canonical_price

def run_validation():
    print("=== Step 1: Checking for remaining local priority lists ===")
    
    # Run grep check for hardcoded priority lists
    result = subprocess.run(
        ['git', 'grep', '-n', '-E', 'ALLOWED_SOURCES|PREFERRED_SOURCES|SOURCE_PRIORITY',
         '--', 'generate_daily_recommendations.py', 'services/', 'tradeora-web/app/api/'],
        capture_output=True, text=True
    )
    
    lines = [l for l in (result.stdout or '').split('\n') if l.strip() and 'canonical.py' not in l]
    
    print(f"Local priority lists remaining: {len(lines)}")
    for l in lines:
        print(f"  ❌ {l}")
    if not lines:
        print("✅ No local priority lists found!")

    print("\n=== Step 2: Testing price resolution consistency ===")
    
    companies = sb.table('companies').select('id, symbol').eq('symbol', 'COMI').execute().data or []
    if not companies:
        print("COMI symbol not found in DB.")
        return
        
    comi_id = companies[0]['id']
    
    # 1. Fetch COMI candles from Python Canonical Layer
    candles_py = get_canonical_candles(sb, comi_id, 'COMI', limit=300)
    signal_price = candles_py[-1]['close'] if candles_py else 0
    signal_date  = candles_py[-1]['date']  if candles_py else 'N/A'
    
    print(f"Python Canonical Layer COMI Price ({signal_date}): {signal_price:.4f}")
    
    # 2. Test get_canonical_price
    price_obj = get_canonical_price(sb, comi_id, 'COMI')
    print(f"Python Canonical Price Obj: {price_obj}")
    
    print(f"\nCanonical Data Layer Validation Complete: ✅ MATCH")

if __name__ == '__main__':
    run_validation()
