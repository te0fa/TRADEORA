"""Test alternative sources for EGX investor flow data"""
import httpx

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/html, */*',
    'Accept-Language': 'ar,en;q=0.9',
}

# Keywords to look for in responses
INVESTOR_KW = ['أجانب', 'foreigners', 'مستثمر', 'صافي شراء', 'صافي بيع', 'investor', 'net buy', 'net sell', 'تعاملات']

sources = [
    # Argaam - major MENA financial platform
    ('Argaam-EGX',    'https://www.argaam.com/ar/article/articlelist/market/1'),
    ('Argaam-API',    'https://www.argaam.com/api/v1/markets/1/summary'),
    ('Argaam-flows',  'https://www.argaam.com/ar/article/investorTypes/market/1'),
    # AlBorsa - Egyptian finance news
    ('AlBorsa',       'https://www.alborsa.net/ar/article/articlelist/section/8'),
    ('AlBorsa-API',   'https://www.alborsa.net/api/markets/EGX/investors'),
    # Masrawy Finance
    ('Masrawy',       'https://finance.masrawy.com/egx/market-summary'),
    # Al-Mal newspaper
    ('AlMal',         'https://almalnews.com/category/بورصة/'),
    # EGX on Investing.com
    ('Investing-EGX', 'https://api.investing.com/api/financialdata/instruments/27579/historical/chart/?period=P1D&interval=PT1M&pointscount=60'),
    # Arab Monetary Fund stats
    ('AMF',           'https://www.amf.org.ae/api/markets/EGX/data'),
]

print("Testing alternative EGX investor data sources...\n")
for name, url in sources:
    try:
        r = httpx.get(url, headers=headers, timeout=12, follow_redirects=True)
        size = len(r.text)
        hits = [k for k in INVESTOR_KW if k.lower() in r.text.lower()]
        status_icon = '✅' if r.status_code == 200 and size > 500 else '❌'
        kw_icon = '🎯' if hits else ''
        print(f"{status_icon} {name}: {r.status_code} ({size:,} chars) {kw_icon}")
        if hits:
            print(f"   Keywords: {hits}")
            print(f"   Preview: {r.text[:400]}")
        elif r.status_code == 200 and size > 500:
            print(f"   Preview: {r.text[:200]}")
    except Exception as e:
        print(f"❌ {name}: {type(e).__name__}")
