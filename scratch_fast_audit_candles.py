import os
from dotenv import load_dotenv
load_dotenv()
from supabase import create_client

url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
sb = create_client(url, key)

# Get all active companies
comps = sb.table('companies').select('id, symbol').eq('status', 'active').execute().data or []
print(f"Active companies total: {len(comps)}")

# Check intraday_snapshots count by source
for ivl in ['15m', '30m', '1h', '4h']:
    res = sb.table('intraday_snapshots').select('id', count='exact').eq('source', f'tradingview_{ivl}').limit(1).execute()
    print(f"Total {ivl} candles in DB: {res.count}")

# Check market_prices count (Daily)
res1d = sb.table('market_prices').select('id', count='exact').limit(1).execute()
print(f"Total Daily candles in market_prices: {res1d.count}")
