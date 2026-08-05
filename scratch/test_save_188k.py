from playwright.sync_api import sync_playwright
import time
from bs4 import BeautifulSoup

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=[
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-http2',
            '--window-size=1920,1080',
        ]
    )

    context = browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        viewport={'width': 1920, 'height': 1080},
        locale='ar-EG',
        timezone_id='Africa/Cairo',
        extra_http_headers={
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
            'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
        }
    )
    page = context.new_page()
    page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")

    page.goto('https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx', timeout=45000, wait_until='commit')

    content = ""
    for attempt in range(1, 25):
        time.sleep(1)
        try:
            c = page.content()
            print(f"Attempt {attempt}: length={len(c)}")
            if len(c) > 50000:
                content = c
                print(f"✅ Captured full HTML ({len(c)} bytes) on attempt {attempt}!")
                break
        except Exception as e:
            print(f"Attempt {attempt} navigation in progress: {e}")

    if content:
        soup = BeautifulSoup(content, 'lxml')
        tables = soup.find_all('table')
        print(f"Found {len(tables)} tables in {len(content)} bytes HTML!")
        for i, t in enumerate(tables):
            rows = t.find_all('tr')
            print(f"\n--- Table {i} ({len(rows)} rows) ---")
            for r in rows[:6]:
                cells = [c.get_text(strip=True) for c in r.find_all(['td', 'th'])]
                print("  ", cells)
    else:
        print("❌ Could not capture 188KB HTML")

    browser.close()
