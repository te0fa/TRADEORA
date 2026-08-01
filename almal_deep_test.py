"""Deep dive into AlMal newspaper for EGX investor flow data"""
import httpx, re
from bs4 import BeautifulSoup

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/html, */*',
    'Accept-Language': 'ar,en;q=0.9',
    'Referer': 'https://almalnews.com',
}

INVESTOR_KW = ['أجانب', 'مؤسسات', 'أفراد', 'صافي شراء', 'صافي بيع', 'تعاملات', 'عرب']

# Test AlMal endpoints
almal_urls = [
    'https://almalnews.com/category/بورصة/',
    'https://almalnews.com/category/بورصة/تعاملات/',
    'https://almalnews.com/ar/markets/egx',
    'https://almalnews.com/egx-market-summary',
    # Try their API
    'https://almalnews.com/api/markets/EGX',
    'https://almalnews.com/api/news?category=egx&size=10',
    'https://almalnews.com/_next/data/buildId/ar/markets.json',
]

print("=== AlMal Deep Test ===\n")
for url in almal_urls:
    try:
        r = httpx.get(url, headers=headers, timeout=12, follow_redirects=True)
        size = len(r.text)
        hits = [k for k in INVESTOR_KW if k in r.text]
        print(f"{'✅' if r.status_code==200 and size>500 else '❌'} {r.status_code} ({size:,}): {url}")
        if hits:
            print(f"   🎯 Keywords: {hits}")
            # Extract numbers near keywords
            for kw in hits[:2]:
                idx = r.text.find(kw)
                if idx > 0:
                    context = r.text[max(0,idx-50):idx+200]
                    print(f"   Context for '{kw}': ...{context.strip()[:200]}...")
    except Exception as e:
        print(f"❌ Error ({type(e).__name__}): {url}")

# Also search for daily market summary articles on AlMal
print("\n=== Searching AlMal for today's EGX summary ===")
try:
    r = httpx.get('https://almalnews.com/', headers=headers, timeout=12, follow_redirects=True)
    soup = BeautifulSoup(r.text, 'html.parser')

    # Find articles with investor/market keywords
    for tag in soup.find_all(['a', 'h2', 'h3'], string=True):
        text = tag.get_text().strip()
        if any(k in text for k in ['تعاملات', 'بورصة', 'أجانب', 'مؤشر']):
            href = tag.get('href', '') if tag.name == 'a' else ''
            print(f"  Article: {text[:80]}")
            if href:
                print(f"  URL: {href}")
except Exception as e:
    print(f"Error: {e}")

# Try Sarmady - another Egyptian financial platform
print("\n=== Sarmady Test ===")
for url in [
    'https://www.sarmady.com/finance/stocks/markets/',
    'https://api.sarmady.com/api/markets/EGX/investors',
    'https://www.sarmady.com/finance/stocks/markets/daily-summary/',
]:
    try:
        r = httpx.get(url, headers=headers, timeout=10, follow_redirects=True)
        hits = [k for k in INVESTOR_KW if k in r.text]
        print(f"{'✅' if r.status_code==200 and hits else '❌'} {r.status_code} ({len(r.text):,}): {url} {'🎯 '+str(hits) if hits else ''}")
    except Exception as e:
        print(f"❌ {type(e).__name__}: {url}")
