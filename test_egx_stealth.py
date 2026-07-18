"""
Test: Playwright Stealth vs F5 block on EGX website.
READ-ONLY - no system changes.
"""
import asyncio
from playwright.async_api import async_playwright
from playwright_stealth import Stealth

async def test():
    print("=" * 60)
    print("EGX Stealth Test — No system changes")
    print("=" * 60)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            locale="ar-EG",
            timezone_id="Africa/Cairo",
            viewport={"width": 1920, "height": 1080},
        )
        stealth = Stealth()
        await stealth.apply_stealth_async(context)
        page = await context.new_page()

        for name, url in [
            ("Arabic page", "https://egx.com.eg/ar/Services_Reports.aspx"),
            ("English page", "https://egx.com.eg/en/Services_Reports.aspx"),
        ]:
            print(f"\nTesting {name}...")
            try:
                await page.goto(url, timeout=20000)
                title = await page.title()
                content = await page.content()
                print(f"  Title: {title}")
                if any(w in content.lower() for w in ["f5", "access denied", "blocked", "support id"]):
                    print(f"  ❌ BLOCKED by F5")
                else:
                    print(f"  ✅ Accessible! Stealth worked!")
                    links = await page.eval_on_selector_all('a[href*=".pdf"]', 'els => els.map(e => e.href)')
                    print(f"  PDF links: {links}")
            except Exception as e:
                print(f"  Error: {e}")

        await browser.close()

asyncio.run(test())
