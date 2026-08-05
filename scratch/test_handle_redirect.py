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

    print("Direct loading InvestorsTypeCharts.aspx...")
    res = page.goto('https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx', timeout=30000)
    print("Initial status:", res.status if res else "None")

    # Sleep 5 seconds to let client-side JS redirects complete completely
    print("Sleeping 6s for JS redirects & postbacks...")
    time.sleep(6)

    print("Final title:", page.title())
    print("Final URL:", page.url)

    tables = page.evaluate("""() => {
        const res = [];
        document.querySelectorAll('table').forEach((tbl, idx) => {
            const rows = [];
            tbl.querySelectorAll('tr').forEach(tr => {
                const cells = [];
                tr.querySelectorAll('th, td').forEach(c => cells.push((c.innerText||'').trim()));
                if (cells.length) rows.push(cells);
            });
            res.push({ idx, rows });
        });
        return res;
    }""")

    print(f"\nExtracted {len(tables)} tables:")
    for idx, t in enumerate(tables):
        print(f"\n--- Table {idx} ({len(t['rows'])} rows) ---")
        for r in t['rows'][:6]:
            print("  ", r)

    browser.close()
