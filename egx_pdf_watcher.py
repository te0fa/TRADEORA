"""
egx_pdf_watcher.py
==================
يراقب مجلد data/egx_bulletins/ ويعالج أي PDF جديد تلقائياً.

الاستخدام:
    python egx_pdf_watcher.py              # معالجة أحدث PDF في المجلد
    python egx_pdf_watcher.py --watch      # مراقبة مستمرة (يشتغل في الخلفية)
    python egx_pdf_watcher.py --file x.pdf # معالجة ملف محدد
    python egx_pdf_watcher.py --report     # عرض آخر 10 أيام
"""

import os, sys, re, time, logging, argparse, hashlib
from datetime import date, datetime
from pathlib import Path
from dotenv import load_dotenv

# ── Paths ───────────────────────────────────────────────────────────────────
BASE_DIR      = Path(__file__).parent
WATCH_DIR     = BASE_DIR / 'data' / 'egx_bulletins'
PROCESSED_LOG = BASE_DIR / 'data' / 'processed_pdfs.txt'
LOG_DIR       = BASE_DIR / 'logs'

WATCH_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_DIR / 'pdf_watcher.log', encoding='utf-8'),
    ]
)
logger = logging.getLogger('tradeora.pdf_watcher')

load_dotenv()
from supabase import create_client
url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
sb  = create_client(url, key)


# ══════════════════════════════════════════════════════════════════════════════
# PDF Parser (same logic as egx_flow_scraper.py)
# ══════════════════════════════════════════════════════════════════════════════
def parse_number(text: str) -> float | None:
    if not text:
        return None
    cleaned = re.sub(r'[,،\s]', '', text.strip())
    if cleaned.startswith('(') and cleaned.endswith(')'):
        cleaned = '-' + cleaned[1:-1]
    try:
        return float(cleaned)
    except ValueError:
        return None


def extract_numbers(line: str) -> list[float]:
    nums = []
    for m in re.findall(r'[\(\-]?[\d,،]+\.?\d*\)?', line):
        n = parse_number(m)
        if n is not None and abs(n) > 0:
            nums.append(n)
    return nums


def infer_date_from_filename(pdf_path: Path) -> date:
    """Try to extract date from filename like DailyData_20260731.pdf"""
    name = pdf_path.stem
    patterns = [
        r'(\d{4})(\d{2})(\d{2})',   # 20260731
        r'(\d{4})-(\d{2})-(\d{2})', # 2026-07-31
        r'(\d{2})-(\d{2})-(\d{4})', # 31-07-2026
    ]
    for pat in patterns:
        m = re.search(pat, name)
        if m:
            try:
                groups = m.groups()
                if len(groups[0]) == 4:
                    return date(int(groups[0]), int(groups[1]), int(groups[2]))
                else:
                    return date(int(groups[2]), int(groups[1]), int(groups[0]))
            except:
                pass
    # Fall back to file modification date
    mtime = pdf_path.stat().st_mtime
    return datetime.fromtimestamp(mtime).date()


def parse_egx_pdf(pdf_path: Path) -> dict | None:
    """Parse EGX bulletin PDF and extract investor type flows."""
    try:
        import pdfplumber
    except ImportError:
        logger.error("Run: pip install pdfplumber")
        return None

    result = {
        'foreigners_buy_egp':     None, 'foreigners_sell_egp':    None, 'foreigners_net_egp':     None,
        'foreign_inst_buy_egp':   None, 'foreign_inst_sell_egp':  None, 'foreign_inst_net_egp':   None,
        'egyptian_inst_buy_egp':  None, 'egyptian_inst_sell_egp': None, 'egyptian_inst_net_egp':  None,
        'arab_buy_egp':           None, 'arab_sell_egp':          None, 'arab_net_egp':           None,
        'egyptian_ind_buy_egp':   None, 'egyptian_ind_sell_egp':  None, 'egyptian_ind_net_egp':   None,
        'total_volume_egp':       None,
    }

    try:
        with pdfplumber.open(str(pdf_path)) as pdf:
            full_text = '\n'.join(p.extract_text() or '' for p in pdf.pages)
    except Exception as e:
        logger.error(f"pdfplumber error: {e}")
        return None

    lines = full_text.split('\n')
    section_found = False

    for line in lines:
        line_s = line.strip()
        if not line_s:
            continue

        # Detect investor types section
        if any(k in line_s for k in ['فئات المستثمرين', 'تعاملات المستثمرين', 'Investor']):
            section_found = True
            continue

        if not section_found:
            continue

        nums = extract_numbers(line_s)
        if len(nums) < 2:
            continue

        buy, sell = nums[0], nums[1]
        net = nums[2] if len(nums) > 2 else buy - sell

        if any(k in line_s for k in ['الأجانب', 'أجانب']) and 'مؤسسات' not in line_s:
            result.update(foreigners_buy_egp=buy, foreigners_sell_egp=sell, foreigners_net_egp=net)
            logger.info(f"Foreigners: buy={buy:,.0f}, sell={sell:,.0f}, net={net:,.0f}")

        elif 'مؤسسات أجنبية' in line_s or ('مؤسسات' in line_s and 'أجنب' in line_s):
            result.update(foreign_inst_buy_egp=buy, foreign_inst_sell_egp=sell, foreign_inst_net_egp=net)

        elif any(k in line_s for k in ['المؤسسات المصرية', 'مؤسسات مصرية']):
            result.update(egyptian_inst_buy_egp=buy, egyptian_inst_sell_egp=sell, egyptian_inst_net_egp=net)
            logger.info(f"EG Institutions: net={net:,.0f}")

        elif any(k in line_s for k in ['العرب', 'المستثمرون العرب']):
            result.update(arab_buy_egp=buy, arab_sell_egp=sell, arab_net_egp=net)

        elif any(k in line_s for k in ['الأفراد المصريون', 'أفراد مصريون', 'الأفراد']):
            result.update(egyptian_ind_buy_egp=buy, egyptian_ind_sell_egp=sell, egyptian_ind_net_egp=net)

        elif 'إجمالي' in line_s:
            result['total_volume_egp'] = max(nums)

    if result['foreigners_net_egp'] is None and result['foreigners_buy_egp'] is None:
        # Log first 60 lines for manual inspection
        logger.warning("Could not find investor data. First 60 non-empty lines:")
        count = 0
        for line in lines:
            if line.strip() and count < 60:
                logger.warning(f"  L{count}: {line.strip()}")
                count += 1
        return None

    return result


def save_to_db(trade_date: date, flows: dict, filename: str) -> bool:
    try:
        record = {
            'trade_date': trade_date.isoformat(),
            'source':     'EGX_OFFICIAL',
            'pdf_url':    filename,
            **{k: v for k, v in flows.items() if v is not None},
        }
        sb.table('daily_investor_flows').upsert(record, on_conflict='trade_date').execute()
        logger.info(f"✅ Saved flows for {trade_date}")
        return True
    except Exception as e:
        logger.error(f"DB save error: {e}")
        return False


def get_processed_hashes() -> set:
    if not PROCESSED_LOG.exists():
        return set()
    return set(PROCESSED_LOG.read_text(encoding='utf-8').strip().split('\n'))


def mark_processed(file_hash: str):
    with open(PROCESSED_LOG, 'a', encoding='utf-8') as f:
        f.write(file_hash + '\n')


def file_hash(path: Path) -> str:
    return hashlib.md5(path.read_bytes()).hexdigest()


def process_pdf(pdf_path: Path, dry_run: bool = False) -> bool:
    logger.info(f"Processing: {pdf_path.name}")

    trade_date = infer_date_from_filename(pdf_path)
    logger.info(f"Inferred date: {trade_date}")

    flows = parse_egx_pdf(pdf_path)
    if not flows:
        logger.error(f"Failed to parse: {pdf_path.name}")
        return False

    # Print summary
    f_net = flows.get('foreigners_net_egp')
    e_net = flows.get('egyptian_inst_net_egp')
    a_net = flows.get('arab_net_egp')
    t_vol = flows.get('total_volume_egp')

    print('\n' + '═' * 55)
    print(f'  📊 {trade_date} – EGX Investor Flows')
    print('═' * 55)
    if f_net is not None:
        icon = '🟢' if f_net > 0 else '🔴'
        print(f'  {icon} الأجانب:        {f_net/1e6:>+10.1f}M ج.م')
    if e_net is not None:
        icon = '🟢' if e_net > 0 else '🔴'
        print(f'  {icon} مؤسسات مصرية:  {e_net/1e6:>+10.1f}M ج.م')
    if a_net is not None:
        icon = '🟢' if a_net > 0 else '🔴'
        print(f'  {icon} العرب:          {a_net/1e6:>+10.1f}M ج.م')
    if t_vol is not None:
        print(f'  📈 إجمالي التداول: {t_vol/1e6:>10.1f}M ج.م')
    print('═' * 55 + '\n')

    if dry_run:
        logger.info('[DRY RUN] Not saving to DB')
        return True

    return save_to_db(trade_date, flows, pdf_path.name)


def watch_folder():
    """Continuously watch WATCH_DIR for new PDFs."""
    processed = get_processed_hashes()
    logger.info(f"👁️  Watching: {WATCH_DIR}")
    logger.info("Drop EGX daily PDF into this folder to auto-process...")

    while True:
        for pdf in sorted(WATCH_DIR.glob('*.pdf'), key=os.path.getmtime, reverse=True):
            h = file_hash(pdf)
            if h not in processed:
                logger.info(f"New PDF detected: {pdf.name}")
                success = process_pdf(pdf)
                if success:
                    mark_processed(h)
        time.sleep(30)


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════
def main():
    parser = argparse.ArgumentParser(description='EGX PDF Watcher & Parser')
    parser.add_argument('--watch',   action='store_true', help='Watch folder continuously')
    parser.add_argument('--file',    type=str,            help='Process specific PDF file')
    parser.add_argument('--dry-run', action='store_true', help='Parse but do not save to DB')
    parser.add_argument('--report',  action='store_true', help='Show last 10 days from DB')
    args = parser.parse_args()

    if args.report:
        res = sb.table('daily_investor_flows')\
                .select('trade_date,foreigners_net_egp,egyptian_inst_net_egp,total_volume_egp')\
                .order('trade_date', desc=True).limit(10).execute()
        data = res.data or []
        if not data:
            print("No data in DB yet. Drop a PDF in:", WATCH_DIR)
            return
        print(f'\n{"التاريخ":<12} {"أجانب (M)":<15} {"مؤسسات (M)":<15} {"إجمالي (M)"}')
        print('─' * 55)
        for row in data:
            d  = row.get('trade_date', '')
            fn = float(row.get('foreigners_net_egp')     or 0) / 1e6
            en = float(row.get('egyptian_inst_net_egp')  or 0) / 1e6
            tv = float(row.get('total_volume_egp')       or 0) / 1e6
            print(f"{d:<12} {'🟢' if fn>0 else '🔴'}{fn:>+8.1f}M      {en:>+8.1f}M    {tv:>8.1f}M")
        return

    if args.file:
        process_pdf(Path(args.file), args.dry_run)
        return

    if args.watch:
        watch_folder()
        return

    # Default: process newest unprocessed PDF in watch folder
    pdfs = sorted(WATCH_DIR.glob('*.pdf'), key=os.path.getmtime, reverse=True)
    processed = get_processed_hashes()

    if not pdfs:
        print(f'\n📂 مجلد المراقبة: {WATCH_DIR}')
        print('📥 ضع نشرة EGX اليومية (PDF) في هذا المجلد')
        print('   ثم شغّل الأمر مرة أخرى\n')
        print('رابط النشرة: https://www.egx.com.eg/ar/Services_Reports.aspx')
        return

    for pdf in pdfs:
        h = file_hash(pdf)
        if h not in processed:
            success = process_pdf(pdf, args.dry_run)
            if success and not args.dry_run:
                mark_processed(h)
            break
    else:
        logger.info("All PDFs already processed. Add a new one to process.")


if __name__ == '__main__':
    main()
