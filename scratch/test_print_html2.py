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
        viewport={'width': 1920, 'height': 1080}
    )
    page = context.new_page()

    page.goto('https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx', timeout=45000, wait_until='domcontentloaded')

    # Retry loop to wait until navigation settles
    text = ""
    for attempt in range(15):
        time.sleep(1)
        try:
            text = page.evaluate("() => document.body ? document.body.innerText : ''")
            if "مصري" in text or "أفراد" in text or "33,197" in text:
                print(f"✅ Found flow text on attempt {attempt+1}!")
                break
        except Exception as e:
            print(f"Attempt {attempt+1} waiting: {e}")

    print("Body text length:", len(text))
    print("Body text snippet (first 2000 chars):")
    print(text[:2000])

    # Extract all tables
    tables = page.evaluate("""() => {
        const res = [];
        document.querySelectorAll('table').forEach((tbl, idx) => {
            const rows = [];
            tbl.querySelectorAll('tr').forEach(tr => {
                const cells = [];
                tr.querySelectorAll('th, td').forEach(c => cells.push((c.innerText||'').trim()));
                if (cells.length) rows.push(cells);
            });
            if (rows.length > 0) res.push({ idx, rows });
        });
        return res;
    }""")

    print(f"\nTables count: {len(tables)}")
    for tbl in tables:
        print(f"\n--- Table #{tbl['idx']} ({len(tbl['rows'])} rows) ---")
        for r in tbl['rows'][:6]:
            print("  ", r)

    browser.close()
