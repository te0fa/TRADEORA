"""Create investor flow tables directly via Supabase REST API"""
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()
url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
sb = create_client(url, key)

# Test if table already exists
try:
    res = sb.table('daily_investor_flows').select('id').limit(1).execute()
    print('✅ Table daily_investor_flows already exists!')
except Exception as e:
    print(f'❌ Table does not exist: {e}')
    print('→ Please run the SQL manually in Supabase Dashboard → SQL Editor')
    print('  File: supabase/migrations/20260801_investor_flows.sql')

try:
    res = sb.table('sector_investor_flows').select('id').limit(1).execute()
    print('✅ Table sector_investor_flows already exists!')
except Exception as e:
    print(f'❌ Table does not exist: {e}')
    print('→ Please run the SQL manually in Supabase Dashboard → SQL Editor')
