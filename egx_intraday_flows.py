"""
egx_intraday_flows.py
======================
يسحب بيانات تدفقات المستثمرين اللحظية خلال الجلسة من:
  https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx

يستخدم Playwright لتخطي F5 WAF ثم يحلل DOM مباشرة
ويحدث جدول daily_investor_flows في Supabase كل 30 دقيقة.

الاستخدام:
    python egx_intraday_flows.py              # اليوم الحالي
    python egx_intraday_flows.py --date 2026-08-02
    python egx_intraday_flows.py --dry-run    # بدون حفظ
"""

import os, sys, re, time, logging, argparse
from datetime import date, datetime
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
        logging.FileHandler(log_dir / 'egx_intraday_flows.log', encoding='utf-8'),
    ]
)
logger = logging.getLogger('tradeora.egx_intraday')

load_dotenv()

# ── Supabase ───────────────────────────────────────────────────────────────────
from supabase import create_client, Client
url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
sb: Client = create_client(url, key)

INTRADAY_URL = 'https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx'
HOME_URL     = 'https://www.egx.com.eg/ar/Home.aspx'


def parse_number(text: str) -> float | None:
    """Convert formatted EGP string to float. Handles commas, negatives, Arabic."""
    if not text:
        return None
    cleaned = re.sub(r'[,،\s\u202b\u202c\xa0]', '', text.strip())
    if cleaned.startswith('(') and cleaned.endswith(')'):
        cleaned = '-' + cleaned[1:-1]
    cleaned = cleaned.replace('−', '-').replace('–', '-')
    try:
        v = float(cleaned)
        return v if v != 0 else None
    except ValueError:
        return None


def extract_all_numbers(html: str) -> list[float]:
    """Extract all large numeric values (>= 1M EGP) from HTML."""
    # Match number patterns like 25,168,696,300 or -488,064,796
    pattern = r'-?[\d]{1,3}(?:,\d{3})+'
    matches = re.findall(pattern, html)
    result = []
    for m in matches:
        v = parse_number(m)
        if v is not None and abs(v) >= 1_000_000:
            result.append(v)
    return result


def scrape_intraday_page(target_date: date) -> dict | None:
    """
    Use Playwright to load InvestorsTypeCharts.aspx and extract live flow data.
    Returns dict of flow values or None on failure.
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        logger.error("Playwright not installed. Run: pip install playwright && playwright install chromium")
        return None

    logger.info(f"Opening EGX InvestorsTypeCharts page for {target_date}...")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox',
                  '--disable-blink-features=AutomationControlled']
        )
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                       '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            locale='ar-EG',
            viewport={'width': 1366, 'height': 768},
        )
        page = context.new_page()

        html = None
        try:
            # Step 1: bypass F5 WAF via home page first
            logger.info("Step 1: Loading home page to bypass WAF...")
            page.goto(HOME_URL, timeout=30000, wait_until='domcontentloaded')
            time.sleep(3)

            # Step 2: load the investor charts page
            logger.info("Step 2: Loading InvestorsTypeCharts.aspx...")
            page.goto(INTRADAY_URL, timeout=40000, wait_until='networkidle')
            time.sleep(6)  # wait for AJAX/UpdatePanel to load

            # Step 3: try to extract structured table data
            logger.info("Step 3: Extracting structured data from DOM...")

            # Try GridView / table extraction first
            rows_data = page.evaluate("""
                () => {
                    const results = [];
                    // Look for all table rows with numbers
                    const rows = document.querySelectorAll('table tr, .grid-row, [class*="row"]');
                    rows.forEach(row => {
                        const text = row.innerText || row.textContent || '';
                        if (text.trim()) results.push(text.trim());
                    });
                    
                    // Also get all span/label text that looks like numbers
                    const spans = document.querySelectorAll('span, label, td, th');
                    const nums = [];
                    spans.forEach(el => {
                        const t = (el.innerText || '').trim();
                        if (/^-?[\\d,،]+$/.test(t.replace(/\\s/g, '')) && t.length > 5) {
                            nums.push(t);
                        }
                    });
                    
                    return { rows: results, nums: nums };
                }
            """)

            logger.info(f"Found {len(rows_data.get('rows', []))} rows, {len(rows_data.get('nums', []))} numeric spans")
            for r in rows_data.get('rows', [])[:30]:
                if r.strip():
                    logger.debug(f"  Row: {r[:120]}")

            html = page.content()

        except Exception as e:
            logger.error(f"Page error: {e}")
        finally:
            browser.close()

    if not html:
        return None

    # ── Parse extracted data ─────────────────────────────────────────────────
    return parse_flows_from_html(html, rows_data if rows_data else {}, target_date)


def parse_flows_from_html(html: str, dom_data: dict, target_date: date) -> dict | None:
    """
    Parse investor flow values from the EGX InvestorsTypeCharts page HTML.
    Tries structured table rows first, then falls back to all-number extraction.
    """
    result = {}

    # ── Strategy 1: Parse from table rows ─────────────────────────────────────
    rows = dom_data.get('rows', [])
    for row in rows:
        nums = [parse_number(t) for t in re.findall(r'-?[\d,،]+', row)
                if parse_number(t) is not None and abs(parse_number(t)) >= 1_000_000]

        if 'أجانب' in row or 'الأجانب' in row:
            if len(nums) >= 2:
                result['foreigners_buy_egp']  = nums[0]
                result['foreigners_sell_egp'] = nums[1]
                result['foreigners_net_egp']  = nums[2] if len(nums) > 2 else nums[0] - nums[1]
                logger.info(f"✅ Foreigners: buy={nums[0]:,.0f} sell={nums[1]:,.0f} net={result['foreigners_net_egp']:,.0f}")

        elif 'مؤسسات مصرية' in row or 'المؤسسات المصرية' in row:
            if len(nums) >= 2:
                result['egyptian_inst_buy_egp']  = nums[0]
                result['egyptian_inst_sell_egp'] = nums[1]
                result['egyptian_inst_net_egp']  = nums[2] if len(nums) > 2 else nums[0] - nums[1]
                logger.info(f"✅ EG Inst: net={result['egyptian_inst_net_egp']:,.0f}")

        elif 'مؤسسات أجنبية' in row or ('مؤسسات' in row and 'أجنب' in row):
            if len(nums) >= 2:
                result['foreign_inst_buy_egp']  = nums[0]
                result['foreign_inst_sell_egp'] = nums[1]
                result['foreign_inst_net_egp']  = nums[2] if len(nums) > 2 else nums[0] - nums[1]

        elif 'عرب' in row or 'العرب' in row:
            if len(nums) >= 2:
                result['arab_buy_egp']  = nums[0]
                result['arab_sell_egp'] = nums[1]
                result['arab_net_egp']  = nums[2] if len(nums) > 2 else nums[0] - nums[1]

        elif 'أفراد مصريون' in row or 'الأفراد المصريون' in row or 'الأفراد' in row:
            if len(nums) >= 2:
                result['egyptian_ind_buy_egp']  = nums[0]
                result['egyptian_ind_sell_egp'] = nums[1]
                result['egyptian_ind_net_egp']  = nums[2] if len(nums) > 2 else nums[0] - nums[1]

        elif 'إجمالي' in row and nums:
            result['total_volume_egp'] = max(nums)

    # ── Strategy 2: Fallback — extract all large numbers from raw HTML ─────────
    if not result.get('foreigners_net_egp'):
        logger.warning("Strategy 1 failed — falling back to raw number extraction")
        all_nums = extract_all_numbers(html)
        all_nums_sorted = sorted(set(all_nums), key=abs, reverse=True)
        logger.info(f"Top 20 numbers found in HTML: {[f'{n:,.0f}' for n in all_nums_sorted[:20]]}")

        # The EGX page renders numbers grouped by category; we can't reliably
        # assign them without table context — log them for debugging
        if all_nums_sorted:
            result['_raw_numbers_debug'] = [int(n) for n in all_nums_sorted[:20]]
            logger.info("⚠️ Cannot assign raw numbers to categories reliably — need table structure")
            # Don't return partial/wrong data
            return None

    if not result:
        logger.error("No flow data could be extracted from DOM")
        return None

    result['trade_date'] = target_date.isoformat()
    result['source']     = 'EGX_INTRADAY_LIVE'
    result['scraped_at'] = datetime.utcnow().isoformat() + 'Z'
    return result


def save_to_db(flows: dict) -> bool:
    """Upsert flows into Supabase daily_investor_flows."""
    try:
        clean = {k: v for k, v in flows.items()
                 if not k.startswith('_') and v is not None}
        sb.table('daily_investor_flows') \
          .upsert(clean, on_conflict='trade_date') \
          .execute()
        logger.info(f"✅ Saved intraday flows to DB for {flows['trade_date']}")
        return True
    except Exception as e:
        logger.error(f"DB save error: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description='EGX Intraday Investor Flows Scraper')
    parser.add_argument('--date',    type=str, default=None, help='YYYY-MM-DD')
    parser.add_argument('--dry-run', action='store_true',    help='No DB save')
    args = parser.parse_args()

    target_date = date.today()
    if args.date:
        try:
            target_date = datetime.strptime(args.date, '%Y-%m-%d').date()
        except ValueError:
            logger.error(f"Invalid date: {args.date}")
            sys.exit(1)

    logger.info('=' * 60)
    logger.info(f'EGX Intraday Flows Scraper — {target_date}')
    logger.info('=' * 60)

    flows = scrape_intraday_page(target_date)

    if not flows:
        logger.error("Failed to extract flows. Exiting.")
        sys.exit(1)

    logger.info('─' * 40)
    logger.info('📊 Extracted Live Investor Flows:')
    logger.info(f"  🌍 Foreigners NET:      {flows.get('foreigners_net_egp', 'N/A'):>15}")
    logger.info(f"  🏢 EG Institutions NET: {flows.get('egyptian_inst_net_egp', 'N/A'):>15}")
    logger.info(f"  🇸🇦 Arab NET:            {flows.get('arab_net_egp', 'N/A'):>15}")
    logger.info(f"  👤 EG Individuals NET:  {flows.get('egyptian_ind_net_egp', 'N/A'):>15}")
    logger.info(f"  📈 Total Volume:        {flows.get('total_volume_egp', 'N/A'):>15}")
    logger.info('─' * 40)

    if args.dry_run:
        logger.info('[DRY RUN] Not saving to database.')
        return

    save_to_db(flows)


if __name__ == '__main__':
    main()
