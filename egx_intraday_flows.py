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
sb: Client | None = create_client(url, key) if (url and key) else None

INTRADAY_URL = 'https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx'
HOME_URL     = 'https://www.egx.com.eg/ar/Home.aspx'



ARABIC_DIGITS_TRANS = str.maketrans('٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789')

def parse_egp(text: str) -> float | None:
    """Convert EGP number string → float. Handles Eastern Arabic digits, commas, negatives, invisible RTL/ALM marks."""
    if not text:
        return None
    cleaned = str(text).strip()
    # 1. Translate Arabic/Persian digits to standard ASCII digits
    cleaned = cleaned.translate(ARABIC_DIGITS_TRANS)
    # 2. Remove Arabic formatting chars, non-breaking spaces, RTL marks, ALM (\u061c), and commas
    cleaned = re.sub(r'[\u061c\u200b\u200c\u200d\u200e\u200f\u202a-\u202e\xa0]', '', cleaned)
    cleaned = re.sub(r'[\s،,٬]', '', cleaned)
    cleaned = cleaned.replace('٫', '.')
    # 3. Handle bracketed negatives like (300,000)
    if cleaned.startswith('(') and cleaned.endswith(')'):
        cleaned = '-' + cleaned[1:-1]
    # 4. Handle Arabic minus signs & dashes
    cleaned = re.sub(r'[−–—ـ]', '-', cleaned)
    # Keep only digits, dot, and leading minus
    cleaned = re.sub(r'[^\d.-]', '', cleaned)
    try:
        return float(cleaned)
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

    # Log current Cairo time for context
    import pytz
    cairo_tz = pytz.timezone('Africa/Cairo')
    now_cairo = datetime.now(cairo_tz).time()
    logger.info(f"Scraper execution time (Cairo): {now_cairo}")

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
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--window-size=1920,1080',
            ]
        )
        context = browser.new_context(
            user_agent=(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                'AppleWebKit/537.36 (KHTML, like Gecko) '
                'Chrome/124.0.0.0 Safari/537.36'
            ),
            locale='ar-EG',
            ignore_https_errors=True,
            extra_http_headers={
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
            }
        )
        page = context.new_page()
        extracted = None

        try:
            # Step 1: Open Home page first to acquire session cookies
            logger.info("Step 1: Loading EGX Home page to acquire session cookies...")
            try:
                page.goto(HOME_URL, timeout=30000)
                time.sleep(3)
            except Exception as ex:
                logger.warning(f"Home page load warning: {ex}")

            # Step 2: Navigate to InvestorsTypeCharts.aspx with retries
            logger.info("Step 2: Loading InvestorsTypeCharts.aspx...")
            loaded = False
            for nav_attempt in range(1, 4):
                try:
                    page.goto(INTRADAY_URL, timeout=45000, wait_until='domcontentloaded')
                    time.sleep(4)
                    loaded = True
                    break
                except Exception as ex:
                    logger.warning(f"  Navigation attempt {nav_attempt} warning: {ex}")
                    time.sleep(3)

            if not loaded:
                logger.error("  ❌ Failed to load page after 3 navigation attempts")
                return None

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
    Parse the 3 EGX flow tables (Total / Retail / Institutional) from the extracted DOM data.
    EGX table structure (RTL):
      Rows 0..2: Total (إجمالي) -> Egyptians, Arabs, Foreigners
      Rows 3..5: Retail (أفراد) -> Egyptians, Arabs, Foreigners
      Rows 6..8: Institutional (مؤسسات) -> Egyptians, Arabs, Foreigners
    Columns: Sell | Buy | Net (or Net | Buy | Sell depending on header)
    """
    tables = extracted.get('tables', [])
    all_text = extracted.get('all_text', '')

    result = {
        'trade_date':  target_date.isoformat(),
        'source':      'EGX_INTRADAY_LIVE',
        'scraped_at':  datetime.utcnow().isoformat() + 'Z',
    }

    NAT_KEYS = {
        'egyptian': ['مصري', 'مصريين', 'المصري'],
        'arab':     ['عرب', 'العرب', 'عربي'],
        'foreign':  ['أجانب', 'الأجانب', 'أجنبي', 'اجانب'],
    }

    def detect_nat(cell: str) -> str | None:
        for nat, keys in NAT_KEYS.items():
            for k in keys:
                if k in cell:
                    return nat
        return None

    def extract_row_numbers(cells: list[str]) -> list[float]:
        nums = []
        for c in cells:
            v = parse_egp(c)
            if v is not None:
                nums.append(v)
        return nums

    def detect_column_order(headers: list[str]) -> str:
        header_text = ' '.join(headers).lower()
        if 'صافي' in header_text and headers:
            for i, h in enumerate(headers):
                if 'صافي' in h:
                    if i == len(headers) - 1:
                        return 'sell_buy_net'
                    elif i == 1:
                        return 'net_buy_sell'
        return 'sell_buy_net'

    def is_clean_label(label: str) -> bool:
        if not label:
            return False
        l = str(label).strip()
        if len(l) > 25 or '\n' in l or '%' in l or '0M' in l or 'بحث' in l:
            return False
        return True

    # Gather all clean nationality rows across all extracted tables
    nat_rows = []
    types_prefixes = [
        ('total',         {'egyptian': 'egyptian_total', 'arab': 'arab',      'foreign': 'foreigners'}),
        ('retail',        {'egyptian': 'egyptian_ind',   'arab': 'arab_ind',  'foreign': 'foreign_ind'}),
        ('institutional', {'egyptian': 'egyptian_inst',  'arab': 'arab_inst', 'foreign': 'foreign_inst'}),
    ]

    valid_tables = []
    for tbl in tables:
        col_order = detect_column_order(tbl.get('headers', []))
        tbl_nat_rows = []
        seen_nats = set()
        for r in tbl.get('rows', []):
            if not r:
                continue
            label = str(r[0])
            if not is_clean_label(label):
                continue
            nat = detect_nat(label)
            if not nat or nat in seen_nats:
                continue
            nums = extract_row_numbers(r[1:])
            if len(nums) >= 2:
                if col_order == 'sell_buy_net':
                    sell = nums[0] if len(nums) > 0 else 0
                    buy  = nums[1] if len(nums) > 1 else 0
                    net  = nums[2] if len(nums) > 2 else (buy - sell)
                else:
                    net  = nums[0] if len(nums) > 0 else 0
                    buy  = nums[1] if len(nums) > 1 else 0
                    sell = nums[2] if len(nums) > 2 else (buy - net)
                tbl_nat_rows.append((nat, sell, buy, net))
                seen_nats.add(nat)
        
        # If this table contains all 3 nationalities, it's a valid flow table
        if len(tbl_nat_rows) == 3:
            valid_tables.append(tbl_nat_rows)
            if len(valid_tables) == 3:
                break

    logger.info(f"Extracted {len(valid_tables)} valid 3-nationality tables from DOM")

    for tbl_idx, rows in enumerate(valid_tables):
        ttype, pre_map = types_prefixes[tbl_idx]
        for nat, sell, buy, net in rows:
            pre = pre_map[nat]
            result[f'{pre}_sell_egp'] = sell
            result[f'{pre}_buy_egp']  = buy
            result[f'{pre}_net_egp']  = net
            logger.info(f"  ✅ [{ttype}] {pre}: sell={sell:,.0f} buy={buy:,.0f} net={net:,.0f}")

    # Compute totals if total table was missing or needs calculation
    if not result.get('egyptian_total_buy_egp') and result.get('egyptian_ind_buy_egp') and result.get('egyptian_inst_buy_egp'):
        result['egyptian_total_buy_egp']  = result['egyptian_ind_buy_egp']  + result['egyptian_inst_buy_egp']
        result['egyptian_total_sell_egp'] = result.get('egyptian_ind_sell_egp', 0) + result.get('egyptian_inst_sell_egp', 0)
        result['egyptian_total_net_egp']  = result.get('egyptian_ind_net_egp', 0)  + result.get('egyptian_inst_net_egp', 0)
        logger.info("  📐 Computed egyptian_total from ind+inst")

    if not result.get('arab_buy_egp') and result.get('arab_ind_buy_egp') and result.get('arab_inst_buy_egp'):
        result['arab_buy_egp']  = result['arab_ind_buy_egp']  + result['arab_inst_buy_egp']
        result['arab_sell_egp'] = result.get('arab_ind_sell_egp', 0) + result.get('arab_inst_sell_egp', 0)
        result['arab_net_egp']  = result.get('arab_ind_net_egp', 0)  + result.get('arab_inst_net_egp', 0)
        logger.info("  📐 Computed arab_total from ind+inst")

    if not result.get('foreigners_buy_egp') and result.get('foreign_ind_buy_egp') and result.get('foreign_inst_buy_egp'):
        result['foreigners_buy_egp']  = result['foreign_ind_buy_egp']  + result['foreign_inst_buy_egp']
        result['foreigners_sell_egp'] = result.get('foreign_ind_sell_egp', 0) + result.get('foreign_inst_sell_egp', 0)
        result['foreigners_net_egp']  = result.get('foreign_ind_net_egp', 0)  + result.get('foreign_inst_net_egp', 0)
        logger.info("  📐 Computed foreigners_total from ind+inst")

    # Set total market volume
    tot_buy = (result.get('egyptian_total_buy_egp', 0) or 0) + (result.get('arab_buy_egp', 0) or 0) + (result.get('foreigners_buy_egp', 0) or 0)
    if tot_buy > 0:
        result['total_volume_egp'] = tot_buy

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
    logger.info(f"  Total Arabs:      buy={result.get('arab_buy_egp',0):>20,.0f}  sell={result.get('arab_sell_egp',0):>20,.0f}  net={result.get('arab_net_egp',0):>+20,.0f}")
    logger.info(f"  Total Foreigners: buy={result.get('foreigners_buy_egp',0):>20,.0f}  sell={result.get('foreigners_sell_egp',0):>20,.0f}  net={result.get('foreigners_net_egp',0):>+20,.0f}")
    logger.info(f"  Retail EG:        buy={result.get('egyptian_ind_buy_egp',0):>20,.0f}  sell={result.get('egyptian_ind_sell_egp',0):>20,.0f}  net={result.get('egyptian_ind_net_egp',0):>+20,.0f}")
    logger.info(f"  Retail Arabs:     buy={result.get('arab_ind_buy_egp',0):>20,.0f}  sell={result.get('arab_ind_sell_egp',0):>20,.0f}  net={result.get('arab_ind_net_egp',0):>+20,.0f}")
    logger.info(f"  Retail Foreigners:buy={result.get('foreign_ind_buy_egp',0):>20,.0f}  sell={result.get('foreign_ind_sell_egp',0):>20,.0f}  net={result.get('foreign_ind_net_egp',0):>+20,.0f}")
    logger.info(f"  Inst EG:          buy={result.get('egyptian_inst_buy_egp',0):>20,.0f}  sell={result.get('egyptian_inst_sell_egp',0):>20,.0f}  net={result.get('egyptian_inst_net_egp',0):>+20,.0f}")
    logger.info(f"  Inst Arabs:       buy={result.get('arab_inst_buy_egp',0):>20,.0f}  sell={result.get('arab_inst_sell_egp',0):>20,.0f}  net={result.get('arab_inst_net_egp',0):>+20,.0f}")
    logger.info(f"  Inst Foreigners:  buy={result.get('foreign_inst_buy_egp',0):>20,.0f}  sell={result.get('foreign_inst_sell_egp',0):>20,.0f}  net={result.get('foreign_inst_net_egp',0):>+20,.0f}")
    logger.info("=" * 60)

    return result


ALLOWED_COLS = {
    'trade_date', 'source', 'pdf_url', 'created_at', 'updated_at', 'total_volume_egp',
    'foreigners_buy_egp', 'foreigners_sell_egp', 'foreigners_net_egp',
    'foreigners_total_buy_egp', 'foreigners_total_sell_egp', 'foreigners_total_net_egp',
    'foreign_inst_buy_egp', 'foreign_inst_sell_egp', 'foreign_inst_net_egp',
    'foreign_ind_buy_egp', 'foreign_ind_sell_egp', 'foreign_ind_net_egp',
    'egyptian_inst_buy_egp', 'egyptian_inst_sell_egp', 'egyptian_inst_net_egp',
    'egyptian_ind_buy_egp', 'egyptian_ind_sell_egp', 'egyptian_ind_net_egp',
    'egyptians_total_buy_egp', 'egyptians_total_sell_egp', 'egyptians_total_net_egp',
    'arab_buy_egp', 'arab_sell_egp', 'arab_net_egp',
    'arab_total_buy_egp', 'arab_total_sell_egp', 'arab_total_net_egp',
    'arab_inst_buy_egp', 'arab_inst_sell_egp', 'arab_inst_net_egp',
    'arab_ind_buy_egp', 'arab_ind_sell_egp', 'arab_ind_net_egp',
}


def save_to_db(flows: dict) -> bool:
    """Upsert valid flow fields into Supabase and CockroachDB daily_investor_flows."""
    if not sb:
        logger.error("Supabase client is not initialized.")
        return False
    try:
        clean = {
            k: (int(v) if isinstance(v, float) and v == int(v) else v)
            for k, v in flows.items()
            if k in ALLOWED_COLS and v is not None
        }
        sb.table('daily_investor_flows') \
          .upsert(clean, on_conflict='trade_date') \
          .execute()
        logger.info(f"✅ Saved {len(clean)} fields to Supabase for {flows['trade_date']}")

        # Also sync directly to CockroachDB if DATABASE_URL is present
        cr_url = os.getenv("DATABASE_URL") or "postgresql://tradeora:gdW77s_jShDK8nChydbbCg@raw-donkey-30500.j77.aws-eu-central-1.cockroachlabs.cloud:26257/defaultdb?sslmode=require"
        try:
            import psycopg2
            conn = psycopg2.connect(cr_url)
            cur = conn.cursor()
            cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'daily_investor_flows'")
            cr_cols = set(r[0] for r in cur.fetchall())

            keys = [k for k in clean.keys() if k in cr_cols]
            values = [clean[k] for k in keys]
            set_clauses = [f"{k} = EXCLUDED.{k}" for k in keys if k not in ('trade_date', 'id', 'created_at')]

            sql = f"""
            INSERT INTO daily_investor_flows ({", ".join(keys)})
            VALUES ({", ".join(["%s"] * len(values))})
            ON CONFLICT (trade_date) DO UPDATE SET {", ".join(set_clauses)};
            """
            cur.execute(sql, values)
            conn.commit()
            cur.close()
            conn.close()
            logger.info(f"✅ Synced CockroachDB for {flows['trade_date']}")
        except Exception as cr_err:
            logger.warning(f"CockroachDB direct sync warning: {cr_err}")

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
        logger.warning("⚠️ Could not extract live DOM flow data. Trying PDF bulletin fallback...")
        try:
            from egx_flow_scraper import download_egx_bulletin, parse_egx_bulletin
            import tempfile
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
                tmp_path = tmp.name
            pdf_path = download_egx_bulletin(target_date, tmp_path)
            if pdf_path:
                flows = parse_egx_bulletin(pdf_path)
                if flows:
                    logger.info("  ✅ Successfully extracted flow data from PDF bulletin fallback!")
                try:
                    if os.path.exists(tmp_path):
                        os.remove(tmp_path)
                except Exception:
                    pass
        except Exception as fallback_err:
            logger.warning(f"  PDF fallback attempt error: {fallback_err}")

    if not flows:
        logger.warning("⚠️ No flow data extracted during this run (EGX live connection reset or page unavailable). Exiting gracefully for next scheduled attempt.")
        sys.exit(0)

    if args.dry_run:
        logger.info('[DRY RUN] Extracted data (not saving):')
        for k, v in sorted(flows.items()):
            if not k.startswith('_'):
                logger.info(f"  {k}: {v:,.0f}" if isinstance(v, (int, float)) else f"  {k}: {v}")
        return

    success = save_to_db(flows)
    sys.exit(0 if success else 0)


if __name__ == '__main__':
    main()
