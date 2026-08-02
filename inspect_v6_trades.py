import os
from supabase import create_client

sb = create_client(os.getenv('NEXT_PUBLIC_SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

LAUNCH_DATE = '2026-07-30T00:00:00+00:00'

# Fetch post-launch v6 trades
res = sb.table('recommended_trades').select('id, symbol, direction, entry_price, tp1, tp2, sl, ml_probability, status, exit_reason, recommended_at, features_snapshot').gte('recommended_at', LAUNCH_DATE).execute()
data = res.data or []

print(f"Total post-launch (v6) trades: {len(data)}")

v6_active = [t for t in data if t['status'] == 'active']
v6_closed = [t for t in data if t['status'] == 'closed']

print(f"Active v6 trades: {len(v6_active)}")
print(f"Closed v6 trades: {len(v6_closed)}")

# Check confidence probabilities
high_conf = [t for t in data if float(t.get('ml_probability') or 0) >= 0.65]
print(f"High confidence (>= 0.65) v6 trades: {len(high_conf)}")

# Sample high confidence trades
print("\nSample v6 High Confidence Trades:")
for t in high_conf[:10]:
    print(f"  {t['symbol']:6} | {t['direction']:4} | prob={float(t['ml_probability']):.2f} | status={t['status']} | date={t['recommended_at'][:10]}")
