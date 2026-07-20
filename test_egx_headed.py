"""
Test: Playwright in HEADED mode (real visible browser window).
This uses the actual Chrome binary = real TLS fingerprint = bypasses F5.
READ-ONLY - no system changes.
"""
import asyncio
from playwright.async_api import async_playwright
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "data")

async def test_headed():
    print("=" * 60)
    print("EGX Test — Real Chrome Browser (Headed Mode)")
    print("A Chrome window will open briefly...")
    print("=" * 60)

    async with async_playwright() as p:
        # headless=False = real visible browser = real TLS fingerprint
        browser = await p.chromium.launch(
            headless=False,
            args=["--start-minimized"]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            locale="ar-EG",
            timezone_id="Africa/Cairo",
        )
        page = await context.new_page()

        print("\nOpening EGX Arabic page...")
        try:
            await page.goto("https://egx.com.eg/ar/Services_Reports.aspx", 
                          wait_until="domcontentloaded", timeout=25000)
            await page.wait_for_timeout(3000)  # Wait for JS
            title = await page.title()
            content = await page.content()
            print(f"  Title: {title}")

            if any(w in content.lower() for w in ["f5", "support id", "access denied"]):
                print("  ❌ BLOCKED — even real browser can't access it")
                print("  → EGX is geo-blocking or requires specific session")
            else:
                print("  ✅ PAGE ACCESSIBLE! Real browser works!")
                
                # Look for PDF download links
                links = await page.eval_on_selector_all(
                    'a[href*=".pdf"], a[onclick*="pdf"], a[href*="report"]',
                    'els => els.map(e => ({text: e.textContent.trim(), href: e.href, onclick: e.getAttribute("onclick")}))'
                )
                print(f"\n  Found {len(links)} potential report links:")
                for link in links[:10]:
                    print(f"    - {link}")

                # Try to find and click the daily report button
                print("\n  Looking for daily report download button...")
                daily_btns = await page.query_selector_all('text=التقرير اليومي')
                if not daily_btns:
                    daily_btns = await page.query_selector_all('text=Daily')
                print(f"  Found {len(daily_btns)} daily report buttons")

        except Exception as e:
            print(f"  Error: {e}")

        await browser.close()
        print("\nBrowser closed.")

asyncio.run(test_headed())
