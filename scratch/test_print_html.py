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

    page.goto('https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx', timeout=45000, wait_until='domcontentloaded')

    time.sleep(10)

    text = page.evaluate("() => document.body ? document.body.innerText : ''")
    print("Body text length:", len(text))
    print("Body text snippet (first 3000 chars):")
    print(text[:3000])

    html = page.evaluate("() => document.body ? document.body.innerHTML : ''")
    print("\nHTML snippet containing 'مصري':")
    import re
    matches = re.findall(r'.{0,100}مصري.{0,100}', html)
    for m in matches[:10]:
        print("  MATCH:", m.strip())

    browser.close()
