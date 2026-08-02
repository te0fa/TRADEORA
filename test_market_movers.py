import os
from supabase import create_client

sb = create_client(os.getenv('NEXT_PUBLIC_SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

# Fetch active companies
companies_res = sb.table('companies').select('id, symbol, name_ar, sector').eq('status', 'active').execute()
companies = companies_res.data or []
print(f"Companies: {len(companies)}")

# Fetch prices (without symbol column!)
prices_res = sb.table('market_prices').select('company_id, open_price, close_price, high_price, low_price, volume, price_date').order('price_date', desc=True).limit(5000).execute()
prices = prices_res.data or []
print(f"Prices fetched: {len(prices)}")

price_map = {}
for p in prices:
    cid = p['company_id']
    if cid not in price_map:
        price_map[cid] = p

stock_list = []
for co in companies:
    p = price_map.get(co['id'])
    if not p:
        continue
    op = float(p.get('open_price') or 0)
    cl = float(p.get('close_price') or 0)
    vol = float(p.get('volume') or 0)
    if cl <= 0:
        continue
    
    chg = ((cl - op) / op * 100) if op > 0 else 0
    stock_list.append({
        'id': co['id'],
        'symbol': co['symbol'],
        'name_ar': co.get('name_ar') or co['symbol'],
        'sector': co.get('sector') or 'عام',
        'price': cl,
        'change_pct': round(chg, 2),
        'volume': vol,
        'turnover_egp': round(cl * vol, 0),
        'price_date': p['price_date'],
    })

print(f"Total analyzed stocks: {len(stock_list)}")

gainers = sorted(stock_list, key=lambda x: x['change_pct'], reverse=True)[:9]
losers = sorted(stock_list, key=lambda x: x['change_pct'])[:9]
act_vol = sorted(stock_list, key=lambda x: x['volume'], reverse=True)[:9]
act_val = sorted(stock_list, key=lambda x: x['turnover_egp'], reverse=True)[:9]

print("\nTOP GAINERS:")
for g in gainers[:5]:
    print(f"  {g['symbol']:6} | close={g['price']:6.2f} | change={g['change_pct']:+6.2f}% | vol={g['volume']}")

print("\nMOST ACTIVE VOLUME:")
for v in act_vol[:5]:
    print(f"  {v['symbol']:6} | close={v['price']:6.2f} | vol={v['volume']}")
