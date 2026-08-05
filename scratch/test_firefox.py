from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    print("Testing Playwright Firefox...")
    browser = p.firefox.launch(headless=True)
    context = browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
        locale='ar-EG',
    )
    page = context.new_page()

    print("Step 1: Navigating to InvestorsTypeCharts.aspx...")
    page.goto('https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx', timeout=45000, wait_until='domcontentloaded')

    print("Step 2: Waiting 8s for F5 WAF challenge solving...")
    time.sleep(8)

    print("Title:", page.title())
    print("URL:", page.url)

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

    print(f"\nExtracted {len(tables)} tables via Firefox:")
    for tbl in tables:
        print(f"\n--- Table #{tbl['idx']} ({len(tbl['rows'])} rows) ---")
        for r in tbl['rows'][:6]:
            print("  ", r)

    browser.close()
