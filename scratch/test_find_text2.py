from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    try:
        browser = p.chromium.launch(channel='chrome', headless=True)
    except Exception:
        browser = p.chromium.launch(headless=True)

    context = browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        locale='ar-EG',
        viewport={'width': 1920, 'height': 1080}
    )
    page = context.new_page()

    page.goto('https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx', timeout=45000, wait_until='commit')

    content = ""
    for attempt in range(1, 20):
        time.sleep(1)
        try:
            c = page.content()
            if 'مصري' in c or 'أفراد' in c or '33,197' in c:
                content = c
                print(f"✅ Found flow data content on attempt {attempt}!")
                break
            else:
                print(f"Attempt {attempt}: length={len(c)}, title='{page.title()}'")
        except Exception as e:
            print(f"Attempt {attempt} navigation in progress: {e}")

    if content:
        with open("scratch/page_full.html", "w", encoding="utf-8") as f:
            f.write(content)
        print("Saved full HTML to scratch/page_full.html!")

        from bs4 import BeautifulSoup
        soup = BeautifulSoup(content, 'lxml')
        tables = soup.find_all('table')
        print(f"Found {len(tables)} tables!")
        for i, t in enumerate(tables):
            rows = t.find_all('tr')
            print(f"\n--- Table {i} ({len(rows)} rows) ---")
            for r in rows[:6]:
                cells = [c.get_text(strip=True) for c in r.find_all(['td', 'th'])]
                print("  ", cells)
    else:
        print("❌ Could not get populated HTML content")

    browser.close()
