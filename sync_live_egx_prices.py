import os, json, urllib.request, datetime
from supabase import create_client

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or "https://kdjsguozssxvtmlmqhpz.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkanNndW96c3N4dnRtbG1xaHB6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzg3MzQwMywiZXhwIjoyMDk5NDQ5NDAzfQ.sCyCHFnLo7MWKeUmAb6s5j0zT5PzNBBnVAls1LcPclM"

sb = create_client(SUPABASE_URL, SUPABASE_KEY)
today_str = datetime.date.today().isoformat()

print(f"⚡ Syncing real-time TradingView EGX quotes for {today_str}...")

# 1. Load company symbols map from Supabase
comp_res = sb.table("companies").select("id, symbol").execute()
companies = comp_res.data or []
symbol_to_id = {c["symbol"].upper(): c["id"] for c in companies}
print(f"  ✓ Loaded {len(symbol_to_id)} company mappings.")

# 2. Fetch live EGX quotes from TradingView Scanner API
url = 'https://scanner.tradingview.com/egypt/scan'
payload = {
    'filter': [{'left': 'type', 'operation': 'in_range', 'right': ['stock', 'dr', 'fund']}],
    'options': {'lang': 'en'},
    'symbols': {'query': {'types': []}, 'tickers': []},
    'columns': ['name', 'description', 'close', 'change', 'change_abs', 'open', 'high', 'low', 'volume', 'value'],
    'sort': {'sortBy': 'change', 'sortOrder': 'desc'},
    'range': [0, 350]
}

req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'User-Agent': 'Mozilla/5.0'})
tv_quotes = []

try:
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        tv_quotes = res.get('data', [])
        print(f"  ✓ Fetched {len(tv_quotes)} live quotes from TradingView Scanner API.")
except Exception as e:
    print("❌ Error fetching TradingView Scanner API:", e)
    exit(1)

records_to_insert = []
for item in tv_quotes:
    d = item['d']
    raw_sym = str(d[0]).upper()
    close_price = float(d[2] or 0)
    open_price = float(d[5] or close_price)
    high_price = float(d[6] or close_price)
    low_price = float(d[7] or close_price)
    volume = int(float(d[8] or 0))

    if raw_sym in symbol_to_id and close_price > 0:
        cid = symbol_to_id[raw_sym]
        records_to_insert.append({
            "company_id": cid,
            "price_date": today_str,
            "open_price": open_price,
            "high_price": high_price,
            "low_price": low_price,
            "close_price": close_price,
            "volume": volume,
            "source": "tradingview"
        })

print(f"  ⚡ Updating {len(records_to_insert)} live market prices into database...")

# Delete today's price records first to ensure clean insertion
sb.table("market_prices").delete().eq("price_date", today_str).execute()

# Insert in chunks of 50
inserted_count = 0
for i in range(0, len(records_to_insert), 50):
    chunk = records_to_insert[i:i+50]
    res = sb.table("market_prices").insert(chunk).execute()
    if res.data:
        inserted_count += len(res.data)

print(f"🎉 Successfully synced {inserted_count} live EGX price records for {today_str}!")
