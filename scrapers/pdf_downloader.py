import os
import re
import logging
import asyncio
from playwright.async_api import async_playwright
from config import settings

logger = logging.getLogger(__name__)

class EGXDownloader:
    def __init__(self):
        # Configure logging directories inside settings.DATA_FOLDER or project root
        self.screenshots_dir = os.path.join(settings.BASE_DIR, "logs", "screenshots")
        self.html_dir = os.path.join(settings.BASE_DIR, "logs", "html")
        os.makedirs(self.screenshots_dir, exist_ok=True)
        os.makedirs(self.html_dir, exist_ok=True)

    async def download_reports(self) -> tuple[str, str]:
        """
        Attempts to download both Arabic and English daily reports using Playwright.
        Returns a tuple of (arabic_pdf_path, english_pdf_path).
        Raises RuntimeError or FileNotFoundError if blocked or download fails.
        """
        logger.info("Starting Playwright PDF downloader...")
        
        # Download Arabic report
        logger.info("Attempting to download Arabic daily report...")
        arb_path = await self._download_single_report(
            url="https://egx.com.eg/ar/Services_Reports.aspx",
            lang="arb",
            search_terms=["النشرة اليومية", "تقارير دورية"]
        )
        
        # Download English report
        logger.info("Attempting to download English daily report...")
        eng_path = await self._download_single_report(
            url="https://egx.com.eg/en/Services_Reports.aspx",
            lang="eng",
            search_terms=["daily report", "Periodical Reports"]
        )
        
        return arb_path, eng_path

    async def _download_single_report(self, url: str, lang: str, search_terms: list[str]) -> str:
        """Downloads a single report and returns its destination path."""
        async with async_playwright() as p:
            # Configure launch arguments to bypass bot checks (navigator.webdriver)
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                    "--disable-dev-shm-usage"
                ]
            )
            context = await browser.new_context(
                viewport={"width": 1280, "height": 800},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                ignore_https_errors=True
            )
            # Remove webdriver indicator
            await context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            page = await context.new_page()
            
            # Listen to Network Requests for Phase 2 fallback
            captured_pdf_urls = []
            page.on("request", lambda request: self._intercept_request(request, captured_pdf_urls))
            
            logger.info(f"Navigating to {url}...")
            try:
                # 1. Load Page
                response = await page.goto(url, wait_until="load", timeout=45000)
                status = response.status if response else 0
                logger.info(f"Page loaded with status code: {status}")
                
                # Wait 5 seconds for JS/ASM challenge execution
                await page.wait_for_timeout(5000)
                
                # Check for F5 Bot Blocks / ASM Mismatch
                html = await page.content()
                if self._check_for_blocks(html, page):
                    # Phase 3: Block detected! Take screenshot, save HTML, extract Support ID
                    support_id = self._extract_support_id(html)
                    logger.error(f"F5 Block detected on {lang} page! Support ID: {support_id}")
                    
                    scr_path = os.path.join(self.screenshots_dir, f"egx_{lang}_blocked.png")
                    await page.screenshot(path=scr_path)
                    logger.info(f"Blocked screenshot saved to {scr_path}")
                    
                    html_path = os.path.join(self.html_dir, f"egx_{lang}_blocked.html")
                    with open(html_path, "w", encoding="utf-8") as f:
                        f.write(html)
                    logger.info(f"Blocked HTML saved to {html_path}")
                    
                    raise RuntimeError(f"F5 Firewall blocked access to {lang} page. Support ID: {support_id}")
                
                # 2. Phase 1: Locate download button/link
                btn = None
                for term in search_terms:
                    # Look for elements with tag 'a' or 'button' or input having text/value matching the search term
                    btn_loc = page.locator(f"a:has-text('{term}'), button:has-text('{term}'), input[value*='{term}']").first
                    if await btn_loc.count() > 0:
                        btn = btn_loc
                        logger.info(f"Found download selector using term: '{term}'")
                        break
                
                if not btn:
                    # Fallback to broad text locator
                    btn_text = page.get_by_text(search_terms[0], exact=False).first
                    if await btn_text.count() > 0:
                        btn = btn_text
                        logger.info("Found download selector using broad text locator.")
                
                # 3. Click and download
                if btn:
                    logger.info("Clicking the daily report download element...")
                    dest_file_path = os.path.join(settings.DATA_FOLDER, f"egx_daily_report_{lang}.pdf")
                    try:
                        async with page.expect_download(timeout=20000) as download_info:
                            await btn.click()
                        download = await download_info.value
                        await download.save_as(dest_file_path)
                        logger.info(f"Successfully downloaded {lang} report to {dest_file_path}")
                        return dest_file_path
                    except Exception as click_err:
                        logger.warning(f"UI click download failed: {click_err}. Trying network request fallback...")
                
                # 4. Phase 2: Fallback to intercepted PDF url
                if captured_pdf_urls:
                    direct_url = captured_pdf_urls[0]
                    logger.info(f"Found direct PDF download URL in network request logs: {direct_url}")
                    dest_file_path = os.path.join(settings.DATA_FOLDER, f"egx_daily_report_{lang}.pdf")
                    
                    # Fetch cookies to pass credentials/session tokens
                    cookies = await context.cookies()
                    cookies_str = "; ".join([f"{c['name']}={c['value']}" for c in cookies])
                    
                    # Download using requests with browser headers & cookies
                    import requests
                    r = requests.get(
                        direct_url,
                        headers={
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                            "Cookie": cookies_str
                        },
                        timeout=20
                    )
                    if r.status_code == 200:
                        with open(dest_file_path, "wb") as f:
                            f.write(r.content)
                        logger.info(f"Successfully downloaded direct URL report to {dest_file_path}")
                        return dest_file_path
                    else:
                        raise RuntimeError(f"Direct PDF download URL failed with status: {r.status_code}")
                
                raise FileNotFoundError(f"Failed to locate daily report download button or direct URL on {lang} page.")
                
            except Exception as e:
                # Capture block diagnostics on failure (e.g. connection reset or timeout)
                logger.error(f"Failed during download for {lang}: {e}")
                try:
                    scr_path = os.path.join(self.screenshots_dir, f"egx_{lang}_error.png")
                    await page.screenshot(path=scr_path)
                    logger.info(f"Error screenshot saved to {scr_path}")
                    
                    html_path = os.path.join(self.html_dir, f"egx_{lang}_error.html")
                    html_content = await page.content()
                    with open(html_path, "w", encoding="utf-8") as f:
                        f.write(html_content)
                    logger.info(f"Error HTML saved to {html_path}")
                except Exception as diag_err:
                    logger.warning(f"Could not save error diagnostics: {diag_err}")
                raise e
            finally:
                await browser.close()

    def _intercept_request(self, request, urls_list: list):
        """Intercepts requests to find direct PDF file links."""
        url = request.url
        if ".pdf" in url.lower() or "discdoc" in url.lower():
            urls_list.append(url)

    def _check_for_blocks(self, html: str, page) -> bool:
        """Checks if the loaded page contains F5 block signatures or is empty/broken."""
        html_lower = html.lower().strip()
        # 1. Check if the HTML is empty or essentially empty
        if not html_lower or html_lower == "<html><head></head><body></body></html>":
            return True
        if len(html_lower) < 200:
            return True
            
        # 2. Check for standard block phrases
        if "request rejected" in html_lower or "support id:" in html_lower:
            return True
        if "failureconfig" in html_lower:
            return True
        if "this site can’t be reached" in html_lower or "connection was reset" in html_lower:
            return True
        return False

    def _extract_support_id(self, html: str) -> str:
        """Regex helper to extract F5 block support ID."""
        # Check standard Support ID pattern
        m = re.search(r"Support ID:\s*([^\s<]+)", html, re.IGNORECASE)
        if m:
            return m.group(1).strip()
            
        # Check ASM Hex config block support ID
        m_hex = re.search(r"support_id%25\.(\d+)", html)
        if m_hex:
            return m_hex.group(1).strip()
            
        return "Unknown"
