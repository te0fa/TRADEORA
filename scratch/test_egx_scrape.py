from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        locale='ar-EG'
    )
    page = context.new_page()
    page.route("**/*.{png,jpg,jpeg,svg,gif,woff,woff2}", lambda route: route.abort())
    print("Navigating...")
    t0 = time.time()
    try:
        page.goto('https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx', timeout=20000, wait_until='domcontentloaded')
    except Exception as e:
        print("Goto notice:", e)
    
    print("Navigated in", round(time.time() - t0, 2), "s")
    try:
        page.wait_for_selector('table', timeout=10000)
        print("Table found!")
    except Exception as e:
        print("Wait for table notice:", e)

    tables = page.evaluate("""() => {
        return Array.from(document.querySelectorAll('table')).map(tbl => {
            return Array.from(tbl.querySelectorAll('tr')).map(tr => {
                return Array.from(tr.querySelectorAll('th, td')).map(c => c.innerText.trim());
            });
        });
    }""")
    print("Extracted tables count:", len(tables))
    for i, tbl in enumerate(tables):
        print(f"\n--- Table {i} ({len(tbl)} rows) ---")
        for row in tbl[:5]:
            print("  Row:", row)
    browser.close()
