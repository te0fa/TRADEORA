"""test_direct.py"""
import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--no-sandbox','--disable-dev-shm-usage'])
    ctx = browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        locale='ar-EG', viewport={'width':1600,'height':900}
    )
    page = ctx.new_page()
    print('Going directly to charts page...')
    try:
        page.goto('https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx', timeout=60000, wait_until='domcontentloaded')
        print(f'Loaded! Waiting 20s for AJAX...')
        time.sleep(20)
        
        nums = page.evaluate("""
            () => {
                var t = document.body.innerText;
                var m = t.match(/\\d{1,3}(?:,\\d{3}){3,}/g);
                return m ? m.slice(0,15) : [];
            }
        """)
        print(f'Numbers found: {nums}')
        
        tables = page.evaluate("""
            () => {
                var res = [];
                var allTables = document.querySelectorAll('table');
                for(var i=0; i<allTables.length; i++) {
                    var t = allTables[i];
                    var rows = [];
                    var trs = t.querySelectorAll('tr');
                    for(var j=0; j<trs.length; j++) {
                        var cells = [];
                        var tds = trs[j].querySelectorAll('td,th');
                        for(var k=0; k<tds.length; k++) cells.push(tds[k].innerText.trim());
                        var hasNum = cells.some(function(c){ return /\\d{6,}/.test(c.replace(/,/g,'')); });
                        if(hasNum) rows.push(cells);
                    }
                    if(rows.length > 0) res.push({idx:i, id:t.id, rows:rows});
                }
                return res;
            }
        """)
        print(f'Tables with numbers: {len(tables)}')
        for t in tables:
            print(f'  Table[{t["idx"]}] id={t["id"]} rows={len(t["rows"])}')
            for r in t['rows'][:4]:
                print(f'    {r}')
    except Exception as e:
        print(f'Error: {e}')
    browser.close()
print('Done')
