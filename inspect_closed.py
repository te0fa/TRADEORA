import os
from supabase import create_client

sb = create_client(os.getenv('NEXT_PUBLIC_SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

# Query all closed trades
res = sb.table('recommended_trades').select('id, symbol, direction, entry_price, tp1, sl, pnl_percent, status, exit_reason, recommended_at, closed_at').eq('status', 'closed').limit(20).execute()
print("Closed trades sample:")
for r in (res.data or []):
    print(r)

# Check count of closed trades grouped by exit_reason
res_all = sb.table('recommended_trades').select('exit_reason, pnl_percent, direction').eq('status', 'closed').execute()
data = res_all.data or []
print(f"\nTotal closed trades in DB: {len(data)}")

reasons = {}
for r in data:
    er = r.get('exit_reason') or 'NONE'
    reasons[er] = reasons.get(er, 0) + 1

print("\nClosed trades by exit_reason:")
for k, v in reasons.items():
    print(f"  {k}: {v}")

pnls = [float(r['pnl_percent']) for r in data if r.get('pnl_percent') is not null] if False else [float(r['pnl_percent']) for r in data if r.get('pnl_percent') is not None]
wins = [p for p in pnls if p > 0]
losses = [p for p in pnls if p < 0]
print(f"\nPnLs count: {len(pnls)}, Wins: {len(wins)}, Losses: {len(losses)}")
if len(pnls) > 0:
    print(f"Win rate: {len(wins)/len(pnls)*100:.1f}%, Total PnL: {sum(pnls):.1f}%")
