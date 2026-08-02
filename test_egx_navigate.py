"""
test_egx_navigate.py — يتنقل عن طريق المنيو ويلتقط AJAX calls
"""
import time, json, sys
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("pip install playwright && playwright install chromium")
    sys.exit(1)

captured_responses = []

def handle_response(response):
    url = response.url
    # Capture any XHR/fetch that looks like it returns data
    if any(x in url for x in ['aspx', 'api', 'json', 'data', 'flow', 'investor']):
        try:
            ct = response.headers.get('content-type', '')
            if 'json' in ct or 'html' in ct:
                body = response.body()
                if len(body) > 5000:  # Only substantial responses
                    captured_responses.append({
                        'url': url,
                        'status': response.status,
                        'ct': ct,
                        'size': len(body),
                        'preview': body[:500].decode('utf-8', errors='replace')
                    })
                    print(f"  📡 Captured: {url[:80]} ({len(body):,} bytes)")
        except:
            pass

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled']
    )
    ctx = browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        locale='ar-EG', viewport={'width': 1600, 'height': 900}
    )
    page = ctx.new_page()
    page.on('response', handle_response)

    print("Step 1: Loading home page...")
    try:
        page.goto('https://www.egx.com.eg/ar/Home.aspx', timeout=25000, wait_until='domcontentloaded')
        time.sleep(4)
        print(f"  ✅ Home loaded, title: {page.title()}")
    except Exception as e:
        print(f"  ⚠️ Home failed: {e}")

    # Method 1: Try direct navigation with different wait strategy
    print("\nMethod 1: Direct URL with networkidle...")
    try:
        page.goto('https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx', 
                  timeout=60000, wait_until='load')
        time.sleep(15)
        print(f"  ✅ Charts page loaded, title: {page.title()}")
        
        # Check for actual data
        nums = page.evaluate("""
            () => {
                const text = document.body.innerText;
                const matches = text.match(/\\d{1,3}(?:,\\d{3}){3,}/g) || [];
                return matches.slice(0, 20);
            }
        """)
        print(f"  Large numbers: {nums[:10]}")
        
        # Save page text
        text = page.evaluate("() => document.body.innerText")
        Path('debug_direct.txt').write_text(text[:5000], encoding='utf-8')
        
    except Exception as e:
        print(f"  ❌ Direct failed: {e}")

    # Method 2: Try clicking through menu
    print("\nMethod 2: Navigate via menu click...")
    try:
        page.goto('https://www.egx.com.eg/ar/Home.aspx', timeout=25000, wait_until='domcontentloaded')
        time.sleep(3)
        
        # Try clicking market data menu
        selectors = [
            'a[href*="InvestorsTypeCharts"]',
            'a:has-text("فئات المستثمرين")',
            'a:has-text("فئات")',
            'li:has-text("فئات المستثمرين") a',
        ]
        
        clicked = False
        for sel in selectors:
            try:
                el = page.locator(sel).first
                if el.count() > 0:
                    el.click()
                    print(f"  ✅ Clicked: {sel}")
                    time.sleep(15)
                    clicked = True
                    break
            except Exception as ce:
                print(f"  ⚠️ Selector {sel}: {ce}")
        
        if clicked:
            nums = page.evaluate("() => { const t = document.body.innerText; return (t.match(/\\d{1,3}(?:,\\d{3}){3,}/g)||[]).slice(0,10); }")
            print(f"  Numbers after click: {nums}")
            text = page.evaluate("() => document.body.innerText")
            Path('debug_menu.txt').write_text(text[:5000], encoding='utf-8')
            
    except Exception as e:
        print(f"  ❌ Menu method failed: {e}")
    
    browser.close()

# Report captured AJAX calls
print(f"\n📡 Captured {len(captured_responses)} AJAX responses:")
for r in captured_responses:
    print(f"  [{r['status']}] {r['url'][:100]} ({r['size']:,} bytes)")
    print(f"    Preview: {r['preview'][:100]}")
