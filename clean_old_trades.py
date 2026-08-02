import os
from supabase import create_client

sb = create_client(os.getenv('NEXT_PUBLIC_SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

LAUNCH_DATE = '2026-07-30T00:00:00+00:00'

print("Cleaning pre-launch / old model trades from recommended_trades...")

# Delete pre-launch trades
res = sb.table('recommended_trades').delete().lt('recommended_at', LAUNCH_DATE).execute()
print(f"Deleted old trades (< {LAUNCH_DATE}): {len(res.data or [])}")

# Delete pre_launch_reset or backfill_estimate trades
res2 = sb.table('recommended_trades').delete().eq('exit_reason', 'pre_launch_reset').execute()
print(f"Deleted pre_launch_reset trades: {len(res2.data or [])}")

res3 = sb.table('recommended_trades').delete().eq('exit_reason', 'backfill_estimate').execute()
print(f"Deleted backfill_estimate trades: {len(res3.data or [])}")

# Check remaining count
remaining = sb.table('recommended_trades').select('*', count='exact', head=True).execute().count
print(f"\nRemaining v6 trades in DB: {remaining}")
