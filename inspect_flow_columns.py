import os
from supabase import create_client

sb = create_client(os.getenv('NEXT_PUBLIC_SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

# Inspect daily_investor_flows columns
res = sb.table('daily_investor_flows').select('*').limit(1).execute()
if res.data:
    print("Columns in daily_investor_flows:")
    for k in res.data[0].keys():
        print(f"  - {k}")
else:
    print("No data in daily_investor_flows")
