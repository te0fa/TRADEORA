"""Check market_sources table structure"""
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()
url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
sb = create_client(url, key)

res = sb.table('market_sources').select('*').limit(20).execute()
print("=== market_sources rows ===")
for r in res.data:
    print(r)
