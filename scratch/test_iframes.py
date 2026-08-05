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

    time.sleep(8)

    print("Main frame URL:", page.url)
    print("All frames count:", len(page.frames))
    for f_idx, frame in enumerate(page.frames):
        print(f"Frame #{f_idx} URL: {frame.url}")
        try:
            tbls = frame.evaluate("""() => {
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
            print(f"  Frame #{f_idx} has {len(tbls)} tables")
            for t in tbls:
                print(f"    Table #{t['idx']} ({len(t['rows'])} rows):")
                for r in t['rows'][:5]:
                    print("      ", r)
        except Exception as e:
            print(f"  Frame #{f_idx} eval error: {e}")

    browser.close()
