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
    page.goto('https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx', timeout=30000)

    tables = None
    for attempt in range(1, 10):
        time.sleep(2)
        try:
            print(f"Attempt {attempt}: title='{page.title()}', url='{page.url}'")
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
            print(f"Attempt {attempt} success! Found {len(tables)} tables")
            if len(tables) > 0:
                break
        except Exception as e:
            print(f"Attempt {attempt} exception: {e}")

    if tables:
        for tbl in tables:
            print(f"\n--- Table #{tbl['idx']} ({len(tbl['rows'])} rows) ---")
            for r in tbl['rows'][:6]:
                print("  ", r)

    browser.close()
