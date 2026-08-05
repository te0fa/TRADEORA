from playwright.sync_api import sync_playwright
import time, re
from bs4 import BeautifulSoup

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

    page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")

    page.goto('https://www.egx.com.eg/ar/Home.aspx', timeout=30000, wait_until='domcontentloaded')
    time.sleep(3)

    page.goto('https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx', timeout=45000, wait_until='domcontentloaded')

    content = ""
    for attempt in range(1, 15):
        time.sleep(1)
        try:
            c = page.content()
            if len(c) > 50000:
                content = c
                print(f"✅ CAPTURED {len(c)} bytes on attempt {attempt}!")
                break
        except Exception:
            pass

    if content:
        with open("scratch/page_188k.html", "w", encoding="utf-8") as f:
            f.write(content)

        soup = BeautifulSoup(content, 'lxml')
        
        # Search for Arabic numbers / text in all tags
        print("\n--- Spans / Divs containing 'مصري' ---")
        for tag in soup.find_all(['span', 'td', 'div', 'p', 'th']):
            txt = tag.get_text(strip=True)
            if 'مصري' in txt and len(txt) < 100:
                print("  TAG:", tag.name, "| class:", tag.get('class'), "| id:", tag.get('id'), "| text:", txt)

        print("\n--- Spans / Divs containing 'أفراد' ---")
        for tag in soup.find_all(['span', 'td', 'div', 'p', 'th']):
            txt = tag.get_text(strip=True)
            if 'أفراد' in txt and len(txt) < 100:
                print("  TAG:", tag.name, "| class:", tag.get('class'), "| id:", tag.get('id'), "| text:", txt)

        print("\n--- Spans / Divs containing '33,197' or numbers with commas ---")
        large_num_tags = []
        for tag in soup.find_all(['span', 'td', 'div', 'b', 'strong', 'td', 'label']):
            txt = tag.get_text(strip=True)
            if re.search(r'\d{1,3}(?:,\d{3}){2,}', txt):
                large_num_tags.append((tag.name, tag.get('id'), tag.get('class'), txt))

        print(f"Found {len(large_num_tags)} large number tags:")
        for t in large_num_tags[:20]:
            print("  ", t)

    browser.close()
