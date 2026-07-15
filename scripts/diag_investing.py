
import asyncio
from playwright.async_api import async_playwright

async def main():
    url = "https://sa.investing.com/equities/egypt"
    print(f"--- GHA DIAGNOSTIC: Loading {url} ---")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 900}
        )
        page = await context.new_page()
        await page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        try:
            r = await page.goto(url, wait_until="domcontentloaded", timeout=40000)
            await page.wait_for_timeout(3000)
            
            print(f"Final URL after loading: {page.url}")
            print(f"Page Title: {await page.title()}")
            print(f"Response status code: {r.status if r else 'None'}")
            
            # Print page body text snippet (to check for Cloudflare block)
            body_text = await page.inner_text("body")
            print(f"Body text length: {len(body_text)}")
            print("--- BODY TEXT SAMPLE ---")
            print(body_text[:1000])
            print("------------------------")
            
        except Exception as e:
            print("Diagnostic Error:", e)
        finally:
            await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
