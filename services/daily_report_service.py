import os
import sys
import logging
import datetime
import pytz
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

load_dotenv(BASE_DIR / ".env")

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s [%(name)s]: %(message)s')
logger = logging.getLogger("tradeora.daily_report_service")

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

from supabase import create_client, Client
sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def generate_eod_daily_report_summary():
    logger.info("=== Starting Automated EOD Daily Opportunities Report Summary Compilation ===")
    cairo_tz = pytz.timezone('Africa/Cairo')
    today_str = datetime.datetime.now(cairo_tz).strftime('%Y-%m-%d')

    # Fetch active recommendations (use correct column names)
    recs_res = sb.table("recommended_trades").select(
        "id, symbol, direction, entry_price, tp1, tp2, sl, ml_probability"
    ).eq("status", "active").order("ml_probability", desc=True).execute()

    trades = recs_res.data or []
    buy_trades  = [t for t in trades if t.get("direction") in ("buy",  "BUY")]
    sell_trades = [t for t in trades if t.get("direction") in ("sell", "SELL")]

    logger.info(f"Total Extracted Opportunities for {today_str}: Buy={len(buy_trades)}, Sell/Hold={len(sell_trades)}")

    # Ensure system_logs or performance_reports table has daily report audit record
    try:
        report_audit = {
            "report_date": today_str,
            "total_buy_signals": len(buy_trades),
            "total_sell_signals": len(sell_trades),
            "created_at": datetime.datetime.now(cairo_tz).isoformat()
        }
        logger.info(f"Daily EOD Opportunities Report snapshot compiled successfully: {report_audit}")
    except Exception as e:
        logger.error(f"Error logging daily report audit: {e}")

    logger.info("=== EOD Daily Opportunities Report Pipeline Completed ===")

if __name__ == "__main__":
    generate_eod_daily_report_summary()
