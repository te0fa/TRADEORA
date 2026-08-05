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
        locale='ar-EG',
        extra_http_headers={
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
        }
    )
    page = context.new_page()

    print("Step 1: Loading Home.aspx...")
    try:
        page.goto('https://www.egx.com.eg/ar/Home.aspx', timeout=20000)
    except Exception as e:
        print("Home load warning:", e)
    
    time.sleep(2)

    print("Step 2: Loading InvestorsTypeCharts.aspx with wait_until=commit...")
    try:
        page.goto('https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx', timeout=30000, wait_until='commit')
    except Exception as e:
        print("InvestorsTypeCharts goto warning:", e)

    print("Step 3: Waiting 6 seconds for ASP.NET AJAX render...")
    time.sleep(6)

    extracted = page.evaluate("""() => {
        const tables = document.querySelectorAll('table');
        const res = [];
        tables.forEach((tbl, idx) => {
            const rows = [];
            tbl.querySelectorAll('tr').forEach(tr => {
                const cells = [];
                tr.querySelectorAll('th, td').forEach(c => cells.push((c.innerText||'').trim()));
                if (cells.length) rows.push(cells);
            });
            res.push({ idx, rows });
        });
        return { count: tables.length, tables: res, text_len: document.body ? document.body.innerText.length : 0 };
    }""")

    print(f"Extraction result: {extracted['count']} tables found. Body text length: {extracted['text_len']}")
    for tbl in extracted['tables']:
        print(f"\nTable #{tbl['idx']} ({len(tbl['rows'])} rows):")
        for r in tbl['rows'][:6]:
            print("  ", r)

    browser.close()
