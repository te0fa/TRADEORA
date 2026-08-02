import os
from supabase import create_client

sb = create_client(os.getenv('NEXT_PUBLIC_SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

# Total count
total_cnt = sb.table('recommended_trades').select('*', count='exact', head=True).execute().count
active_cnt = sb.table('recommended_trades').select('*', count='exact', head=True).eq('status', 'active').execute().count
closed_cnt = sb.table('recommended_trades').select('*', count='exact', head=True).eq('status', 'closed').execute().count

# Direction breakdown for active
active_buy = sb.table('recommended_trades').select('*', count='exact', head=True).eq('status', 'active').eq('direction', 'buy').execute().count
active_sell = sb.table('recommended_trades').select('*', count='exact', head=True).eq('status', 'active').eq('direction', 'sell').execute().count

# Check feature snapshot / model info sample
res = sb.table('recommended_trades').select('symbol, direction, ml_probability, features_snapshot, recommended_at').order('recommended_at', desc=True).limit(5).execute()

print(f"Total trades: {total_cnt}")
print(f"Active trades: {active_cnt} (Buy: {active_buy}, Sell: {active_sell})")
print(f"Closed trades: {closed_cnt}")
print("\nSample latest active trades:")
for r in (res.data or []):
    snap = r.get('features_snapshot') or {}
    model_ver = snap.get('model_version') or 'v6_ensemble'
    print(f"  {r.get('symbol')}: direction={r.get('direction')}, prob={r.get('ml_probability')}, model={model_ver}, date={r.get('recommended_at')[:10]}")
