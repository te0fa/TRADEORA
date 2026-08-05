from curl_cffi import requests
from bs4 import BeautifulSoup
import re

session = requests.Session(impersonate="chrome124")

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': 'https://www.google.com/',
}

print("Fetching InvestorsTypeCharts.aspx with curl_cffi chrome124...")
res = session.get("https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx", headers=headers, timeout=25)
print("Status:", res.status_code, "Length:", len(res.text))

soup = BeautifulSoup(res.text, "lxml")
tables = soup.find_all("table")
print("Tables count:", len(tables))

for i, t in enumerate(tables):
    rows = t.find_all("tr")
    print(f"\n--- Table #{i} ({len(rows)} rows) ---")
    for r in rows[:6]:
        cells = [c.get_text(strip=True) for c in r.find_all(["td", "th"])]
        print("  ", cells)
