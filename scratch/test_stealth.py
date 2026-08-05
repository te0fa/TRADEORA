from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=[
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-http2',  # Try disabling HTTP/2 to prevent connection reset by WAF
        ]
    )
    context = browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        locale='ar-EG',
        viewport={'width': 1366, 'height': 768}
    )
    page = context.new_page()

    print("Navigating directly to InvestorsTypeCharts.aspx with --disable-http2...")
    try:
        res = page.goto('https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx', timeout=25000)
        print("Status code:", res.status if res else "No response")
        time.sleep(5)
        print("Page title:", page.title())
        tables = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('table')).map(tbl => {
                return Array.from(tbl.querySelectorAll('tr')).map(tr => {
                    return Array.from(tr.querySelectorAll('th, td')).map(c => c.innerText.trim());
                });
            });
        }""")
        print("Tables found:", len(tables))
        for idx, t in enumerate(tables):
            print(f"\nTable {idx}:")
            for r in t[:5]:
                print("  ", r)
    except Exception as e:
        print("Navigation failed:", e)

    browser.close()
