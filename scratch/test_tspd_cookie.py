from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    # Use real Chrome if available or chromium with args
    try:
        browser = p.chromium.launch(channel='chrome', headless=True)
        print("Using system Chrome channel")
    except Exception:
        browser = p.chromium.launch(headless=True)
        print("Using Playwright Chromium")

    context = browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        locale='ar-EG',
        viewport={'width': 1920, 'height': 1080}
    )
    page = context.new_page()
    page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")

    print("Step 1: Open InvestorsTypeCharts.aspx...")
    page.goto('https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx', timeout=45000, wait_until='commit')

    print("Step 2: Sleeping 8s to allow F5 WAF TSPD JS challenge to complete and reload...")
    time.sleep(8)

    print("Step 3: Checking URL & title...")
    print("URL:", page.url)
    print("Title:", page.title())

    # Wait for tables to appear
    tbl_count = 0
    for attempt in range(10):
        try:
            tbl_count = page.evaluate("() => document.querySelectorAll('table').length")
            print(f"  Attempt {attempt+1}: tables = {tbl_count}")
            if tbl_count >= 3:
                break
        except Exception as e:
            print(f"  Attempt {attempt+1} exception: {e}")
        time.sleep(2)

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

    print(f"\nExtracted {len(tables)} tables:")
    for tbl in tables:
        print(f"\n--- Table #{tbl['idx']} ({len(tbl['rows'])} rows) ---")
        for r in tbl['rows'][:6]:
            print("  ", r)

    browser.close()
