from playwright.sync_api import sync_playwright
import time
from bs4 import BeautifulSoup

with sync_playwright() as p:
    try:
        browser = p.chromium.launch(channel='chrome', headless=True)
        print("Using Chrome channel")
    except Exception:
        browser = p.chromium.launch(headless=True)
        print("Using Chromium")

    context = browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        locale='ar-EG',
        viewport={'width': 1920, 'height': 1080}
    )
    page = context.new_page()

    page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")

    print("Step 1: Home.aspx...")
    page.goto('https://www.egx.com.eg/ar/Home.aspx', timeout=30000, wait_until='domcontentloaded')
    time.sleep(3)

    print("Step 2: InvestorsTypeCharts.aspx...")
    page.goto('https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx', timeout=45000, wait_until='domcontentloaded')

    content = ""
    for attempt in range(1, 15):
        time.sleep(1)
        try:
            c = page.content()
            print(f"  Attempt {attempt}: length={len(c)}")
            if len(c) > 50000:
                content = c
                print(f"✅ CAPTURED {len(c)} bytes on attempt {attempt}!")
                break
        except Exception as e:
            print(f"  Attempt {attempt} exception: {e}")

    if content:
        soup = BeautifulSoup(content, 'lxml')
        tables = soup.find_all('table')
        print(f"Extracted {len(tables)} tables!")
        for i, t in enumerate(tables):
            rows = t.find_all('tr')
            print(f"\n--- Table {i} ({len(rows)} rows) ---")
            for r in rows[:6]:
                cells = [c.get_text(strip=True) for c in r.find_all(['td', 'th'])]
                print("  ", cells)

    browser.close()
