from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=[
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-site-isolation-trials',
            '--disable-http2',
            '--window-size=1920,1080',
        ]
    )

    context = browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        viewport={'width': 1920, 'height': 1080},
        locale='ar-EG',
        timezone_id='Africa/Cairo',
        extra_http_headers={
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
        }
    )
    page = context.new_page()

    # Apply navigator overrides
    page.add_init_script("""
        Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
        Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
        Object.defineProperty(navigator, 'languages', {get: () => ['ar-EG', 'ar', 'en-US', 'en']});
        window.chrome = { runtime: {} };
    """)

    print("Step 1: Visiting Home page to get session WAF cookie...")
    try:
        page.goto('https://www.egx.com.eg/ar/Home.aspx', timeout=30000, wait_until='domcontentloaded')
        time.sleep(3)
        print("Home cookies acquired:", len(context.cookies()))
    except Exception as e:
        print("Home load warning:", e)

    print("Step 2: Navigating to InvestorsTypeCharts.aspx...")
    try:
        page.goto('https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx', timeout=45000, wait_until='domcontentloaded')
    except Exception as e:
        print("Goto warning:", e)

    print("Step 3: Waiting for tables...")
    tables = None
    for attempt in range(1, 12):
        time.sleep(2)
        try:
            url = page.url
            tbl_count = page.evaluate("() => document.querySelectorAll('table').length")
            print(f"  Attempt {attempt}: url={url}, tables={tbl_count}")
            if tbl_count >= 3:
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
                break
        except Exception as e:
            print(f"  Attempt {attempt} exception: {e}")

    if tables:
        print(f"\n✅ SUCCESS! Extracted {len(tables)} tables:")
        for t in tables:
            print(f"\n--- Table #{t['idx']} ({len(t['rows'])} rows) ---")
            for r in t['rows'][:6]:
                print("  ", r)
    else:
        print("❌ Could not extract tables")

    browser.close()
