"""Test Mubasher API for EGX foreign investor flow data"""
import httpx, json, re
from datetime import date

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'ar,en;q=0.9',
    'Referer': 'https://www.mubasher.info/',
    'Origin': 'https://www.mubasher.info',
}

endpoints = [
    # News API
    'https://www.mubasher.info/api/1/news/search?country=eg&size=20',
    # Market summary
    'https://www.mubasher.info/api/1/markets/EGX/summary',
    # Investor breakdown
    'https://www.mubasher.info/api/1/markets/EGX/investors',
    # Arabic news
    'https://www.mubasher.info/api/news/search?market=EGX&size=10&lang=ar',
]

for url in endpoints:
    print(f"\n--- Testing: {url}")
    try:
        r = httpx.get(url, headers=headers, timeout=15, follow_redirects=True)
        print(f"Status: {r.status_code}, Size: {len(r.text)}")
        if r.status_code == 200 and len(r.text) > 50:
            try:
                data = r.json()
                print(f"JSON keys: {list(data.keys()) if isinstance(data, dict) else type(data)}")
                print(f"Preview: {str(data)[:300]}")
            except:
                print(f"Raw preview: {r.text[:300]}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")

# Also test Mubasher market data for EGX
print("\n--- Testing Mubasher market data URLs ---")
mubasher_urls = [
    'https://www.mubasher.info/markets/CASE',
    'https://mubasher.info/api/1/news/feed?country=EG&size=10',
    'https://www.mubasher.info/api/countries/EG/market-data',
]
for url in mubasher_urls:
    try:
        r = httpx.get(url, headers=headers, timeout=10, follow_redirects=True)
        print(f"Status {r.status_code} ({len(r.text)} chars): {url}")
        if r.status_code == 200 and r.text and len(r.text) > 100:
            # Look for investor keywords in response
            keywords = ['أجانب', 'foreigners', 'investor', 'مستثمر', 'صافي', 'net']
            found = [k for k in keywords if k.lower() in r.text.lower()]
            if found:
                print(f"  ✅ Contains keywords: {found}")
                print(f"  Preview: {r.text[:400]}")
    except Exception as e:
        print(f"ERROR ({type(e).__name__}): {url}")
