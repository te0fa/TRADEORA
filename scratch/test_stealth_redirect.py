from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=[
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-http2',
        ]
    )
    context = browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        locale='ar-EG',
        viewport={'width': 1366, 'height': 768}
    )
    page = context.new_page()

    print("Navigating to EGX InvestorsTypeCharts.aspx...")
    page.goto('https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx', timeout=30000, wait_until='commit')
    
    # Wait until page URL stops changing / redirects finish
    print("Initial URL:", page.url)
    time.sleep(6)
    print("Settled URL:", page.url)

    # Wait for tables to appear
    try:
        page.wait_for_selector('table', timeout=15000)
        print("✅ Selector 'table' found!")
    except Exception as ex:
        print("Wait selector warning:", ex)

    tables = page.evaluate("""() => {
        return Array.from(document.querySelectorAll('table')).map(tbl => {
            return Array.from(tbl.querySelectorAll('tr')).map(tr => {
                return Array.from(tr.querySelectorAll('th, td')).map(c => c.innerText.trim());
            });
        });
    }""")

    print(f"Extracted {len(tables)} tables:")
    for idx, t in enumerate(tables):
        print(f"\n--- Table {idx} ({len(t)} rows) ---")
        for r in t[:6]:
            print("  ", r)

    browser.close()
