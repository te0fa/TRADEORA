from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=[
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-http2',
            '--window-size=1920,1080',
        ]
    )

    context = browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        viewport={'width': 1920, 'height': 1080},
        locale='ar-EG',
        timezone_id='Africa/Cairo',
        extra_http_headers={
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
        }
    )
    page = context.new_page()

    page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")

    print("Visiting Home.aspx...")
    page.goto('https://www.egx.com.eg/ar/Home.aspx', timeout=30000, wait_until='domcontentloaded')
    time.sleep(2)

    print("Visiting InvestorsTypeCharts.aspx...")
    page.goto('https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx', timeout=45000, wait_until='domcontentloaded')
    time.sleep(5)

    info = page.evaluate("""() => {
        const allElements = document.querySelectorAll('*');
        const tags = {};
        allElements.forEach(el => {
            tags[el.tagName] = (tags[el.tagName] || 0) + 1;
        });
        const innerText = document.body ? document.body.innerText : '';
        return {
            title: document.title,
            text_length: innerText.length,
            sample_text: innerText.substring(0, 1500),
            tags: tags,
            ids: Array.from(document.querySelectorAll('[id]')).map(el => el.id).filter(id => id.length < 50).slice(0, 40)
        };
    }""")

    print("Title:", info['title'])
    print("Text length:", info['text_length'])
    print("Tags count:", info['tags'])
    print("IDs sample:", info['ids'])
    print("\nText sample:")
    print(info['sample_text'])

    browser.close()
