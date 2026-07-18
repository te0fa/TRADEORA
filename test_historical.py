"""Check historical OHLC data availability in Supabase for candlestick charts."""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
sb = create_client(url, key)

# Get ARAB company id
comp = sb.table("companies").select("id,symbol").eq("symbol", "ARAB").single().execute()
company_id = comp.data["id"]
print(f"ARAB company_id: {company_id}\n")

# Count all records per source
for source in ["egx_bulletin", "tradingview", "intraday_consensus"]:
    res = sb.table("market_prices").select("id", count="exact") \
        .eq("company_id", company_id).eq("source", source).execute()
    print(f"  {source:25s}: {res.count} records")

print()

# Get sample of egx_bulletin records with OHLC
res = sb.table("market_prices").select(
    "price_date,open_price,high_price,low_price,close_price,volume,source"
).eq("company_id", company_id).eq("source", "egx_bulletin") \
 .order("price_date", desc=True).limit(5).execute()

print("Latest egx_bulletin OHLC records:")
for r in res.data:
    print(f"  {r['price_date']}: O={r['open_price']} H={r['high_price']} L={r['low_price']} C={r['close_price']} V={r['volume']}")

# Check tradingview OHLC
res2 = sb.table("market_prices").select(
    "price_date,open_price,high_price,low_price,close_price,volume"
).eq("company_id", company_id).eq("source", "tradingview") \
 .order("price_date", desc=True).limit(5).execute()

print("\nLatest tradingview OHLC records:")
for r in res2.data:
    print(f"  {r['price_date']}: O={r['open_price']} H={r['high_price']} L={r['low_price']} C={r['close_price']} V={r['volume']}")

# Date range check
res3 = sb.table("market_prices").select("price_date") \
    .eq("company_id", company_id) \
    .order("price_date", desc=False).limit(1).execute()
res4 = sb.table("market_prices").select("price_date") \
    .eq("company_id", company_id) \
    .order("price_date", desc=True).limit(1).execute()

if res3.data and res4.data:
    print(f"\nDate range: {res3.data[0]['price_date']} → {res4.data[0]['price_date']}")

# Total unique dates
res5 = sb.table("market_prices").select("price_date", count="exact") \
    .eq("company_id", company_id).execute()
print(f"Total records all sources: {res5.count}")
