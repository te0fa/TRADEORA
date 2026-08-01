"""
egx_debug.py - يطبع كل اللينكات الموجودة على صفحة EGX Reports لنفهم الـ structure
"""
from playwright.sync_api import sync_playwright
import time

EGX_REPORTS_URL = 'https://www.egx.com.eg/ar/Services_Reports.aspx'
EGX_BASE        = 'https://www.egx.com.eg'

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=['--no-sandbox', '--disable-setuid-sandbox']
    )
    context = browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                   '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        locale='ar-EG',
        viewport={'width': 1280, 'height': 800},
    )
    page = context.new_page()

    print(f"Opening: {EGX_REPORTS_URL}")
    page.goto(EGX_REPORTS_URL, timeout=30000, wait_until='networkidle')
    time.sleep(5)

    print(f"\nPage title: {page.title()}")
    print(f"Page URL:   {page.url}")

    # All links
    links = page.query_selector_all('a')
    print(f"\nTotal links on page: {len(links)}")
    print("\n--- All links with PDF or Data or Report in href/text ---")
    for link in links:
        href = link.get_attribute('href') or ''
        text = (link.inner_text() or '').strip()[:60]
        if any(k in href.lower() or k in text.lower() for k in
               ['.pdf', 'report', 'data', 'daily', 'نشرة', 'يومي', 'بيان']):
            full_href = (EGX_BASE + href) if href.startswith('/') else href
            print(f"  TEXT: {text:<40} HREF: {full_href}")

    print("\n--- First 30 links (any) ---")
    for link in links[:30]:
        href = link.get_attribute('href') or ''
        text = (link.inner_text() or '').strip()[:50]
        if href:
            print(f"  {text:<40} → {href}")

    # Save screenshot for debugging
    page.screenshot(path='egx_debug_screenshot.png', full_page=False)
    print("\nScreenshot saved: egx_debug_screenshot.png")

    browser.close()
