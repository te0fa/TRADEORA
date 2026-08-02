import os
from supabase import create_client

sb = create_client(os.getenv('NEXT_PUBLIC_SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

# Check recommended_trades
res = sb.table('recommended_trades').select('id, symbol, direction, status, recommended_at, exit_reason').limit(10).execute()
print("RECOMMENDED_TRADES sample:")
for r in (res.data or []):
    print(r)

# Check count of active and closed trades
active_cnt = sb.table('recommended_trades').select('*', count='exact', head=True).eq('status', 'active').execute().count
closed_cnt = sb.table('recommended_trades').select('*', count='exact', head=True).eq('status', 'closed').execute().count
total_cnt = sb.table('recommended_trades').select('*', count='exact', head=True).execute().count

print(f"\nTotal trades in DB: {total_cnt}")
print(f"Active trades in DB: {active_cnt}")
print(f"Closed trades in DB: {closed_cnt}")

# Check with LAUNCH_DATE '2026-07-30T00:00:00+00:00'
LAUNCH_DATE = '2026-07-30T00:00:00+00:00'
post_launch_cnt = sb.table('recommended_trades').select('*', count='exact', head=True).gte('recommended_at', LAUNCH_DATE).execute().count
print(f"Post-launch trades (gte {LAUNCH_DATE}): {post_launch_cnt}")
