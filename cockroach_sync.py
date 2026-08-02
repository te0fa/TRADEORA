"""
cockroach_sync.py
=================
يزامن البيانات من Supabase → CockroachDB بالكامل.
يضمن إن CockroachDB نسخة طبق الأصل من Supabase.

الاستخدام:
    python cockroach_sync.py --schema    # مزامنة الـ schema فقط (DDL)
    python cockroach_sync.py --data      # مزامنة البيانات فقط
    python cockroach_sync.py --full      # الاثنين معاً
    python cockroach_sync.py --check     # مقارنة الأرقام بين الاثنين
"""

import os, sys, json, logging, argparse
from datetime import date, timedelta
from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger('tradeora.sync')

# ── Supabase ───────────────────────────────────────────────────
from supabase import create_client
sb_url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
sb_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
sb     = create_client(sb_url, sb_key)

# ── CockroachDB ────────────────────────────────────────────────
import psycopg2, psycopg2.extras
cr_url = os.getenv('DATABASE_URL')
if not cr_url:
    raise EnvironmentError("DATABASE_URL not set in .env")

def cr_conn():
    return psycopg2.connect(cr_url, connect_timeout=10)


# ══════════════════════════════════════════════════════════════
# SCHEMA SYNC (DDL)
# ══════════════════════════════════════════════════════════════
SCHEMA_FIXES = [
    # recommended_trades
    ("recommended_trades.flow_signal",
     "ALTER TABLE recommended_trades ADD COLUMN IF NOT EXISTS flow_signal STRING DEFAULT 'neutral'"),

    # egx_shariah_index
    ("egx_shariah_index table",
     """CREATE TABLE IF NOT EXISTS egx_shariah_index (
         symbol     STRING PRIMARY KEY,
         added_date DATE DEFAULT current_date(),
         notes      STRING
     )"""),

    # companies shariah update
    ("companies.is_egx_shariah_listed update",
     """UPDATE companies SET is_egx_shariah_listed = TRUE
        WHERE symbol IN (
          'ADIB','FAIT','SAUD','TMGH','PHDC','MASR','OCDI','ORHD','JUFO','EFID',
          'OLFI','MPCO','EGAL','SKPC','AMOC','ICFC','ATQA','ORAS','ARCC','MCQE',
          'LCSW','ISPH','RMDA','ETEL','EFIH','RACC','ORWE','ACGC','MTIE','IFAP',
          'CIRA','ETRS','EGAS'
        )"""),

    # is_boubyan_compliant sync from is_shariah_compliant
    ("companies.is_boubyan_compliant sync",
     "UPDATE companies SET is_boubyan_compliant = is_shariah_compliant WHERE is_boubyan_compliant IS NULL OR is_boubyan_compliant = FALSE"),
]

def sync_schema():
    logger.info("=== Schema Sync: Supabase → CockroachDB ===")
    with cr_conn() as conn:
        with conn.cursor() as cur:
            for name, sql in SCHEMA_FIXES:
                try:
                    cur.execute(sql)
                    conn.commit()
                    logger.info(f"  ✅ {name}")
                except psycopg2.Error as e:
                    conn.rollback()
                    code = e.pgcode or ''
                    if '42701' in code or '42P07' in code:  # already exists
                        logger.info(f"  ✅ {name} (already exists)")
                    elif '57000' in code:  # table locked
                        logger.warning(f"  ⏳ {name}: table locked (GC in progress, retry later)")
                    else:
                        logger.error(f"  ❌ {name}: {e}")


# ══════════════════════════════════════════════════════════════
# DATA SYNC (DML)
# ══════════════════════════════════════════════════════════════
def serialize_row(row: dict) -> dict:
    """Convert dict/list values to JSON strings for CockroachDB."""
    out = {}
    for k, v in row.items():
        if isinstance(v, (dict, list)):
            out[k] = json.dumps(v, ensure_ascii=False)
        else:
            out[k] = v
    return out


def sync_table(table: str, pk: str, days_back: int = 90, date_col: str = None,
               page_size: int = 5000):
    """Sync a table from Supabase → CockroachDB using paginated upsert."""
    logger.info(f"  Syncing {table}...")
    total_synced = 0
    offset = 0

    try:
        while True:
            # Fetch page from Supabase
            q = sb.table(table).select('*')
            if date_col:
                since = (date.today() - timedelta(days=days_back)).isoformat()
                q = q.gte(date_col, since)
            q = q.order(pk).range(offset, offset + page_size - 1)
            rows = q.execute().data or []

            if not rows:
                break

            # Serialize JSONB columns
            rows = [serialize_row(r) for r in rows]

            # Upsert into CockroachDB
            cols    = list(rows[0].keys())
            col_str = ', '.join(f'"{c}"' for c in cols)
            val_str = ', '.join(f'%({c})s' for c in cols)
            upd_str = ', '.join(f'"{c}" = EXCLUDED."{c}"' for c in cols if c != pk)

            upsert_sql = f"""
                INSERT INTO {table} ({col_str})
                VALUES ({val_str})
                ON CONFLICT ("{pk}") DO UPDATE SET {upd_str}
            """

            with cr_conn() as conn:
                with conn.cursor() as cur:
                    psycopg2.extras.execute_batch(cur, upsert_sql, rows, page_size=500)
                conn.commit()

            total_synced += len(rows)
            logger.info(f"    Page {offset//page_size + 1}: {len(rows)} rows (total: {total_synced:,})")

            if len(rows) < page_size:
                break
            offset += page_size

        logger.info(f"    ✅ {total_synced:,} rows synced")
        return total_synced

    except Exception as e:
        logger.error(f"    ❌ Error syncing {table}: {e}")
        return total_synced


def sync_data(days_back: int = 90):
    logger.info("=== Data Sync: Supabase → CockroachDB ===")
    total = 0

    # Core tables
    tables = [
        ('companies',              'id',         None,       None),
        ('recommended_trades',     'id',         days_back,  'recommended_at'),
        ('daily_investor_flows',   'id',         180,        'trade_date'),
        ('sector_investor_flows',  'id',         90,         'trade_date'),
        ('egx_shariah_index',      'symbol',     None,       None),
        ('intraday_snapshots',     'id',         30,         'snapshot_time'),
    ]

    for table, pk, days, date_col in tables:
        n = sync_table(table, pk, days or days_back, date_col)
        total += n

    logger.info(f"=== Total rows synced: {total:,} ===")
    return total


# ══════════════════════════════════════════════════════════════
# CHECK – Compare row counts
# ══════════════════════════════════════════════════════════════
def check_sync():
    logger.info("=== Sync Check: Supabase vs CockroachDB ===")
    tables = [
        'companies', 'recommended_trades', 'daily_investor_flows',
        'sector_investor_flows', 'egx_shariah_index', 'intraday_snapshots',
        'market_prices', 'corporate_events', 'volume_profiles',
        'seasonality_patterns', 'insider_trading',
    ]

    print(f"\n{'Table':<30} {'Supabase':>12} {'CockroachDB':>12} {'Status'}")
    print('─' * 65)

    with cr_conn() as conn:
        with conn.cursor() as cur:
            for table in tables:
                # Supabase count
                try:
                    sb_count = sb.table(table).select('id', count='exact').execute().count or 0
                except:
                    sb_count = '?'

                # CockroachDB count
                try:
                    cur.execute(f"SELECT COUNT(*) FROM {table}")
                    cr_count = cur.fetchone()[0]
                except:
                    cr_count = 'MISSING'

                # Status
                if isinstance(sb_count, int) and isinstance(cr_count, int):
                    diff = cr_count - sb_count
                    status = '✅ IN SYNC' if diff == 0 else f'⚠️  diff={diff:+d}'
                elif cr_count == 'MISSING':
                    status = '❌ TABLE MISSING'
                else:
                    status = '?'

                print(f"{table:<30} {str(sb_count):>12} {str(cr_count):>12}  {status}")

    print()


# ══════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════
def main():
    parser = argparse.ArgumentParser(description='Supabase → CockroachDB Sync')
    parser.add_argument('--schema', action='store_true', help='Sync schema (DDL)')
    parser.add_argument('--data',   action='store_true', help='Sync data (DML)')
    parser.add_argument('--full',   action='store_true', help='Full sync (schema + data)')
    parser.add_argument('--check',  action='store_true', help='Compare row counts')
    parser.add_argument('--days',   type=int, default=90, help='Days back for data sync')
    args = parser.parse_args()

    if args.check:
        check_sync()
    elif args.full:
        sync_schema()
        sync_data(args.days)
        check_sync()
    elif args.schema:
        sync_schema()
    elif args.data:
        sync_data(args.days)
    else:
        # Default: check
        check_sync()


if __name__ == '__main__':
    main()
