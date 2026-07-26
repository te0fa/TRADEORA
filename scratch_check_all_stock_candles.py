import os
from dotenv import load_dotenv
load_dotenv()
from supabase import create_client

url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
sb = create_client(url, key)

# Fetch active companies
comps = sb.table('companies').select('id, symbol, name_ar').eq('status', 'active').execute().data or []
print(f"Total active companies: {len(comps)}")

# Check intraday_snapshots count grouped by source
for ivl in ['15m', '30m', '1h', '4h']:
    res = sb.table('intraday_snapshots').select('id', count='exact').eq('source', f'tradingview_{ivl}').limit(1).execute()
    print(f"Intraday snapshots ({ivl}): count = {res.count}")

# Check sample companies missing candles
missing_15m = []
missing_1d = []

for c in comps[:30]:
    sym = c['symbol']
    cid = c['id']
    
    # 15m check
    res15 = sb.table('intraday_snapshots').select('id', count='exact').eq('company_id', cid).eq('source', 'tradingview_15m').limit(1).execute()
    cnt15 = res15.count or 0
    
    # 1d check in market_prices
    res1d = sb.table('market_prices').select('id', count='exact').eq('company_id', cid).limit(1).execute()
    cnt1d = res1d.count or 0
    
    print(f"Symbol: {sym:<8} | 15m candles: {cnt15:<5} | 1d market_prices: {cnt1d:<5}")
    if cnt15 < 100:
        missing_15m.append(sym)
    if cnt1d < 50:
        missing_1d.append(sym)

print("\nSample missing 15m (< 100):", len(missing_15m), missing_15m)
print("Sample missing 1d (< 50):", len(missing_1d), missing_1d)
