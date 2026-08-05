from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=[
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
        ]
    )
    context = browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        locale='ar-EG'
    )
    page = context.new_page()

    page.on("framenavigated", lambda frame: print("Navigated frame to:", frame.url))

    print("Step 1: Loading Home.aspx...")
    page.goto('https://www.egx.com.eg/ar/Home.aspx', timeout=30000, wait_until='domcontentloaded')
    time.sleep(3)

    print("Step 2: Loading InvestorsTypeCharts.aspx...")
    page.goto('https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx', timeout=30000)
    
    print("Final URL:", page.url)
    
    # Wait for page to finish any client-side redirect / AJAX
    time.sleep(5)
    print("Settled URL:", page.url)

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

    print(f"Extracted {len(tables)} tables:")
    for tbl in tables:
        print(f"\n--- Table #{tbl['idx']} ({len(tbl['rows'])} rows) ---")
        for r in tbl['rows'][:6]:
            print("  ", r)

    browser.close()
