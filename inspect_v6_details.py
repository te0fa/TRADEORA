import os
from supabase import create_client

sb = create_client(os.getenv('NEXT_PUBLIC_SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

res = sb.table('recommended_trades').select('id, symbol, direction, entry_price, tp1, tp2, sl, ml_probability, status, recommended_at, features_snapshot, companies(name_ar, sector)').execute()
trades = res.data or []

print(f"Total v6 trades: {len(trades)}")

buys = [t for t in trades if (t.get('direction') or 'buy').lower() == 'buy']
sells = [t for t in trades if (t.get('direction') or '').lower() == 'sell']

print(f"v6 BUY trades: {len(buys)}")
print(f"v6 SELL trades: {len(sells)}")

# High confidence buys (ml_probability >= 0.70)
high_buys = [t for t in buys if float(t.get('ml_probability') or 0) >= 0.70]
print(f"v6 High-Confidence BUY trades (prob >= 0.70): {len(high_buys)}")

print("\nTop 15 High Confidence v6 BUY Trades:")
for t in high_buys[:15]:
    cname = t.get('companies', {}).get('name_ar') if t.get('companies') else t['symbol']
    print(f"  {t['symbol']:6} | {cname:25} | prob={float(t['ml_probability']):.2f} | entry={t['entry_price']} | tp1={t['tp1']} | sl={t['sl']}")
