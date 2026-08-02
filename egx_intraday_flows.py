"""
egx_intraday_flows.py — v3 COMPLETE REWRITE
=============================================
يسحب بيانات تدفقات المستثمرين الـ 9 فئات كاملة من:
  https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx

الصفحة تحتوي على 3 جداول:
  Table 1: إجمالي حسب الجنسية (مصريين / عرب / أجانب)
  Table 2: الأفراد حسب الجنسية (مصريين / عرب / أجانب أفراد)
  Table 3: المؤسسات حسب الجنسية (مصريين / عرب / أجانب مؤسسات)

كل جدول: بيع | شراء | صافي  × 3 جنسيات = 9 قيم لكل جدول = 27 قيمة إجمالاً

"""

import os, sys, re, time, logging, json, argparse
from datetime import date, datetime, time as dtime
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


def parse_egp(text: str) -> float | None:
    """Convert EGP number string → float. Handles commas, Arabic negatives, brackets."""
    if not text:
        return None
    cleaned = str(text).strip()
    # Remove Arabic formatting chars, non-breaking spaces, RTL marks
    cleaned = re.sub(r'[\s\u200b\u200c\u200d\u200e\u200f\u202a-\u202e\xa0،,]', '', cleaned)
    cleaned = cleaned.replace(',', '').replace('،', '')
    # Handle bracketed negatives like (300,000)
    if cleaned.startswith('(') and cleaned.endswith(')'):
        cleaned = '-' + cleaned[1:-1]
    # Handle Arabic minus signs
    cleaned = cleaned.replace('−', '-').replace('–', '-').replace('ـ', '')
    try:
        v = float(cleaned)
        return v
    except ValueError:
        return None


def scrape_egx_flows(target_date: date) -> dict | None:
    """
    Use Playwright to load InvestorsTypeCharts.aspx and extract live flow data.
    NOTE: Data is only available during trading session (10:00 AM - 3:00 PM Cairo).
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        logger.error("Playwright not installed. Run: pip install playwright && playwright install chromium")
        return None

    # Check session hours using Cairo timezone (NOT local/UTC time)
    import pytz
    cairo_tz = pytz.timezone('Africa/Cairo')
    now_cairo = datetime.now(cairo_tz).time()
    # Allow scraping until 4:00 PM Cairo to capture post-close final numbers
    if not (dtime(10, 0) <= now_cairo <= dtime(16, 0)):
        logger.warning(f"Market hours check: Cairo time {now_cairo} is outside 10:00-16:00. Skipping.")
        return None

    logger.info(f"🔄 Opening EGX InvestorsTypeCharts.aspx for {target_date}")

    MAX_RETRIES = 3
    for attempt in range(1, MAX_RETRIES + 1):
        logger.info(f"Attempt {attempt}/{MAX_RETRIES}...")
        result = _try_scrape(target_date)
        if result is not None:
            return result
        if attempt < MAX_RETRIES:
            logger.warning(f"Attempt {attempt} failed — retrying in 20s...")
            time.sleep(20)

    logger.error("All attempts failed")
    return None


def _try_scrape(target_date: date) -> dict | None:
    """Single scrape attempt."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return None

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox', '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-web-security',
                '--disable-dev-shm-usage',
            ]
        )
        context = browser.new_context(
            user_agent=(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                'AppleWebKit/537.36 (KHTML, like Gecko) '
                'Chrome/124.0.0.0 Safari/537.36'
            ),
            locale='ar-EG',
            viewport={'width': 1600, 'height': 900},
        )
        page = context.new_page()
        extracted = None

        try:
            # Go directly to the investor flows page
            logger.info("Loading InvestorsTypeCharts.aspx directly...")
            page.goto(INTRADAY_URL, timeout=60000, wait_until='domcontentloaded')
            time.sleep(10)  # Wait for ASP.NET AJAX UpdatePanel to load all 3 tables
            logger.info("  ✅ Page loaded")

            # Step 3: Extract ALL table data via structured JS
            logger.info("Step 3: Extracting all 3 tables from DOM...")

            extracted = page.evaluate("""
                () => {
                    const result = {
                        tables: [],
                        page_title: document.title,
                        all_text: document.body ? document.body.innerText : ''
                    };

                    // Find all HTML tables on the page
                    const tables = document.querySelectorAll('table');
                    tables.forEach((tbl, tIdx) => {
                        const tableData = {
                            index: tIdx,
                            headers: [],
                            rows: []
                        };

                        // Get headers
                        const ths = tbl.querySelectorAll('th');
                        ths.forEach(th => {
                            tableData.headers.push((th.innerText || th.textContent || '').trim());
                        });

                        // Get data rows
                        const trs = tbl.querySelectorAll('tr');
                        trs.forEach(tr => {
                            const cells = [];
                            const tds = tr.querySelectorAll('td, th');
                            tds.forEach(td => {
                                cells.push((td.innerText || td.textContent || '').trim());
                            });
                            if (cells.length >= 2) {
                                tableData.rows.push(cells);
                            }
                        });

                        if (tableData.rows.length > 0) {
                            result.tables.push(tableData);
                        }
                    });

                    // Also extract GridView-style content (ASP.NET WebForms)
                    const gridViews = document.querySelectorAll('[id*="GridView"], [id*="grid"], [class*="grid"], [class*="Grid"]');
                    const gridData = [];
                    gridViews.forEach((gv, i) => {
                        gridData.push({
                            id: gv.id || `grid_${i}`,
                            text: (gv.innerText || '').substring(0, 2000)
                        });
                    });
                    result.gridViews = gridData;

                    // Extract all repeater / panel text
                    const panels = document.querySelectorAll('[id*="Panel"], [id*="Update"], [id*="Content"]');
                    const panelData = [];
                    panels.forEach(p => {
                        const txt = (p.innerText || '').trim();
                        if (txt.length > 50) {
                            panelData.push({ id: p.id || '', text: txt.substring(0, 3000) });
                        }
                    });
                    result.panels = panelData;

                    return result;
                }
            """)

            logger.info(f"Found {len(extracted.get('tables', []))} tables on page")
            for t in extracted.get('tables', []):
                logger.info(f"  Table[{t['index']}]: {len(t['rows'])} rows, headers={t['headers'][:4]}")
                for row in t['rows'][:5]:
                    logger.info(f"    Row: {row[:5]}")

        except Exception as e:
            logger.error(f"Playwright error: {e}")
        finally:
            browser.close()

    if not extracted:
        logger.error("No data extracted from page")
        return None

    return parse_egx_tables(extracted, target_date)


def parse_egx_tables(extracted: dict, target_date: date) -> dict | None:
    """
    Parse the 3 EGX flow tables from the extracted DOM data.

    Expected table structure (RTL — columns appear in Arabic order):
    Col 0: Nationality label (مصريين / عرب / أجانب)
    Col 1: صافي قيمة (Net)
    Col 2: قيمة شراء (Buy)
    Col 3: قيمة بيع (Sell)

    OR sometimes reversed:
    Col 0: Nationality
    Col 1: Sell
    Col 2: Buy
    Col 3: Net

    We detect the column order by looking at headers.
    """
    tables = extracted.get('tables', [])
    all_text = extracted.get('all_text', '')

    result = {
        'trade_date':  target_date.isoformat(),
        'source':      'EGX_INTRADAY_LIVE',
        'scraped_at':  datetime.utcnow().isoformat() + 'Z',
    }

    # ── Try to find the 3 data tables (Total / Retail / Institutional) ──────────
    # Each table should have ~4 rows (header + 3 nationality rows)
    data_tables = [t for t in tables if 2 <= len(t['rows']) <= 8]

    logger.info(f"Candidate data tables: {len(data_tables)}")

    # Map of keywords for nationality detection
    NAT_KEYS = {
        'egyptian': ['مصري', 'مصريين', 'المصري'],
        'arab':     ['عرب', 'العرب', 'عربي'],
        'foreign':  ['أجانب', 'الأجانب', 'أجنبي'],
    }

    def detect_nat(cell: str) -> str | None:
        for nat, keys in NAT_KEYS.items():
            for k in keys:
                if k in cell:
                    return nat
        return None

    def extract_row_numbers(cells: list[str]) -> list[float]:
        """Extract all valid EGP numbers from a row's cells."""
        nums = []
        for c in cells:
            v = parse_egp(c)
            if v is not None:
                nums.append(v)
        return nums

    def detect_column_order(headers: list[str]) -> str:
        """
        Returns 'sell_buy_net' or 'net_buy_sell' based on header text.
        Default: 'sell_buy_net' (as shown on EGX site in Arabic RTL)
        """
        header_text = ' '.join(headers).lower()
        if 'صافي' in header_text and headers:
            # Detect which column position صافي is in
            for i, h in enumerate(headers):
                if 'صافي' in h:
                    if i == len(headers) - 1:
                        return 'sell_buy_net'  # net is last
                    elif i == 1:
                        return 'net_buy_sell'  # net is first after label
        return 'sell_buy_net'  # default based on EGX site structure

    # We expect tables in order: Total → Retail → Institutional
    # Or we can detect by content (which has "مؤسسات" vs "أفراد" header text)
    def classify_table(tbl: dict) -> str | None:
        """Classify table as 'total', 'retail', or 'institutional'."""
        header_text = ' '.join(str(h) for h in tbl.get('headers', []))
        row_text    = ' '.join(str(c) for r in tbl.get('rows', []) for c in r)
        combined    = header_text + ' ' + row_text

        # Look for preceding text context
        if 'مؤسسات' in combined and 'أفراد' not in combined:
            return 'institutional'
        if 'أفراد' in combined and 'مؤسسات' not in combined:
            return 'retail'
        if 'إجمالي' in combined or ('مصري' in combined and 'عرب' in combined and 'أجانب' in combined):
            return 'total'
        return None

    def parse_single_table(tbl: dict, table_type: str) -> dict:
        """
        Parse one table (3 nationality rows) and return field dict.
        Prefix: 'total' → egyptian_total / arab_total / foreigners_total
                'retail' → egyptian_ind / arab_ind / foreign_ind
                'institutional' → egyptian_inst / arab_inst / foreign_inst
        """
        prefixes = {
            'total':         ('egyptian_total', 'arab_total', 'foreigners_total'),
            'retail':        ('egyptian_ind',   'arab_ind',   'foreign_ind'),
            'institutional': ('egyptian_inst',  'arab_inst',  'foreign_inst'),
        }
        eg_pre, ar_pre, fo_pre = prefixes.get(table_type, ('eg', 'ar', 'fo'))

        col_order = detect_column_order(tbl.get('headers', []))
        parsed = {}

        for row in tbl.get('rows', []):
            if not row:
                continue
            label = str(row[0])
            nat = detect_nat(label)
            if nat is None:
                continue

            nums = extract_row_numbers(row[1:])  # skip label cell
            if len(nums) < 2:
                logger.warning(f"  Skipping row (not enough numbers): {row}")
                continue

            # Column order detection
            if col_order == 'sell_buy_net':
                # EGX Arabic table: Sell | Buy | Net (RTL display)
                sell = nums[0] if len(nums) > 0 else 0
                buy  = nums[1] if len(nums) > 1 else 0
                net  = nums[2] if len(nums) > 2 else (buy - sell)
            else:
                # net_buy_sell order
                net  = nums[0] if len(nums) > 0 else 0
                buy  = nums[1] if len(nums) > 1 else 0
                sell = nums[2] if len(nums) > 2 else (buy - net)

            if nat == 'egyptian':
                pre = eg_pre
            elif nat == 'arab':
                pre = ar_pre
            else:
                pre = fo_pre

            parsed[f'{pre}_sell_egp'] = sell
            parsed[f'{pre}_buy_egp']  = buy
            parsed[f'{pre}_net_egp']  = net

            logger.info(f"  ✅ {table_type}/{nat}: sell={sell:,.0f} buy={buy:,.0f} net={net:,.0f}")

        return parsed

    # ── Try structured table parsing ──────────────────────────────────────────
    classified = {'total': None, 'retail': None, 'institutional': None}

    for tbl in data_tables:
        ttype = classify_table(tbl)
        if ttype and classified[ttype] is None:
            classified[ttype] = tbl
            logger.info(f"  Classified Table[{tbl['index']}] as '{ttype}'")

    found_count = sum(1 for v in classified.values() if v is not None)
    logger.info(f"Classified {found_count}/3 tables")

    if found_count >= 2:
        for ttype, tbl in classified.items():
            if tbl:
                parsed = parse_single_table(tbl, ttype)
                result.update(parsed)
    else:
        # Fallback: assume first 3 data tables are Total, Retail, Institutional in order
        logger.warning("Could not classify tables by content — assuming positional order")
        types_order = ['total', 'retail', 'institutional']
        for i, tbl in enumerate(data_tables[:3]):
            ttype = types_order[i]
            parsed = parse_single_table(tbl, ttype)
            result.update(parsed)

    # ── Compute totals if missing ─────────────────────────────────────────────
    # egyptian_total = egyptian_ind + egyptian_inst (if individual tables have data)
    if not result.get('egyptian_total_buy_egp') and result.get('egyptian_ind_buy_egp') and result.get('egyptian_inst_buy_egp'):
        result['egyptian_total_buy_egp']  = result['egyptian_ind_buy_egp']  + result['egyptian_inst_buy_egp']
        result['egyptian_total_sell_egp'] = result.get('egyptian_ind_sell_egp', 0) + result.get('egyptian_inst_sell_egp', 0)
        result['egyptian_total_net_egp']  = result.get('egyptian_ind_net_egp', 0)  + result.get('egyptian_inst_net_egp', 0)
        logger.info("  📐 Computed egyptian_total from ind+inst")

    if not result.get('arab_total_buy_egp') and result.get('arab_ind_buy_egp') and result.get('arab_inst_buy_egp'):
        result['arab_total_buy_egp']  = result['arab_ind_buy_egp']  + result['arab_inst_buy_egp']
        result['arab_total_sell_egp'] = result.get('arab_ind_sell_egp', 0) + result.get('arab_inst_sell_egp', 0)
        result['arab_total_net_egp']  = result.get('arab_ind_net_egp', 0)  + result.get('arab_inst_net_egp', 0)
        logger.info("  📐 Computed arab_total from ind+inst")

    if not result.get('foreigners_total_buy_egp') and result.get('foreign_ind_buy_egp') and result.get('foreign_inst_buy_egp'):
        result['foreigners_total_buy_egp']  = result['foreign_ind_buy_egp']  + result['foreign_inst_buy_egp']
        result['foreigners_total_sell_egp'] = result.get('foreign_ind_sell_egp', 0) + result.get('foreign_inst_sell_egp', 0)
        result['foreigners_total_net_egp']  = result.get('foreign_ind_net_egp', 0)  + result.get('foreign_inst_net_egp', 0)
        logger.info("  📐 Computed foreigners_total from ind+inst")

    # Validate we have at least some real data
    has_data = any(
        isinstance(v, (int, float)) and abs(v) > 1_000_000
        for k, v in result.items()
        if k.endswith('_egp')
    )

    if not has_data:
        logger.error("❌ No valid EGP values extracted — page may not have loaded correctly")
        logger.error(f"All-text sample: {all_text[:500]}")
        return None

    # ── Log summary ───────────────────────────────────────────────────────────
    logger.info("=" * 60)
    logger.info("📊 EXTRACTED FLOWS SUMMARY:")
    logger.info(f"  Total Egyptians:  buy={result.get('egyptian_total_buy_egp',0):>20,.0f}  sell={result.get('egyptian_total_sell_egp',0):>20,.0f}  net={result.get('egyptian_total_net_egp',0):>+20,.0f}")
    logger.info(f"  Total Arabs:      buy={result.get('arab_total_buy_egp',0):>20,.0f}  sell={result.get('arab_total_sell_egp',0):>20,.0f}  net={result.get('arab_total_net_egp',0):>+20,.0f}")
    logger.info(f"  Total Foreigners: buy={result.get('foreigners_total_buy_egp',0):>20,.0f}  sell={result.get('foreigners_total_sell_egp',0):>20,.0f}  net={result.get('foreigners_total_net_egp',0):>+20,.0f}")
    logger.info(f"  Retail EG:        buy={result.get('egyptian_ind_buy_egp',0):>20,.0f}  sell={result.get('egyptian_ind_sell_egp',0):>20,.0f}  net={result.get('egyptian_ind_net_egp',0):>+20,.0f}")
    logger.info(f"  Retail Arabs:     buy={result.get('arab_ind_buy_egp',0):>20,.0f}  sell={result.get('arab_ind_sell_egp',0):>20,.0f}  net={result.get('arab_ind_net_egp',0):>+20,.0f}")
    logger.info(f"  Retail Foreigners:buy={result.get('foreign_ind_buy_egp',0):>20,.0f}  sell={result.get('foreign_ind_sell_egp',0):>20,.0f}  net={result.get('foreign_ind_net_egp',0):>+20,.0f}")
    logger.info(f"  Inst EG:          buy={result.get('egyptian_inst_buy_egp',0):>20,.0f}  sell={result.get('egyptian_inst_sell_egp',0):>20,.0f}  net={result.get('egyptian_inst_net_egp',0):>+20,.0f}")
    logger.info(f"  Inst Arabs:       buy={result.get('arab_inst_buy_egp',0):>20,.0f}  sell={result.get('arab_inst_sell_egp',0):>20,.0f}  net={result.get('arab_inst_net_egp',0):>+20,.0f}")
    logger.info(f"  Inst Foreigners:  buy={result.get('foreign_inst_buy_egp',0):>20,.0f}  sell={result.get('foreign_inst_sell_egp',0):>20,.0f}  net={result.get('foreign_inst_net_egp',0):>+20,.0f}")
    logger.info("=" * 60)

    return result


def save_to_db(flows: dict) -> bool:
    """Upsert all 27 flow values into Supabase daily_investor_flows."""
    try:
        clean = {
            k: (int(v) if isinstance(v, float) and v == int(v) else v)
            for k, v in flows.items()
            if not k.startswith('_') and v is not None
        }
        sb.table('daily_investor_flows') \
          .upsert(clean, on_conflict='trade_date') \
          .execute()
        logger.info(f"✅ Saved {len(clean)} fields to DB for {flows['trade_date']}")
        return True
    except Exception as e:
        logger.error(f"DB save error: {e}", exc_info=True)
        return False


def main():
    parser = argparse.ArgumentParser(description='EGX Complete Investor Flows Scraper v3')
    parser.add_argument('--date',    type=str, default=None, help='Target date YYYY-MM-DD')
    parser.add_argument('--dry-run', action='store_true',    help='Print data without saving')
    parser.add_argument('--bypass-session-guard', action='store_true',
                        help='Skip session hours check (for post-close final capture)')
    args = parser.parse_args()

    target_date = date.today()
    if args.date:
        try:
            target_date = datetime.strptime(args.date, '%Y-%m-%d').date()
        except ValueError:
            logger.error(f"Invalid date format: {args.date}")
            sys.exit(1)

    logger.info('=' * 60)
    logger.info(f'EGX Complete Flows Scraper v3 — {target_date}')
    logger.info('=' * 60)

    # If bypass requested, skip session check by temporarily patching
    if args.bypass_session_guard:
        logger.info("[BYPASS] Skipping session hours guard — post-close final capture")
        # Call _try_scrape directly to bypass the time check in scrape_egx_flows
        result = None
        for attempt in range(1, 4):
            logger.info(f"Attempt {attempt}/3...")
            result = _try_scrape(target_date)
            if result is not None:
                break
            import time
            time.sleep(20)
        flows = result
    else:
        flows = scrape_egx_flows(target_date)

    if not flows:
        logger.error("❌ Failed to extract flow data. Exiting.")
        sys.exit(1)

    if args.dry_run:
        logger.info('[DRY RUN] Extracted data (not saving):')
        for k, v in sorted(flows.items()):
            if not k.startswith('_'):
                logger.info(f"  {k}: {v:,.0f}" if isinstance(v, (int, float)) else f"  {k}: {v}")
        return

    success = save_to_db(flows)
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
