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
        ]
    )

    context = browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        viewport={'width': 1920, 'height': 1080},
        locale='ar-EG',
        extra_http_headers={
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
            'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
        }
    )
    page = context.new_page()
    page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")

    print("Opening InvestorsTypeCharts.aspx...")
    page.goto('https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx', timeout=45000, wait_until='commit')

    print("Waiting 10s for TSPD challenge & reload...")
    time.sleep(10)

    print("Title:", page.title())
    print("URL:", page.url)

    text = page.evaluate("() => document.body ? document.body.innerText : ''")
    print("Body text length:", len(text))
    print("Body text sample (first 1000 chars):")
    print(text[:1000])

    html = page.content()
    print("HTML length:", len(html))

    browser.close()
