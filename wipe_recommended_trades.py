import os
from supabase import create_client

sb = create_client(os.getenv('NEXT_PUBLIC_SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

print("Truncating recommended_trades table completely...")

# Delete all rows from recommended_trades
res = sb.table('recommended_trades').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
print(f"Deleted rows: {len(res.data or [])}")

# Verify row count is 0
count = sb.table('recommended_trades').select('*', count='exact', head=True).execute().count
print(f"Current row count in recommended_trades: {count}")
