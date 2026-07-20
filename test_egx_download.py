"""
Test script: Can we download the EGX daily report PDF using httpx (no Playwright)?
This does NOT modify any existing code. It only reads and prints results.
"""
import httpx
import os
import time

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "ar,en-US;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Referer": "https://egx.com.eg/",
}

# Known EGX report page URLs
PAGES = {
    "Arabic": "https://egx.com.eg/ar/Services_Reports.aspx",
    "English": "https://egx.com.eg/en/Services_Reports.aspx",
}

# Common direct PDF URL patterns to try
PDF_PATTERNS = [
    "https://egx.com.eg/Uploads/DailyDataFiles/DailyDataFile_AR.pdf",
    "https://egx.com.eg/Uploads/DailyDataFiles/DailyDataFile_EN.pdf",
    "https://egx.com.eg/en/EGX_Reports/Daily_Bulletin.pdf",
    "https://egx.com.eg/ar/EGX_Reports/Daily_Bulletin.pdf",
]

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "data")

def test_page_access(client, name, url):
    print(f"\n{'='*50}")
    print(f"Testing {name} page: {url}")
    try:
        resp = client.get(url, timeout=15, follow_redirects=True)
        print(f"  Status: {resp.status_code}")
        print(f"  Content-Type: {resp.headers.get('content-type', 'unknown')}")
        content_lower = resp.text.lower()
        if "f5" in content_lower or "access denied" in content_lower or "blocked" in content_lower:
            print(f"  ❌ BLOCKED by F5 firewall")
            return False
        elif resp.status_code == 200:
            print(f"  ✅ Page accessible! ({len(resp.text)} chars)")
            # Look for PDF links
            pdf_links = [line for line in resp.text.split('"') if '.pdf' in line.lower()]
            if pdf_links:
                print(f"  📄 Found PDF links: {pdf_links[:3]}")
            return True
        else:
            print(f"  ⚠️ Unexpected status: {resp.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def test_direct_pdf(client, url):
    print(f"\n  Trying direct PDF: {url}")
    try:
        resp = client.get(url, timeout=20, follow_redirects=True)
        print(f"    Status: {resp.status_code}")
        content_type = resp.headers.get('content-type', '')
        if resp.status_code == 200 and 'pdf' in content_type.lower():
            print(f"    ✅ PDF FOUND! Size: {len(resp.content) / 1024:.1f} KB")
            return resp.content, url
        elif resp.status_code == 200:
            print(f"    ⚠️ Got 200 but content-type is: {content_type}")
            # Check if content starts with PDF magic bytes
            if resp.content[:4] == b'%PDF':
                print(f"    ✅ PDF magic bytes found! Size: {len(resp.content) / 1024:.1f} KB")
                return resp.content, url
        else:
            print(f"    ❌ Not found ({resp.status_code})")
        return None, None
    except Exception as e:
        print(f"    ❌ Error: {e}")
        return None, None

def main():
    print("=" * 60)
    print("EGX PDF Download Test (httpx, no Playwright)")
    print("This is READ-ONLY — no changes to existing files")
    print("=" * 60)

    with httpx.Client(headers=HEADERS, timeout=20) as client:
        
        # Step 1: Try to access the pages
        print("\n--- Step 1: Test page access ---")
        for name, url in PAGES.items():
            test_page_access(client, name, url)
            time.sleep(1)

        # Step 2: Try known direct PDF URLs
        print("\n--- Step 2: Try direct PDF URLs ---")
        found_pdf = None
        found_url = None
        for url in PDF_PATTERNS:
            content, matched_url = test_direct_pdf(client, url)
            if content:
                found_pdf = content
                found_url = matched_url
                break
            time.sleep(0.5)

    # Step 3: Report results
    print("\n" + "=" * 60)
    print("RESULT SUMMARY")
    print("=" * 60)

    if found_pdf:
        test_path = os.path.join(OUTPUT_DIR, "TEST_egx_download.pdf")
        with open(test_path, 'wb') as f:
            f.write(found_pdf)
        print(f"✅ SUCCESS! PDF downloaded from: {found_url}")
        print(f"✅ Saved to: {test_path}")
        print(f"✅ Size: {len(found_pdf) / 1024:.1f} KB")
        print("\n→ الحل يشتغل! ممكن نستبدل Playwright بـ httpx")
    else:
        print("❌ FAILED: Could not download PDF via httpx")
        print("→ F5 block قوي — هنحتاج Playwright Stealth أو طريقة تانية")
        print("\nNext option: pip install playwright-stealth")

if __name__ == "__main__":
    main()
