import time

try:
    from curl_cffi import requests
    print("Testing curl_cffi...")
    
    session = requests.Session(impersonate="chrome120")
    
    print("Fetching Home.aspx...")
    r1 = session.get("https://www.egx.com.eg/ar/Home.aspx", timeout=20)
    print("Home status:", r1.status_code)
    
    time.sleep(2)
    
    print("Fetching InvestorsTypeCharts.aspx...")
    r2 = session.get("https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx", timeout=20)
    print("InvestorsTypeCharts status:", r2.status_code)
    print("HTML length:", len(r2.text))
    
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(r2.text, "lxml")
    tables = soup.find_all("table")
    print("Found tables:", len(tables))
    for i, t in enumerate(tables):
        rows = t.find_all("tr")
        print(f"Table {i}: {len(rows)} rows")
        for r in rows[:5]:
            cells = [c.get_text(strip=True) for c in r.find_all(["td", "th"])]
            print("  ", cells)

except Exception as e:
    print("curl_cffi test error:", e)
