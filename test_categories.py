import os
from supabase import create_client

sb = create_client(os.getenv('NEXT_PUBLIC_SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

# Check existing data counts
tables = ['companies', 'market_prices', 'company_news', 'corporate_events',
          'daily_investor_flows', 'sector_investor_flows', 'recommended_trades',
          'insider_trading', 'market_snapshots']

print("=== TABLE ROW COUNTS ===")
for t in tables:
    try:
        r = sb.table(t).select('*', count='exact', head=True).execute()
        print(f"  {t}: {r.count} rows")
    except Exception as e:
        print(f"  {t}: ERROR - {str(e)[:60]}")

# Test with url field
print("\n=== TESTING VALID CATEGORIES (with url) ===")
for cat in ['corporate', 'macro_fx', 'sector', 'geopolitical', 'earnings', 'dividend',
            'banking', 'real_estate', 'telecom', 'economic', 'market', 'technical',
            'political', 'company', 'egx', 'financial', 'global']:
    try:
        t = sb.table('company_news').insert({
            'title': 'test cat ' + cat,
            'content': 'test',
            'category': cat,
            'sentiment': 'positive',
            'source': 'egx',
            'url': 'https://test.com/' + cat,
            'published_at': '2026-08-02T00:00:00Z'
        }).execute()
        print(f"  {cat}: ✅ OK")
        if t.data:
            sb.table('company_news').delete().eq('id', t.data[0]['id']).execute()
    except Exception as e:
        msg = str(e)[:120]
        if 'chk_news_category' in msg:
            print(f"  {cat}: ❌ INVALID CATEGORY")
        else:
            print(f"  {cat}: ✅ OK (other error: {msg[:60]})")
