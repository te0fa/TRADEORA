"""
debug_egx_page.py — يحفظ HTML الصفحة كاملاً للتحليل
"""
import time, sys
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("pip install playwright && playwright install chromium")
    sys.exit(1)

URL = 'https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx'
HOME = 'https://www.egx.com.eg/ar/Home.aspx'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--no-sandbox','--disable-dev-shm-usage'])
    ctx = browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        locale='ar-EG', viewport={'width': 1600, 'height': 900}
    )
    page = ctx.new_page()

    # Try home first
    try:
        page.goto(HOME, timeout=20000, wait_until='domcontentloaded')
        time.sleep(3)
        print("✅ Home loaded")
    except Exception as e:
        print(f"⚠️ Home timeout: {e}")

    # Go to target page
    print("Loading InvestorsTypeCharts...")
    page.goto(URL, timeout=60000, wait_until='domcontentloaded')
    
    # Wait progressively and look for actual number tables
    found_data = False
    for wait_secs in [5, 10, 15, 20]:
        time.sleep(5)
        total_wait = wait_secs
        
        # Check if actual EGP numbers are present (pattern: 12,345,678,901)
        has_numbers = page.evaluate("""
            () => {
                const text = document.body.innerText || '';
                // Look for numbers like 43,648,646,496
                const matches = text.match(/\\d{1,3}(,\\d{3}){3,}/g);
                return matches ? matches.slice(0, 10) : [];
            }
        """)
        
        print(f"Wait {total_wait}s — found numbers: {has_numbers[:5] if has_numbers else 'NONE'}")
        
        if has_numbers and len(has_numbers) >= 6:
            found_data = True
            print(f"✅ Data found after {total_wait}s wait!")
            break
    
    # Save full HTML
    html = page.content()
    out = Path('debug_egx_page.html')
    out.write_text(html, encoding='utf-8')
    print(f"\n📄 HTML saved to: {out} ({len(html):,} bytes)")
    
    # Also save plain text
    text = page.evaluate("() => document.body.innerText")
    out_txt = Path('debug_egx_text.txt')
    out_txt.write_text(text, encoding='utf-8')
    print(f"📄 Text saved to: {out_txt} ({len(text):,} chars)")
    
    # Find all tables with numbers
    tables_info = page.evaluate("""
        () => {
            const tables = document.querySelectorAll('table');
            const result = [];
            tables.forEach((t, i) => {
                const txt = t.innerText || '';
                const nums = txt.match(/\\d{1,3}(,\\d{3}){2,}/g);
                if (nums && nums.length > 0) {
                    result.push({
                        index: i,
                        id: t.id,
                        className: t.className,
                        rows: t.rows.length,
                        nums: nums.slice(0, 5),
                        preview: txt.substring(0, 200)
                    });
                }
            });
            return result;
        }
    """)
    
    print(f"\n📊 Tables with numbers: {len(tables_info)}")
    for t in tables_info:
        print(f"  Table[{t['index']}] id='{t['id']}' class='{t['className'][:50]}' rows={t['rows']}")
        print(f"    Numbers: {t['nums']}")
        print(f"    Preview: {t['preview'][:100].strip()}")
    
    browser.close()
    
print("\n✅ Debug complete!")
