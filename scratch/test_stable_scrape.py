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
            '--window-size=1920,1080',
        ]
    )
    context = browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        locale='ar-EG',
        viewport={'width': 1920, 'height': 1080}
    )
    page = context.new_page()

    print("Navigating to InvestorsTypeCharts.aspx with wait_until=commit...")
    page.goto('https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx', timeout=30000, wait_until='commit')

    print("Waiting 5s for client redirects to finish...")
    time.sleep(5)

    print("Now waiting for table or text...")
    extracted = None
    for attempt in range(1, 10):
        try:
            tbl_count = page.evaluate("() => document.querySelectorAll('table').length")
            print(f"Attempt {attempt}: url={page.url}, tables={tbl_count}")
            if tbl_count >= 3:
                extracted = page.evaluate("""() => {
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
                break
        except Exception as e:
            print(f"Attempt {attempt} exception: {e}")
        time.sleep(2)

    if extracted:
        print(f"\nExtracted {len(extracted)} tables:")
        for t in extracted:
            print(f"\n--- Table #{t['idx']} ({len(t['rows'])} rows) ---")
            for r in t['rows'][:6]:
                print("  ", r)
    else:
        print("❌ Could not extract tables")

    browser.close()
