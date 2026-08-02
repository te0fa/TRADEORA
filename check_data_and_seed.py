import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
sb = create_client(url, key)

tables = ['daily_investor_flows', 'sector_investor_flows', 'corporate_events', 'insider_trading', 'volume_profiles', 'company_news', 'company_fundamentals']
for t in tables:
    try:
        res = sb.table(t).select('*', count='exact').limit(1).execute()
        print(f"Table {t}: {res.count} rows")
    except Exception as e:
        print(f"Table {t}: ERROR {e}")
