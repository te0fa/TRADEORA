"""Inspect EGX page HTML to find API endpoints and PDF download patterns"""
import httpx, re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'ar,en;q=0.9',
}

# Get the main page HTML
r = httpx.get('https://www.egx.com.eg/ar/Services_Reports.aspx', headers=headers, timeout=15, follow_redirects=True)
html = r.text
print(f"Status: {r.status_code}, Size: {len(html)} chars")
print("\n=== FULL HTML ===")
print(html[:5000])

# Look for API endpoints, JS files, or PDF references
print("\n=== JS/API References ===")
patterns = [
    r'src=["\']([^"\']*\.js[^"\']*)["\']',
    r'href=["\']([^"\']*\.pdf[^"\']*)["\']',
    r'api["\'\s:/]+([^"\'>\s]+)',
    r'download["\'\s:/]+([^"\'>\s]+)',
    r'(https?://[^"\'\s>]+\.pdf)',
]
for pat in patterns:
    matches = re.findall(pat, html, re.IGNORECASE)
    if matches:
        print(f"\nPattern '{pat[:30]}':")
        for m in matches[:5]:
            print(f"  {m}")
