from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    try:
        browser = p.chromium.launch(channel='chrome', headless=True)
    except Exception:
        browser = p.chromium.launch(headless=True)

    context = browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        locale='ar-EG',
        viewport={'width': 1920, 'height': 1080}
    )
    page = context.new_page()

    print("Step 1: Loading Home.aspx...")
    page.goto('https://www.egx.com.eg/ar/Home.aspx', timeout=30000, wait_until='domcontentloaded')
    time.sleep(2)

    print("Step 2: Loading InvestorsTypeCharts.aspx...")
    page.goto('https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx', timeout=45000, wait_until='domcontentloaded')

    print("Waiting for page title / tables to settle...")
    for i in range(15):
        time.sleep(1)
        try:
            t = page.title()
            tbl_count = page.evaluate("document.querySelectorAll('table').length")
            print(f"Sec {i+1}: title='{t}', tables={tbl_count}")
            if tbl_count >= 3:
                print("✅ Found all 3 tables!")
                break
        except Exception as e:
            print(f"Sec {i+1}: waiting for navigation... ({e})")

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

    print(f"\nSuccessfully extracted {len(tables)} tables!")
    for tbl in tables:
        print(f"\n--- Table #{tbl['idx']} ({len(tbl['rows'])} rows) ---")
        for r in tbl['rows'][:6]:
            print("  ", r)

    browser.close()
