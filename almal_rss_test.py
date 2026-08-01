"""Try AlMal RSS feed and Next.js data API"""
import httpx, re, json
from bs4 import BeautifulSoup

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': '*/*',
}

# Try RSS feeds
rss_urls = [
    'https://almalnews.com/feed',
    'https://almalnews.com/feed/',
    'https://almalnews.com/rss',
    'https://almalnews.com/rss.xml',
    'https://almalnews.com/category/بورصة/feed',
    'https://almalnews.com/category/stocks/1/feed',
]

INVESTOR_KW = ['أجانب', 'مؤسسات', 'صافي', 'شراء', 'بيع', 'تعاملات', 'فئات المستثمرين']

print("=== RSS Feed Tests ===")
for url in rss_urls:
    try:
        r = httpx.get(url, headers=headers, timeout=10, follow_redirects=True)
        hits = [k for k in INVESTOR_KW if k in r.text]
        print(f"{'✅' if r.status_code==200 and '<rss' in r.text else '❌'} {r.status_code} ({len(r.text):,}): {url}")
        if '<rss' in r.text or '<feed' in r.text:
            soup = BeautifulSoup(r.text, 'xml')
            items = soup.find_all('item') or soup.find_all('entry')
            print(f"   Items found: {len(items)}")
            for item in items[:5]:
                title = item.find('title')
                link  = item.find('link')
                print(f"   • {title.text if title else ''}")
                print(f"     {link.text if link else ''}")
    except Exception as e:
        print(f"❌ {type(e).__name__}: {url}")

# Try to get Next.js build ID from HTML
print("\n=== Next.js Build ID ===")
try:
    r = httpx.get('https://almalnews.com/', headers=headers, timeout=12, follow_redirects=True)
    # Find __NEXT_DATA__ or buildId
    build_match = re.search(r'"buildId":"([^"]+)"', r.text)
    if build_match:
        build_id = build_match.group(1)
        print(f"Build ID: {build_id}")

        # Try to get article data via Next.js API
        article_id = '2127192'  # Market summary article
        next_urls = [
            f'https://almalnews.com/_next/data/{build_id}/ar/{article_id}.json',
            f'https://almalnews.com/_next/data/{build_id}/{article_id}.json',
        ]
        for nurl in next_urls:
            try:
                nr = httpx.get(nurl, headers=headers, timeout=10)
                print(f"  {nr.status_code} ({len(nr.text):,}): {nurl}")
                if nr.status_code == 200 and nr.text:
                    data = nr.json()
                    print(f"  Keys: {list(data.keys()) if isinstance(data, dict) else type(data)}")
            except Exception as e:
                print(f"  Error: {e}")
    else:
        print("No buildId found in page")
        # Try to find API URLs in the JS
        api_matches = re.findall(r'["\'](https?://[^"\']*api[^"\']*)["\']', r.text)
        print(f"API URLs found: {api_matches[:10]}")
except Exception as e:
    print(f"Error: {e}")
