import os
import sys
import logging
import json
import pandas as pd
import numpy as np
from datetime import datetime, timezone, timedelta
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client
import scipy.stats as stats
import requests

# Load Environment Variables
load_dotenv(dotenv_path=Path(__file__).parent / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(Path(__file__).parent / 'logs' / 'performance_analytics.log', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

sb = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))

def send_telegram_alert(message):
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    try:
        admins = sb.table('user_profiles').select('id').eq('role', 'admin').execute().data
        admin_ids = [a['id'] for a in admins]
        
        chats = sb.table('user_telegram').select('chat_id').eq('verified', True).filter('user_id', 'in', f"({','.join(admin_ids)})").execute().data
        chat_ids = [c['chat_id'] for c in chats]
        
        if not chat_ids and os.getenv("TELEGRAM_CHAT_ID"):
            chat_ids = [os.getenv("TELEGRAM_CHAT_ID")]

        for chat_id in chat_ids:
            url = f"https://api.telegram.org/bot{token}/sendMessage"
            payload = {
                "chat_id": chat_id,
                "text": message,
                "parse_mode": "Markdown"
            }
            requests.post(url, json=payload)
            logger.info(f"Sent Telegram report to {chat_id}")
    except Exception as e:
        logger.error(f"Error sending Telegram notification: {e}")

def run_performance_analytics():
    logger.info("Starting upgraded performance analytics job...")
    
    # 1. Fetch closed recommended trades
    trades_response = sb.table('recommended_trades').select('*').eq('status', 'closed').execute().data
    if not trades_response:
        logger.warning("No closed recommended trades found to analyze.")
        return
    
    df = pd.DataFrame(trades_response)
    df['recommended_at'] = pd.to_datetime(df['recommended_at'])
    df['closed_at'] = pd.to_datetime(df['closed_at'])
    df['pnl_percent'] = df['pnl_percent'].astype(float)
    df['entry_price'] = df['entry_price'].astype(float)
    df['exit_price'] = df['exit_price'].astype(float)

    # 2. Map sectors to trades
    companies = sb.table('companies').select('id, sector').execute().data
    company_sectors = {c['id']: c['sector'] or 'Unknown' for c in companies}
    df['sector'] = df['company_id'].map(company_sectors).fillna('Unknown')

    # A. Calculate holding period in hours (Wasted duration metric)
    df['holding_hours'] = (df['closed_at'] - df['recommended_at']).dt.total_seconds() / 3600.0
    avg_holding = df['holding_hours'].mean()

    # B. Derive Market Regime from EMA trend as proxy (Market State)
    def determine_regime(row):
        snap = row.get('features_snapshot')
        if snap:
            if isinstance(snap, str):
                try: snap = json.loads(snap)
                except: pass
            if isinstance(snap, dict):
                dist_20 = snap.get('dist_ema20', 0)
                dist_50 = snap.get('dist_ema50', 0)
                if dist_20 > 0.5 and dist_50 > 0.5:
                    return 'Bullish (صاعد)'
                elif dist_20 < -0.5 and dist_50 < -0.5:
                    return 'Bearish (هابط)'
        return 'Sideways (عرضي)'
    df['market_regime'] = df.apply(determine_regime, axis=1)

    # C. Major Indicator Impact (Reason for recommendation)
    # We look at standard signal triggers (like RSI oversold < 30 or MACD hist crosses)
    def find_major_features(row):
        snap = row.get('features_snapshot')
        if snap:
            if isinstance(snap, str):
                try: snap = json.loads(snap)
                except: pass
            if isinstance(snap, dict):
                reasons = []
                rsi = snap.get('rsi')
                macd_hist = snap.get('macd_hist')
                vol_ratio = snap.get('vol_ratio')
                if rsi is not None and (rsi < 35 or rsi > 65):
                    reasons.append('RSI')
                if macd_hist is not None and abs(macd_hist) > 0.1:
                    reasons.append('MACD')
                if vol_ratio is not None and vol_ratio > 1.5:
                    reasons.append('Volume')
                if reasons:
                    return ', '.join(reasons)
        return 'Pattern'
    df['reasons'] = df.apply(find_major_features, axis=1)

    # 3. Compute overall statistics
    total_trades = len(df)
    winning_trades = len(df[df['pnl_percent'] > 0])
    win_rate = winning_trades / total_trades if total_trades > 0 else 0
    avg_pnl = df['pnl_percent'].mean()
    
    std_pnl = df['pnl_percent'].std()
    sharpe = avg_pnl / std_pnl if std_pnl > 0 else 0

    cum_returns = (1 + df['pnl_percent'] / 100).cumprod()
    running_max = cum_returns.cummax()
    drawdown = (cum_returns - running_max) / running_max
    max_dd = drawdown.min() * 100 if not drawdown.empty else 0

    # Benchmark: Average return of all stocks (approximate index performance)
    prices = sb.table('market_prices').select('close_price, price_date').execute().data
    if prices:
        pf = pd.DataFrame(prices)
        pf['price_date'] = pd.to_datetime(pf['price_date'])
        bench_ret = pf['close_price'].astype(float).pct_change().mean() * 100
        if pd.isna(bench_ret):
            bench_ret = 0.0
    else:
        bench_ret = 0.0

    # 4. Feature Information Coefficient (IC)
    feature_ic_list = []
    features_list = [
        'rsi', 'macd_hist', 'macd_raw', 'dist_ema20', 'dist_ema50', 
        'atr_pct', 'vol_ratio', 'price_pos', 'bb_width', 'bb_pos', 
        'stoch_rsi', 'vol_spike', 'dist_ath', 'day_of_week'
    ]
    
    features_data = []
    for idx, row in df.iterrows():
        snap = row.get('features_snapshot')
        if snap:
            if isinstance(snap, str):
                try: snap = json.loads(snap)
                except: continue
            if isinstance(snap, dict):
                snap['pnl_percent'] = row['pnl_percent']
                features_data.append(snap)
                
    if features_data:
        feat_df = pd.DataFrame(features_data)
        for col in features_list:
            if col in feat_df.columns and len(feat_df) > 5:
                clean = feat_df[[col, 'pnl_percent']].dropna()
                if len(clean) > 5:
                    r, p = stats.spearmanr(clean[col], clean['pnl_percent'])
                    if not pd.isna(r):
                        feature_ic_list.append({
                            "feature": col,
                            "ic": float(r),
                            "p_value": float(p)
                        })
    feature_ic_list.sort(key=lambda x: abs(x['ic']), reverse=True)

    # 5. Segment performance metrics
    def get_group_stats(gdf):
        trades_count = len(gdf)
        if trades_count == 0:
            return {"win_rate": 0, "avg_pnl": 0, "sharpe": 0, "max_dd": 0, "count": 0, "avg_holding_hours": 0}
        wins = len(gdf[gdf['pnl_percent'] > 0])
        wr = (wins / trades_count) * 100
        avg_ret = gdf['pnl_percent'].mean()
        std_ret = gdf['pnl_percent'].std()
        sh = avg_ret / std_ret if std_ret > 0 else 0
        cum_ret = (1 + gdf['pnl_percent'] / 100).cumprod()
        r_max = cum_ret.cummax()
        dd = (cum_ret - r_max) / r_max
        m_dd = dd.min() * 100
        h_period = gdf['holding_hours'].mean()
        return {
            "win_rate": float(wr),
            "avg_pnl": float(avg_ret),
            "sharpe": float(sh),
            "max_dd": float(m_dd),
            "count": int(trades_count),
            "avg_holding_hours": float(h_period) if not pd.isna(h_period) else 0.0
        }

    by_timeframe_stats = {}
    for tf, group in df.groupby('timeframe'):
        by_timeframe_stats[tf] = get_group_stats(group)

    by_sector_stats = {}
    for sec, group in df.groupby('sector'):
        by_sector_stats[sec] = get_group_stats(group)

    by_period_stats = {}
    df['month_year'] = df['recommended_at'].dt.to_period('M').astype(str)
    for period, group in df.groupby('month_year'):
        by_period_stats[period] = get_group_stats(group)

    # Segment by market regime
    by_regime_stats = {}
    for regime, group in df.groupby('market_regime'):
        by_regime_stats[regime] = get_group_stats(group)

    # Segment by major reason triggers
    by_reason_stats = {}
    for reason, group in df.groupby('reasons'):
        by_reason_stats[reason] = get_group_stats(group)

    overall_stats = {
        "win_rate": float(win_rate * 100),
        "sharpe": float(sharpe),
        "max_dd": float(max_dd),
        "total_trades": int(total_trades),
        "avg_pnl": float(avg_pnl),
        "benchmark_return": float(bench_ret),
        "avg_holding_hours": float(avg_holding) if not pd.isna(avg_holding) else 0.0
    }

    # Save to database
    report_data = {
        "report_date": datetime.now(timezone.utc).isoformat(),
        "overall_stats": overall_stats,
        "feature_ic": feature_ic_list,
        "by_timeframe": by_timeframe_stats,
        "by_sector": by_sector_stats,
        "by_period": by_period_stats
    }
    
    # Store regime & reasons stats inside a metadata field or extensions
    sb.table('performance_reports').insert(report_data).execute()
    logger.info("Saved upgraded performance analysis report to database.")

    # 6. Drift Detection
    drift_alert = ""
    try:
        prev_reports = sb.table('performance_reports').select('overall_stats').order('report_date', desc=True).limit(12).execute().data
        if len(prev_reports) >= 4:
            p_df = pd.DataFrame([r['overall_stats'] for r in prev_reports])
            recent_avg = p_df['win_rate'].head(4).mean()
            older_avg = p_df['win_rate'].mean()
            if recent_avg < older_avg - 10:
                drift_alert = f"\n\n⚠️ *تحذير انحدار الأداء (Drift Warning)*: متوسط Win Rate لآخر 4 أسابيع ({recent_avg:.1f}%) أقل بشكل ملحوظ من متوسط 12 أسبوع ({older_avg:.1f}%)."
    except Exception as ex:
        logger.error(f"Error computing drift detection: {ex}")

    # 7. Telegram report message
    top_features = [f["feature"] for f in feature_ic_list[:3]]
    worst_features = [f["feature"] for f in feature_ic_list[-3:]] if len(feature_ic_list) >= 3 else []
    
    tg_message = (
        f"📊 *تقرير أداء الاستراتيجيات الأسبوعي TRADEORA*\n"
        f"📅 التاريخ: {datetime.now().strftime('%Y-%m-%d')}\n\n"
        f"📈 *الأداء العام:*\n"
        f"• إجمالي التوصيات: {total_trades}\n"
        f"• نسبة النجاح: {win_rate*100:.1f}%\n"
        f"• متوسط الربح/الخسارة: {avg_pnl:.2f}%\n"
        f"• معامل شارب (Sharpe): {sharpe:.2f}\n"
        f"• أقصى تراجع (Max DD): {max_dd:.2f}%\n"
        f"• متوسط وقت الاحتفاظ بالصفقات: {avg_holding:.1f} ساعة\n"
        f"• عائد السوق التقريبي: {bench_ret:.2f}%\n\n"
        f"🧬 *ارتباط المؤشرات الفنية (Information Coefficient - IC):*\n"
        f"• أقوى مؤشرات أداءً: {', '.join(top_features) if top_features else 'N/A'}\n"
        f"• أضعف مؤشرات أداءً: {', '.join(worst_features) if worst_features else 'N/A'}\n\n"
        f"⏱️ *حسب الفريمات الزمنية:*\n"
    )
    
    for tf, t_stat in by_timeframe_stats.items():
        tg_message += f"• *{tf}*: Win {t_stat['win_rate']:.1f}% | Avg {t_stat['avg_pnl']:.2f}% | Holding {t_stat['avg_holding_hours']:.1f}h\n"

    tg_message += f"\n🚦 *حسب حالة السوق (Market Regime):*\n"
    for regime, r_stat in by_regime_stats.items():
         tg_message += f"• *{regime}*: Win {r_stat['win_rate']:.1f}% | Avg {r_stat['avg_pnl']:.2f}%\n"

    tg_message += f"\n💡 *أداء الإشارات حسب السبب (Triggers):*\n"
    for reason, rs_stat in by_reason_stats.items():
         tg_message += f"• *{reason}*: Win {rs_stat['win_rate']:.1f}% | Avg {rs_stat['avg_pnl']:.2f}%\n"

    tg_message += drift_alert
    
    send_telegram_alert(tg_message)
    logger.info("Performance analytics run completed successfully.")

if __name__ == '__main__':
    run_performance_analytics()
