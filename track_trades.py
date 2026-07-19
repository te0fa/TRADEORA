import os
import sys
import logging
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client, Client
import yfinance as yf
from pathlib import Path

# Configure logging
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
os.makedirs(log_dir, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join(log_dir, 'track_trades.log'), encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

# Load Environment Variables explicitly from script folder
load_dotenv(dotenv_path=Path(__file__).parent / '.env')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Missing SUPABASE_URL or SUPABASE_KEY in environment variables.")
    sys.exit(1)

sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

NEXT_URL = os.getenv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')

def send_push(user_id, title, body, url='/'):
    """يرسل Push Notification للمستخدم"""
    try:
        import requests
        requests.post(
            f"{NEXT_URL}/api/push/send",
            json={
                'user_id': user_id,
                'title':   title,
                'body':    body,
                'url':     url,
            },
            timeout=10
        )
        logger.info(f"Push notification dispatched: {title} to user {user_id}")
    except Exception as e:
        logger.error(f"Push error: {e}")

def send_email_via_api(user_id, trade_type, symbol, price, pnl=None):
    """ترسل رسالة بريد إلكتروني تفاعلية للمستخدم عند تغيير الأهداف"""
    try:
        import requests
        requests.post(
            f"{NEXT_URL}/api/email/trade-alert",
            json={
                'user_id': user_id,
                'type':    trade_type,
                'symbol':  symbol,
                'price':   price,
                'pnl':     pnl,
            },
            timeout=10
        )
        logger.info(f"Email notification dispatched: {trade_type} alert for {symbol} to user {user_id}")
    except Exception as e:
        logger.error(f"Email dispatch error: {e}")

def get_current_price(symbol):
    """Fetches real-time price from Yahoo Finance for EGX stocks (.CA)"""
    try:
        t = yf.Ticker(f"{symbol}.CA")
        price = t.fast_info.last_price
        if price is not None:
            return float(price)
    except Exception as e:
        logger.warning(f"Error fetching price for {symbol} via yfinance: {e}")
    return None

def track_user_trades():
    """Tracks actual user portfolio trades (Mission 9)"""
    logger.info("Starting active user trades tracking via yfinance...")
    try:
        res = sb.table('user_trades').select('*').in_('status', ['active', 'tp1_hit']).execute()
        trades = res.data or []
    except Exception as e:
        logger.error(f"Failed to fetch user trades from database: {e}")
        return

    logger.info(f"Found {len(trades)} active user trades to evaluate.")

    for t in trades:
        symbol = t['symbol']
        price = get_current_price(symbol)
        if not price:
            logger.warning(f"Skipping user trade for {symbol} due to missing price.")
            continue

        updates = {}
        entry_price = float(t['entry_price'])
        shares = float(t['shares_count'])
        direction = t.get('direction', 'buy')
        isBuy = direction == 'buy'

        tp1 = float(t['tp1'])
        tp2 = float(t['tp2'])
        sl = float(t['sl'])
        tp1_hit = t.get('tp1_hit', False)

        # Profit/loss calculations helper
        def calc_pnl_pct(exit_p):
            return ((exit_p - entry_price) / entry_price * 100) if isBuy else ((entry_price - exit_p) / entry_price * 100)

        def calc_pnl_amt(exit_p, qty_fraction=1.0):
            pnl_per_share = (exit_p - entry_price) if isBuy else (entry_price - exit_p)
            return pnl_per_share * shares * qty_fraction

        if t['status'] == 'active':
            # Check Trailing Stop Loss
            if t.get('trailing_sl'):
                pct = float(t.get('trailing_pct', 2)) / 100
                new_sl = price * (1 - pct) if isBuy else price * (1 + pct)
                current_sl = float(t.get('current_sl') or sl)

                if (isBuy and new_sl > current_sl) or (not isBuy and new_sl < current_sl):
                    try:
                        sb.table('user_trades').update({'current_sl': new_sl}).eq('id', t['id']).execute()
                        logger.info(f"⬆️ Trailing SL {symbol}: {current_sl:.2f} → {new_sl:.2f}")
                        # Update local variable to prevent outdated checks
                        t['current_sl'] = new_sl
                    except Exception as sl_err:
                        logger.error(f"Failed to update current_sl: {sl_err}")

            active_sl = float(t.get('current_sl') or sl)

            # Check Stop Loss (SL) or Trailing Stop Loss breach
            if (isBuy and price <= active_sl) or (not isBuy and price >= active_sl):
                updates['status'] = 'closed'
                updates['exit_price'] = price
                updates['exit_reason'] = 'trailing_sl' if t.get('trailing_sl') else 'sl'
                updates['pnl_percent'] = round(calc_pnl_pct(price), 2)
                updates['pnl_amount'] = round(calc_pnl_amt(price), 2)
            
            # Check Target 1 (TP1) -> Partial exit of 50%
            elif (isBuy and price >= tp1) or (not isBuy and price <= tp1):
                updates['status'] = 'tp1_hit'
                updates['tp1_exit_price'] = price
                updates['tp1_hit'] = True
                logger.info(f"User trade {t['id']} for {symbol} reached Target 1 (TP1) at {price}!")

        elif t['status'] == 'tp1_hit':
            # Trailing stop to entry after TP1 hits
            if (isBuy and price <= entry_price) or (not isBuy and price >= entry_price):
                updates['status'] = 'closed'
                updates['exit_price'] = entry_price
                updates['exit_reason'] = 'trailing_sl'
                
                # 50% exited at tp1_exit_price, 50% exited at entry_price (breakeven)
                tp1_exit_p = float(t.get('tp1_exit_price') or tp1)
                tp1_pnl_pct = calc_pnl_pct(tp1_exit_p)
                entry_pnl_pct = 0.0 # because exit is at entry price
                
                updates['pnl_percent'] = round(0.5 * tp1_pnl_pct + 0.5 * entry_pnl_pct, 2)
                updates['pnl_amount'] = round(calc_pnl_amt(tp1_exit_p, 0.5) + calc_pnl_amt(entry_price, 0.5), 2)

            # Check Target 2 (TP2) -> Full closure
            elif (isBuy and price >= tp2) or (not isBuy and price <= tp2):
                updates['status'] = 'closed'
                updates['exit_price'] = price
                updates['exit_reason'] = 'tp2'
                
                tp1_exit_p = float(t.get('tp1_exit_price') or tp1)
                tp1_pnl_pct = calc_pnl_pct(tp1_exit_p)
                tp2_pnl_pct = calc_pnl_pct(price)
                
                updates['pnl_percent'] = round(0.5 * tp1_pnl_pct + 0.5 * tp2_pnl_pct, 2)
                updates['pnl_amount'] = round(calc_pnl_amt(tp1_exit_p, 0.5) + calc_pnl_amt(price, 0.5), 2)

        if updates:
            if updates.get('status') == 'closed':
                updates['closed_at'] = datetime.now(timezone.utc).isoformat()
            try:
                sb.table('user_trades').update(updates).eq('id', t['id']).execute()
                logger.info(f"Updated user trade {symbol}: {updates}")

                # Dispatch Telegram notification if verified
                BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
                if BOT_TOKEN:
                    import requests
                    try:
                        tg_res = sb.table('user_telegram')\
                                   .select('chat_id')\
                                   .eq('user_id', t['user_id'])\
                                   .eq('verified', True)\
                                   .execute()
                        tg = tg_res.data or []
                        if tg:
                            chat_id = tg[0]['chat_id']
                            msg = None
                            
                            if updates.get('status') == 'tp1_hit':
                                msg = (
                                    f"🎯 <b>الهدف الأول TP1 - {t['symbol']}</b>\n\n"
                                    f"✅ السعر وصل لـ <b>{price:.2f} EGP</b>\n"
                                    f"💰 جني 50% من الكمية الآن\n\n"
                                    f"<i>الهدف الثاني: {t['tp2']:.2f} EGP</i>"
                                )
                            elif updates.get('exit_reason') == 'sl':
                                msg = (
                                    f"🚨 <b>وقف الخسارة - {t['symbol']}</b>\n\n"
                                    f"⚠️ السعر ضرب الوقف عند "
                                    f"<b>{price:.2f} EGP</b>\n"
                                    f"📉 الخسارة: {updates.get('pnl_percent',''):.2f}%\n\n"
                                    f"<i>لا بأس، الإدارة الصحيحة تحمي رأس المال</i>"
                                )
                            elif updates.get('exit_reason') == 'tp2':
                                msg = (
                                    f"🏆 <b>الهدف الثاني TP2 - {t['symbol']}</b>\n\n"
                                    f"💰 ربح كامل: <b>+{updates.get('pnl_percent',''):.2f}%</b>\n"
                                    f"🎉 صفقة ناجحة بالكامل!\n\n"
                                    f"<i>TRADEORA يهنئك بهذا الربح</i>"
                                )

                            if msg:
                                requests.post(
                                    f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
                                    json={
                                        'chat_id': chat_id,
                                        'text': msg,
                                        'parse_mode': 'HTML'
                                    }
                                )
                    except Exception as tg_err:
                        logger.error(f"Failed to fetch telegram verification/send notification: {tg_err}")

                # Dispatch Web Push Notifications
                try:
                    pnl_val = updates.get('pnl_percent') or 0.0
                    if updates.get('status') == 'tp1_hit':
                        send_push(
                            t['user_id'],
                            f"🎯 {t['symbol']} — الهدف الأول!",
                            f"السعر وصل لـ {price:.2f} EGP (+{pnl_val:.1f}%)",
                            f"/ar/my-trades"
                        )
                        send_email_via_api(t['user_id'], 'tp1', t['symbol'], price, pnl_val)
                    elif updates.get('exit_reason') == 'trailing_sl' or updates.get('exit_reason') == 'sl':
                        send_push(
                            t['user_id'],
                            f"⚠️ {t['symbol']} — الوقف تفعّل",
                            f"السعر ضرب الوقف عند {price:.2f} EGP",
                            f"/ar/my-trades"
                        )
                        send_email_via_api(t['user_id'], 'sl', t['symbol'], price, pnl_val)
                    elif updates.get('exit_reason') == 'tp2':
                        send_push(
                            t['user_id'],
                            f"🏆 {t['symbol']} — الهدف الثاني!",
                            f"السعر وصل للهدف الثاني عند {price:.2f} EGP (+{pnl_val:.1f}%)",
                            f"/ar/my-trades"
                        )
                        send_email_via_api(t['user_id'], 'tp2', t['symbol'], price, pnl_val)
                except Exception as push_err:
                    logger.error(f"Failed dispatching push/email notifications inside loop: {push_err}")

            except Exception as e:
                logger.error(f"Failed to update user trade {t['id']}: {e}")

def track_recommended_trades():
    """Tracks platform consensus recommended trades (Original logic)"""
    logger.info("Starting active recommended trades tracker...")
    
    # Fetch risk management settings
    trailing_stop_to_entry = True
    try:
        res_settings = sb.table("system_settings").eq("key", "risk_management").execute()
        if res_settings.data:
            settings_val = res_settings.data[0].get("value", {})
            trailing_stop_to_entry = settings_val.get("trailing_stop_to_entry", True)
            logger.info(f"Loaded risk settings: trailing_stop_to_entry = {trailing_stop_to_entry}")
    except Exception as e:
        logger.warning(f"Failed to fetch risk settings: {e}. Using default values.")
    
    try:
        res = sb.table("recommended_trades").select("*").in_("status", ["active", "tp1_hit"]).execute()
        active_trades = res.data or []
    except Exception as e:
        logger.error(f"Failed to fetch active recommended trades: {e}")
        return

    logger.info(f"Found {len(active_trades)} active recommended trades to evaluate.")

    for trade in active_trades:
        trade_id = trade["id"]
        symbol = trade["symbol"]
        company_id = trade["company_id"]
        entry_price = float(trade["entry_price"])
        tp1 = float(trade["tp1"])
        tp2 = float(trade["tp2"])
        sl = float(trade["sl"])
        status = trade["status"]
        direction = trade.get("direction", "buy")
        rec_at = trade["recommended_at"]
        rec_date_str = rec_at[:10]
        
        logger.info(f"Evaluating recommended trade {symbol} (Recommended: {rec_date_str}, Status: {status})")

        # Fetch daily candles since recommendation
        try:
            res_prices = sb.table("market_prices").select(
                "price_date, open_price, high_price, low_price, close_price"
            ).eq("company_id", company_id).gt("price_date", rec_date_str).order("price_date", desc=False).execute()
            candles = res_prices.data or []
        except Exception as e:
            logger.error(f"Failed to fetch market prices for {symbol}: {e}")
            continue

        if not candles:
            continue

        tp1_hit = (status == "tp1_hit")
        tp1_pnl = ((tp1 - entry_price) / entry_price * 100) if direction == "buy" else ((entry_price - tp1) / entry_price * 100)
        
        closed = False
        exit_price = None
        exit_reason = None
        pnl_percent = 0.0
        close_date = None

        for idx, c in enumerate(candles):
            days_held = idx + 1
            curr_low = float(c["low_price"] if c["low_price"] is not None else c["close_price"])
            curr_high = float(c["high_price"] if c["high_price"] is not None else c["close_price"])
            curr_close = float(c["close_price"])
            curr_date = c["price_date"]

            # Select SL trigger logic based on timeframe (Scenario B: Close trigger for 1d and 1h)
            use_close_trigger = timeframe in ['1d', '1h', 'D']

            if direction == "buy":
                effective_sl = entry_price if (tp1_hit and trailing_stop_to_entry) else sl
                sl_breached = (curr_close <= effective_sl) if use_close_trigger else (curr_low <= effective_sl)
                
                if sl_breached:
                    closed = True
                    exit_price = curr_close if use_close_trigger else effective_sl
                    exit_reason = "trailing_sl" if (tp1_hit and trailing_stop_to_entry) else "sl"
                    close_date = curr_date
                    pnl_percent = 0.5 * tp1_pnl + 0.5 * ((exit_price - entry_price) / entry_price * 100) if tp1_hit else ((exit_price - entry_price) / entry_price * 100)
                    break

                if tp1_hit and curr_high >= tp2:
                    closed = True
                    exit_price = tp2
                    exit_reason = "tp2"
                    close_date = curr_date
                    pnl_percent = 0.5 * tp1_pnl + 0.5 * ((tp2 - entry_price) / entry_price * 100)
                    break

                if not tp1_hit and curr_high >= tp1:
                    tp1_hit = True
                    try:
                        sb.table("recommended_trades").update({"status": "tp1_hit"}).eq("id", trade_id).execute()
                    except Exception as e:
                        logger.error(f"Failed to update status to tp1_hit for trade {trade_id}: {e}")

                    if curr_high >= tp2:
                        closed = True
                        exit_price = tp2
                        exit_reason = "tp2"
                        close_date = curr_date
                        pnl_percent = 0.5 * tp1_pnl + 0.5 * ((tp2 - entry_price) / entry_price * 100)
                        break
            else:
                effective_sl = entry_price if (tp1_hit and trailing_stop_to_entry) else sl
                sl_breached = (curr_close >= effective_sl) if use_close_trigger else (curr_high >= effective_sl)
                
                if sl_breached:
                    closed = True
                    exit_price = curr_close if use_close_trigger else effective_sl
                    exit_reason = "trailing_sl" if (tp1_hit and trailing_stop_to_entry) else "sl"
                    close_date = curr_date
                    pnl_percent = 0.5 * tp1_pnl + 0.5 * ((entry_price - exit_price) / entry_price * 100) if tp1_hit else ((entry_price - exit_price) / entry_price * 100)
                    break

                if tp1_hit and curr_low <= tp2:
                    closed = True
                    exit_price = tp2
                    exit_reason = "tp2"
                    close_date = curr_date
                    pnl_percent = 0.5 * tp1_pnl + 0.5 * ((entry_price - tp2) / entry_price * 100)
                    break

                if not tp1_hit and curr_low <= tp1:
                    tp1_hit = True
                    try:
                        sb.table("recommended_trades").update({"status": "tp1_hit"}).eq("id", trade_id).execute()
                    except Exception as e:
                        logger.error(f"Failed to update status to tp1_hit for trade {trade_id}: {e}")

                    if curr_low <= tp2:
                        closed = True
                        exit_price = tp2
                        exit_reason = "tp2"
                        close_date = curr_date
                        pnl_percent = 0.5 * tp1_pnl + 0.5 * ((entry_price - tp2) / entry_price * 100)
                        break

            # Time Exit check (20 trading days limit)
            if days_held >= 20:
                closed = True
                exit_price = curr_close
                exit_reason = "time_exit"
                close_date = curr_date
                pnl = ((curr_close - entry_price) / entry_price * 100) if direction == "buy" else ((entry_price - curr_close) / entry_price * 100)
                pnl_percent = 0.5 * tp1_pnl + 0.5 * pnl if tp1_hit else pnl
                break

        if closed:
            logger.info(f"🔒 Closing recommended trade {trade_id} for {symbol} (Reason: {exit_reason}, Exit: {exit_price:.3f}, PnL: {pnl_percent:.2f}%)")
            try:
                updates = {
                    "status": "closed",
                    "exit_price": exit_price,
                    "exit_reason": exit_reason,
                    "pnl_percent": pnl_percent,
                    "closed_at": datetime.strptime(close_date, "%Y-%m-%d").isoformat() + "Z"
                }
                sb.table("recommended_trades").update(updates).eq("id", trade_id).execute()
            except Exception as e:
                logger.error(f"Failed to update database for closed recommended trade {trade_id}: {e}")

def check_price_alerts():
    """يفحص تنبيهات السعر ويرسل تيليجرام"""
    logger.info("Checking custom price alerts...")
    import requests
    BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
    if not BOT_TOKEN:
        logger.warning("TELEGRAM_BOT_TOKEN not configured. Skipping price alerts.")
        return

    try:
        res = sb.table('price_alerts')\
                 .select('*')\
                 .eq('status', 'active')\
                 .execute()
        alerts = res.data or []
    except Exception as e:
        logger.error(f"Failed to fetch price alerts from DB: {e}")
        return

    logger.info(f"Found {len(alerts)} active price alerts to check.")

    for alert in alerts:
        symbol = alert['symbol']
        # جلب السعر الحالي
        price = get_current_price(symbol)
        if not price:
            continue

        triggered = (
            alert['condition'] == 'above' and
            price >= float(alert['target_price'])
        ) or (
            alert['condition'] == 'below' and
            price <= float(alert['target_price'])
        )

        if triggered:
            # جلب chat_id من user_telegram
            try:
                tg_res = sb.table('user_telegram')\
                           .select('chat_id')\
                           .eq('user_id', alert['user_id'])\
                           .eq('verified', True)\
                           .execute()
                tg = tg_res.data or []
            except Exception as e:
                logger.error(f"Failed to fetch telegram chat ID: {e}")
                continue

            if tg:
                chat_id = tg[0]['chat_id']
                arrow = '▲' if alert['condition'] == 'above' else '▼'
                msg = (
                    f"🔔 <b>تنبيه سعر - {alert['symbol']}</b>\n\n"
                    f"{arrow} السعر وصل لـ "
                    f"<b>{price:.2f} EGP</b>\n"
                    f"الهدف كان: {float(alert['target_price']):.2f} EGP\n\n"
                    f"<i>افتح TRADEORA للتفاصيل</i>"
                )
                try:
                    requests.post(
                        f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
                        json={
                            'chat_id': chat_id,
                            'text': msg,
                            'parse_mode': 'HTML'
                        }
                    )
                except Exception as tg_err:
                    logger.error(f"Failed to send telegram message: {tg_err}")

            # تحديث حالة التنبيه
            try:
                sb.table('price_alerts')\
                  .update({
                    'status': 'triggered',
                    'triggered_at': datetime.now(timezone.utc).isoformat()
                  })\
                  .eq('id', alert['id'])\
                  .execute()
                logger.info(f"✅ Alert triggered: {alert['symbol']} @ {price}")
            except Exception as db_err:
                logger.error(f"Failed to update alert status in DB: {db_err}")

if __name__ == '__main__':
    track_recommended_trades()
    track_user_trades()
    check_price_alerts()
    print("✅ Track + Alerts done!")
