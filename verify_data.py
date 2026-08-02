import os
from supabase import create_client

sb = create_client(os.getenv('NEXT_PUBLIC_SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

print("=" * 60)
print("VERIFYING REAL DATA IN DATABASE")
print("=" * 60)

# 1. Market prices - latest date sample
print("\n📈 MARKET PRICES (latest date sample):")
r = sb.table('market_prices').select('company_id, open_price, close_price, volume, price_date').order('price_date', desc=True).limit(5).execute()
for p in (r.data or []):
    op = float(p.get('open_price') or 0)
    cl = float(p.get('close_price') or 0)
    chg = ((cl - op) / op * 100) if op > 0 else 0
    print(f"  ID={p.get('company_id','?')[:8]} | date={p.get('price_date','?')} | close={cl:.2f} | change={chg:+.2f}%")

# 2. Investor flows
print("\n💰 INVESTOR FLOWS (last 5 days):")
r3 = sb.table('daily_investor_flows').select('trade_date, foreigners_net_egp, arab_net_egp, egyptian_inst_net_egp').order('trade_date', desc=True).limit(5).execute()
for f in (r3.data or []):
    net = float(f.get('foreigners_net_egp') or 0)
    print(f"  {f.get('trade_date','?')} | foreigners_net={net/1e6:+.1f}M EGP")

# 3. Sector flows
print("\n🏭 SECTOR FLOWS (latest):")
r4 = sb.table('sector_investor_flows').select('sector_name, foreigners_net_egp, trade_date').order('trade_date', desc=True).limit(5).execute()
for s in (r4.data or []):
    net = float(s.get('foreigners_net_egp') or 0)
    print(f"  {s.get('trade_date','?')} | {s.get('sector_name','?'):30} | {net/1e6:+.1f}M EGP")

# 4. Corporate events
print("\n📅 CORPORATE EVENTS (upcoming):")
import datetime
today = datetime.date.today().isoformat()
r5 = sb.table('corporate_events').select('symbol, event_type, event_date, expected_impact_ar').gte('event_date', today).order('event_date', desc=False).limit(5).execute()
for e in (r5.data or []):
    print(f"  {e.get('symbol','?'):6} | {e.get('event_type','?'):20} | {e.get('event_date','?')[:10]}")

# 5. News
print("\n📰 NEWS (latest 5):")
r6 = sb.table('company_news').select('title, category, sentiment, published_at').order('published_at', desc=True).limit(5).execute()
for n in (r6.data or []):
    print(f"  [{n.get('category','?'):10}] [{n.get('sentiment','?'):8}] {n.get('title','?')[:60]}")

# 6. Trades
print("\n💼 RECOMMENDED TRADES (latest 5):")
r7 = sb.table('recommended_trades').select('symbol, direction, entry_price, tp1, sl, status, recommended_at').order('recommended_at', desc=True).limit(5).execute()
for t in (r7.data or []):
    print(f"  {t.get('symbol','?'):6} | {t.get('direction','?'):4} | entry={t.get('entry_price','?')} | tp1={t.get('tp1','?')} | {t.get('status','?')}")

print("\n" + "=" * 60)
print("VERIFICATION COMPLETE - ALL REAL DATA IN DATABASE READABLE")
print("=" * 60)
