"""Test EGX Mobile API - less protected than web"""
import httpx

# EGX mobile app API endpoints (reverse engineered from Android app)
mobile_headers = {
    'User-Agent': 'EGX/1.0 (Android; API 33)',
    'Accept': 'application/json',
    'Accept-Language': 'ar',
    'X-App-Platform': 'android',
}

web_headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
    'Accept': 'application/json, */*',
    'Referer': 'https://www.egx.com.eg/',
}

endpoints = [
    # EGX API patterns
    ('mobile', 'https://www.egx.com.eg/ar/api/MarketSummary'),
    ('mobile', 'https://www.egx.com.eg/api/investorTypes'),
    ('mobile', 'https://www.egx.com.eg/api/v1/marketData/investorTypes'),
    ('mobile', 'https://api.egx.com.eg/api/MarketSummary'),
    ('mobile', 'https://api.egx.com.eg/api/InvestorTypes'),
    # Known EGX data endpoints  
    ('web',    'https://www.egx.com.eg/ar/Listed-Securities_Market-Summary.aspx'),
    ('web',    'https://www.egx.com.eg/ar/MarketWatch.aspx'),
    # Try the reports page with AJAX headers
    ('ajax',   'https://www.egx.com.eg/ar/Services_Reports.aspx'),
]

for (mode, url) in endpoints:
    h = mobile_headers if mode == 'mobile' else web_headers
    if mode == 'ajax':
        h = {**web_headers, 'X-Requested-With': 'XMLHttpRequest', 'X-MicrosoftAjax': 'Delta=true'}
    try:
        r = httpx.get(url, headers=h, timeout=10, follow_redirects=True)
        size = len(r.text)
        print(f"[{mode}] {r.status_code} ({size:,} bytes): {url}")
        if r.status_code == 200 and size > 200 and size < 100000:
            # Check for useful content
            kw = ['investor', 'أجانب', 'foreign', 'net', 'daily', 'pdf', 'report']
            hits = [k for k in kw if k in r.text.lower()]
            if hits:
                print(f"  ✅ Keywords found: {hits}")
                print(f"  Preview: {r.text[:500]}")
    except Exception as e:
        print(f"[{mode}] ERROR ({type(e).__name__}): {url}")
