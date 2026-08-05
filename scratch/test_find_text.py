from playwright.sync_api import sync_playwright
import time, re

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

    page.goto('https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx', timeout=45000)

    time.sleep(12)

    content = page.content()
    print("Content length:", len(content))
    
    # Save full html for analysis
    with open("scratch/page_full.html", "w", encoding="utf-8") as f:
        f.write(content)

    print("Saved to scratch/page_full.html")

    # Search for known terms
    print("Contains 'مصري':", 'مصري' in content)
    print("Contains 'أفراد':", 'أفراد' in content)
    print("Contains 'مؤسسات':", 'مؤسسات' in content)

    # Check all frames
    print("Frames count:", len(page.frames))
    for i, fr in enumerate(page.frames):
        print(f"Frame #{i} URL: {fr.url}")
        try:
            fc = fr.content()
            print(f"  Frame #{i} content length: {len(fc)}")
            if 'مصري' in fc:
                print(f"  ✅ Frame #{i} contains 'مصري'!")
        except Exception as e:
            print(f"  Frame #{i} error: {e}")

    browser.close()
