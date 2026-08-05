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
            '--disable-web-security',
        ]
    )

    context = browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        viewport={'width': 1920, 'height': 1080},
        locale='ar-EG',
        extra_http_headers={
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
            'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
        }
    )
    page = context.new_page()

    # Stealth init script to bypass F5 WAF detection
    page.add_init_script("""
        Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
        Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
        Object.defineProperty(navigator, 'languages', {get: () => ['ar-EG', 'ar', 'en-US', 'en']});
        window.chrome = { runtime: {}, loadTimes: () => {}, csi: () => {}, app: {} };
    """)

    print("Step 1: Opening InvestorsTypeCharts.aspx (will trigger TSPD JS challenge)...")
    page.goto('https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx', timeout=45000, wait_until='commit')

    print("Step 2: Waiting for TSPD challenge to solve and reload page...")
    for sec in range(1, 15):
        time.sleep(1)
        try:
            url = page.url
            title = page.title()
            tbl_count = page.evaluate("() => document.querySelectorAll('table').length")
            print(f"  Sec {sec}: title='{title}', tables={tbl_count}")
            if tbl_count >= 3:
                print(f"✅ TSPD Solved on sec {sec}!")
                break
        except Exception as e:
            print(f"  Sec {sec}: exception during challenge reload ({e})")

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
