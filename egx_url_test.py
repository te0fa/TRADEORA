"""Test EGX direct access and PDF URL patterns"""
import httpx
from datetime import date

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ar,en;q=0.9',
}

# Test EGX main page
for test_url in [
    'https://www.egx.com.eg',
    'https://www.egx.com.eg/ar/Services_Reports.aspx',
]:
    try:
        r = httpx.get(test_url, headers=headers, timeout=15, follow_redirects=True)
        print(f'GET {r.status_code}: {test_url}  ({len(r.text)} chars)')
        if r.status_code == 200 and len(r.text) > 100:
            print(f'  Content preview: {r.text[:200]}')
    except Exception as e:
        print(f'ERROR: {type(e).__name__}: {e}  → {test_url}')

# Test direct PDF URL patterns for last Thursday
d = date(2026, 7, 31)
date_str = d.strftime('%Y%m%d')
pdf_urls = [
    f'https://www.egx.com.eg/ar/PDF/Daily/DailyDataFile_AR_{date_str}.pdf',
    f'https://www.egx.com.eg/Files/Daily/DailyData_{date_str}.pdf',
    f'https://www.egx.com.eg/ar/download/DailyDataFile_AR.pdf',
    'https://www.egx.com.eg/ar/PDF/Daily/DailyDataFile_AR.pdf',
]

print('\n--- Testing direct PDF URLs ---')
for url in pdf_urls:
    try:
        r = httpx.head(url, headers=headers, timeout=10, follow_redirects=True)
        print(f'{r.status_code}: {url}')
    except Exception as e:
        print(f'ERR ({type(e).__name__}): {url}')
