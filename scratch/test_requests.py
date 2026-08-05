import requests
from bs4 import BeautifulSoup

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
}

s = requests.Session()
s.headers.update(headers)

print("1. Requesting Home.aspx...")
r1 = s.get('https://www.egx.com.eg/ar/Home.aspx', timeout=15)
print("Home status:", r1.status_code)

print("2. Requesting InvestorsTypeCharts.aspx...")
r2 = s.get('https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx', timeout=15)
print("InvestorsTypeCharts status:", r2.status_code, "length:", len(r2.text))

soup = BeautifulSoup(r2.text, 'lxml')
tables = soup.find_all('table')
print("Tables count:", len(tables))
for i, t in enumerate(tables):
    print(f"Table {i}:", len(t.find_all('tr')), "rows")
    for r in t.find_all('tr')[:5]:
        print("  ", [c.get_text(strip=True) for c in r.find_all(['td', 'th'])])
