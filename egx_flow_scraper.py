"""
egx_flow_scraper.py
===================
يسحب النشرة اليومية الرسمية من موقع البورصة المصرية (EGX)
ويستخرج جدول تعاملات فئات المستثمرين (أجانب، مؤسسات، أفراد)
باستخدام Playwright لتخطي F5 WAF + pdfplumber لقراءة الـ PDF.

الاستخدام:
    python egx_flow_scraper.py               # اليوم الحالي
    python egx_flow_scraper.py --date 2026-07-30  # تاريخ محدد
    python egx_flow_scraper.py --dry-run          # بدون حفظ في DB
"""

import os, sys, re, time, logging, argparse, tempfile
from datetime import date, datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv

# ── Logging ────────────────────────────────────────────────────────────────────
log_dir = Path(__file__).parent / 'logs'
log_dir.mkdir(exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(log_dir / 'egx_flow_scraper.log', encoding='utf-8'),
    ]
)
logger = logging.getLogger('tradeora.egx_flow')

load_dotenv()

# ── Supabase ───────────────────────────────────────────────────────────────────
from supabase import create_client, Client
url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
sb: Client = create_client(url, key)

# ── Constants ──────────────────────────────────────────────────────────────────
EGX_REPORTS_URL = 'https://www.egx.com.eg/ar/Services_Reports.aspx'
EGX_BASE        = 'https://www.egx.com.eg'

# Arabic keywords to find the investor types table in PDF
FOREIGN_KEYWORDS   = ['الأجانب', 'أجانب', 'المستثمرون الأجانب']
INST_EG_KEYWORDS   = ['المؤسسات المصرية', 'مؤسسات مصرية']
ARAB_KEYWORDS      = ['العرب', 'المستثمرون العرب', 'عرب']
IND_EG_KEYWORDS    = ['الأفراد المصريون', 'أفراد مصريون', 'الأفراد']


# ══════════════════════════════════════════════════════════════════════════════
# STEP 1: Download PDF via Playwright (bypasses F5 WAF)
# ══════════════════════════════════════════════════════════════════════════════
def download_egx_bulletin(target_date: date, save_path: str) -> str | None:
    """
    Uses Playwright to open EGX reports page and download the daily bulletin PDF.
    Returns the PDF local path or None if failed.
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        logger.error("Playwright not installed. Run: pip install playwright && playwright install chromium")
        return None

    logger.info(f"Opening EGX reports page via Playwright for date: {target_date}")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
            ]
        )
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                       '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            locale='ar-EG',
            viewport={'width': 1280, 'height': 800},
        )
        page = context.new_page()

        pdf_url = None
        try:
            page.goto(EGX_REPORTS_URL, timeout=30000, wait_until='domcontentloaded')
            time.sleep(3)

            # Find PDF link – look for DailyDataFile or similar
            links = page.query_selector_all('a[href*=".pdf"], a[href*="DailyData"], a[href*="daily"]')
            logger.info(f"Found {len(links)} potential PDF links")

            date_str_formats = [
                target_date.strftime('%Y%m%d'),
                target_date.strftime('%Y-%m-%d'),
                target_date.strftime('%d%m%Y'),
                target_date.strftime('%d-%m-%Y'),
            ]

            for link in links:
                href = link.get_attribute('href') or ''
                text = (link.inner_text() or '').strip()
                logger.debug(f"  Link: {text} → {href}")

                # Check if it's today's bulletin
                is_target = any(ds in href or ds in text for ds in date_str_formats)
                is_bulletin = any(k in href.lower() or k in text for k in
                                  ['daily', 'يومي', 'bulletin', 'nshrt', 'نشرة'])

                if is_target or is_bulletin:
                    if not href.startswith('http'):
                        href = EGX_BASE + href
                    pdf_url = href
                    logger.info(f"Found bulletin PDF: {pdf_url}")
                    break

            # Fallback: download the first PDF on page
            if not pdf_url and links:
                href = links[0].get_attribute('href') or ''
                if not href.startswith('http'):
                    href = EGX_BASE + href
                if '.pdf' in href.lower():
                    pdf_url = href
                    logger.warning(f"Using fallback PDF link: {pdf_url}")

        except Exception as e:
            logger.error(f"Page navigation error: {e}")
        finally:
            browser.close()

    if not pdf_url:
        logger.error("Could not find daily bulletin PDF on EGX page")
        return None

    # Download the PDF
    try:
        import httpx
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': EGX_REPORTS_URL,
        }
        logger.info(f"Downloading PDF from: {pdf_url}")
        with httpx.Client(timeout=30, follow_redirects=True) as client:
            r = client.get(pdf_url, headers=headers)
            r.raise_for_status()
            with open(save_path, 'wb') as f:
                f.write(r.content)
        logger.info(f"PDF downloaded: {len(r.content):,} bytes → {save_path}")
        return save_path
    except Exception as e:
        logger.error(f"PDF download failed: {e}")
        return None


# ══════════════════════════════════════════════════════════════════════════════
# STEP 2: Parse investor flows from PDF
# ══════════════════════════════════════════════════════════════════════════════
def parse_number(text: str) -> float | None:
    """Convert Arabic/English formatted number string to float."""
    if not text:
        return None
    # Remove commas, spaces, Arabic thousands separators
    cleaned = re.sub(r'[,،\s]', '', text.strip())
    # Handle negative in parentheses (1,234) → -1234
    if cleaned.startswith('(') and cleaned.endswith(')'):
        cleaned = '-' + cleaned[1:-1]
    try:
        return float(cleaned)
    except ValueError:
        return None


def extract_row_numbers(line: str) -> list[float]:
    """Extract all numbers from a line of text."""
    pattern = r'[\(\-]?[\d,،]+\.?\d*\)?'
    matches = re.findall(pattern, line)
    numbers = []
    for m in matches:
        n = parse_number(m)
        if n is not None:
            numbers.append(n)
    return numbers


def parse_egx_bulletin(pdf_path: str) -> dict | None:
    """
    Parse the EGX daily bulletin PDF and extract investor type flows.
    Returns dict with foreigners_net, egyptian_inst_net, arab_net, etc.
    """
    try:
        import pdfplumber
    except ImportError:
        logger.error("pdfplumber not installed. Run: pip install pdfplumber")
        return None

    result = {
        'foreigners_buy_egp':    None,
        'foreigners_sell_egp':   None,
        'foreigners_net_egp':    None,
        'foreign_inst_buy_egp':  None,
        'foreign_inst_sell_egp': None,
        'foreign_inst_net_egp':  None,
        'egyptian_inst_buy_egp': None,
        'egyptian_inst_sell_egp':None,
        'egyptian_inst_net_egp': None,
        'arab_buy_egp':          None,
        'arab_sell_egp':         None,
        'arab_net_egp':          None,
        'egyptian_ind_buy_egp':  None,
        'egyptian_ind_sell_egp': None,
        'egyptian_ind_net_egp':  None,
        'total_volume_egp':      None,
    }

    try:
        with pdfplumber.open(pdf_path) as pdf:
            full_text = ''
            for page in pdf.pages:
                text = page.extract_text() or ''
                full_text += text + '\n'
                logger.debug(f"Page {page.page_number}: {len(text)} chars")

        lines = full_text.split('\n')
        logger.info(f"Total lines in PDF: {len(lines)}")

        # Find the investor types section
        section_found = False
        for i, line in enumerate(lines):
            # Detect the investor types table header
            if any(k in line for k in ['فئات المستثمرين', 'تعاملات المستثمرين', 'Investor Type']):
                section_found = True
                logger.info(f"Found investor types section at line {i}: {line.strip()}")

            if not section_found:
                continue

            # Foreigners total row
            if any(k in line for k in FOREIGN_KEYWORDS) and 'مؤسسات' not in line:
                nums = extract_row_numbers(line)
                if len(nums) >= 2:
                    result['foreigners_buy_egp']  = nums[0]
                    result['foreigners_sell_egp'] = nums[1]
                    result['foreigners_net_egp']  = nums[2] if len(nums) > 2 else nums[0] - nums[1]
                    logger.info(f"Foreigners: buy={nums[0]:,.0f}, sell={nums[1]:,.0f}, net={result['foreigners_net_egp']:,.0f}")

            # Foreign institutions
            elif 'مؤسسات أجنبية' in line or ('مؤسسات' in line and 'أجنب' in line):
                nums = extract_row_numbers(line)
                if len(nums) >= 2:
                    result['foreign_inst_buy_egp']  = nums[0]
                    result['foreign_inst_sell_egp'] = nums[1]
                    result['foreign_inst_net_egp']  = nums[2] if len(nums) > 2 else nums[0] - nums[1]

            # Egyptian institutions
            elif any(k in line for k in INST_EG_KEYWORDS):
                nums = extract_row_numbers(line)
                if len(nums) >= 2:
                    result['egyptian_inst_buy_egp']  = nums[0]
                    result['egyptian_inst_sell_egp'] = nums[1]
                    result['egyptian_inst_net_egp']  = nums[2] if len(nums) > 2 else nums[0] - nums[1]
                    logger.info(f"EG Institutions: net={result['egyptian_inst_net_egp']:,.0f}")

            # Arab investors
            elif any(k in line for k in ARAB_KEYWORDS):
                nums = extract_row_numbers(line)
                if len(nums) >= 2:
                    result['arab_buy_egp']  = nums[0]
                    result['arab_sell_egp'] = nums[1]
                    result['arab_net_egp']  = nums[2] if len(nums) > 2 else nums[0] - nums[1]

            # Egyptian individuals
            elif any(k in line for k in IND_EG_KEYWORDS):
                nums = extract_row_numbers(line)
                if len(nums) >= 2:
                    result['egyptian_ind_buy_egp']  = nums[0]
                    result['egyptian_ind_sell_egp'] = nums[1]
                    result['egyptian_ind_net_egp']  = nums[2] if len(nums) > 2 else nums[0] - nums[1]

            # Total market volume
            elif 'إجمالي' in line and ('السوق' in line or 'التداول' in line):
                nums = extract_row_numbers(line)
                if nums:
                    result['total_volume_egp'] = max(nums)  # largest number = total

    except Exception as e:
        logger.error(f"PDF parsing error: {e}")
        return None

    # Validate we got at least foreigners data
    if result['foreigners_net_egp'] is None and result['foreigners_buy_egp'] is None:
        logger.warning("Could not extract foreigners data from PDF")
        logger.info("Dumping first 100 lines for debugging:")
        for line in lines[:100]:
            if line.strip():
                logger.info(f"  {line.strip()}")
        return None

    return result


# ══════════════════════════════════════════════════════════════════════════════
# STEP 3: Store in Supabase
# ══════════════════════════════════════════════════════════════════════════════
def save_to_db(trade_date: date, flows: dict, pdf_url: str = None) -> bool:
    """Upsert daily investor flows into Supabase."""
    try:
        record = {
            'trade_date': trade_date.isoformat(),
            'source':     'EGX_OFFICIAL',
            **{k: v for k, v in flows.items() if v is not None},
        }
        if pdf_url:
            record['pdf_url'] = pdf_url

        sb.table('daily_investor_flows')\
          .upsert(record, on_conflict='trade_date')\
          .execute()

        logger.info(f"✅ Saved flows for {trade_date} to Supabase")
        return True
    except Exception as e:
        logger.error(f"DB save error: {e}")
        return False


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════
def main():
    parser = argparse.ArgumentParser(description='EGX Daily Investor Flow Scraper')
    parser.add_argument('--date',    type=str, default=None,
                        help='Target date YYYY-MM-DD (default: today)')
    parser.add_argument('--dry-run', action='store_true',
                        help='Parse PDF but do not save to DB')
    parser.add_argument('--pdf',     type=str, default=None,
                        help='Use local PDF file instead of downloading')
    args = parser.parse_args()

    target_date = date.today()
    if args.date:
        try:
            target_date = datetime.strptime(args.date, '%Y-%m-%d').date()
        except ValueError:
            logger.error(f"Invalid date format: {args.date}. Use YYYY-MM-DD")
            sys.exit(1)

    logger.info('=' * 60)
    logger.info(f'EGX Investor Flow Scraper – {target_date}')
    logger.info('=' * 60)

    # Use provided PDF or download
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
        tmp_path = tmp.name

    pdf_path = args.pdf
    pdf_url  = None

    if not pdf_path:
        pdf_path = download_egx_bulletin(target_date, tmp_path)
        if not pdf_path:
            logger.error("Failed to download bulletin. Exiting.")
            sys.exit(1)

    # Parse
    flows = parse_egx_bulletin(pdf_path)
    if not flows:
        logger.error("Failed to parse investor flows from PDF.")
        sys.exit(1)

    # Report
    logger.info('─' * 40)
    logger.info('📊 Extracted Investor Flows:')
    logger.info(f"  🌍 Foreigners NET:      {flows.get('foreigners_net_egp', 'N/A'):>15,.0f} EGP")
    logger.info(f"  🏢 EG Institutions NET: {flows.get('egyptian_inst_net_egp', 'N/A'):>15,.0f} EGP")
    logger.info(f"  🇸🇦 Arab NET:            {flows.get('arab_net_egp', 'N/A'):>15,.0f} EGP")
    logger.info(f"  👤 EG Individuals NET:  {flows.get('egyptian_ind_net_egp', 'N/A'):>15,.0f} EGP")
    logger.info(f"  📈 Total Volume:        {flows.get('total_volume_egp', 'N/A'):>15,.0f} EGP")
    logger.info('─' * 40)

    if args.dry_run:
        logger.info('[DRY RUN] Not saving to database.')
        return

    save_to_db(target_date, flows, pdf_url)

    # Cleanup temp file
    try:
        if not args.pdf and os.path.exists(tmp_path):
            os.remove(tmp_path)
    except:
        pass


if __name__ == '__main__':
    main()
