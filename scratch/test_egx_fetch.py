import httpx, time

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': 'https://www.egx.com.eg/ar/Home.aspx',
}

client = httpx.Client(headers=headers, follow_redirects=True, timeout=20.0, verify=False)
try:
    print("Fetching Home.aspx...")
    r1 = client.get('https://www.egx.com.eg/ar/Home.aspx')
    print("Home status:", r1.status_code, "cookies:", dict(client.cookies))
    time.sleep(2)
    print("Fetching InvestorsTypeCharts.aspx...")
    r2 = client.get('https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx')
    print("InvestorsTypeCharts status:", r2.status_code)
    html = r2.text
    print("HTML length:", len(html))
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, 'lxml')
    tables = soup.find_all('table')
    print("Found tables:", len(tables))
    for i, t in enumerate(tables):
        rows = t.find_all('tr')
        print(f"Table {i}: {len(rows)} rows")
        for r in rows[:5]:
            cells = [c.get_text(strip=True) for c in r.find_all(['td', 'th'])]
            print("  ", cells)
except Exception as e:
    print("Error:", e)
