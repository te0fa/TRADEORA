"""
foreign_flow_analyzer.py
========================
يحلل بيانات تدفقات الأجانب اليومية ويضيف score للتوصيات.

المنطق:
  - صافي شراء أجانب > +50M  ← إشارة إيجابية قوية   (+2 نقطة)
  - صافي شراء أجانب > +20M  ← إشارة إيجابية متوسطة (+1 نقطة)
  - صافي بيع أجانب  < -50M  ← تحذير قوي             (-2 نقطة)
  - صافي بيع أجانب  < -20M  ← تحذير متوسط           (-1 نقطة)
  - 3 أيام متتالية شراء      ← trend إيجابي           (+1 نقطة إضافية)
  - 3 أيام متتالية بيع        ← trend سلبي             (-1 نقطة إضافية)

الاستخدام:
    python foreign_flow_analyzer.py              # تحليل آخر 30 يوم
    python foreign_flow_analyzer.py --days 7     # آخر 7 أيام
    python foreign_flow_analyzer.py --report     # تقرير كامل
"""

import os, sys, logging
from datetime import date, timedelta
from dotenv import load_dotenv
import argparse

log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
os.makedirs(log_dir, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join(log_dir, 'flow_analyzer.log'), encoding='utf-8'),
    ]
)
logger = logging.getLogger('tradeora.flow_analyzer')

load_dotenv()
from supabase import create_client
url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
sb  = create_client(url, key)

# ── Thresholds (EGP) ───────────────────────────────────────────────────────────
STRONG_BUY_THRESHOLD  =  50_000_000   # +50M EGP
WEAK_BUY_THRESHOLD    =  20_000_000   # +20M EGP
WEAK_SELL_THRESHOLD   = -20_000_000   # -20M EGP
STRONG_SELL_THRESHOLD = -50_000_000   # -50M EGP
TREND_DAYS            = 3             # عدد الأيام لتحديد الـ trend


def get_recent_flows(days: int = 30) -> list[dict]:
    """جلب آخر N يوم من تدفقات الأجانب."""
    since = (date.today() - timedelta(days=days)).isoformat()
    res = sb.table('daily_investor_flows')\
            .select('trade_date,foreigners_net_egp,egyptian_inst_net_egp,arab_net_egp,total_volume_egp')\
            .gte('trade_date', since)\
            .order('trade_date', desc=True)\
            .execute()
    return res.data or []


def compute_flow_score(flows: list[dict]) -> dict:
    """
    يحسب flow score بناءً على آخر يوم وآخر 3 أيام.
    Returns dict: { score, signal, trend, latest_net, summary }
    """
    if not flows:
        return {'score': 0, 'signal': 'neutral', 'trend': 'unknown',
                'latest_net': 0, 'summary': 'لا بيانات متاحة'}

    latest   = flows[0]
    last_net = float(latest.get('foreigners_net_egp') or 0)

    # 1. Score من آخر يوم
    score = 0
    if last_net >= STRONG_BUY_THRESHOLD:
        score += 2
    elif last_net >= WEAK_BUY_THRESHOLD:
        score += 1
    elif last_net <= STRONG_SELL_THRESHOLD:
        score -= 2
    elif last_net <= WEAK_SELL_THRESHOLD:
        score -= 1

    # 2. Trend من آخر 3 أيام
    trend = 'neutral'
    if len(flows) >= TREND_DAYS:
        recent_nets = [float(f.get('foreigners_net_egp') or 0) for f in flows[:TREND_DAYS]]
        if all(n > 0 for n in recent_nets):
            trend = 'bullish'
            score += 1
        elif all(n < 0 for n in recent_nets):
            trend = 'bearish'
            score -= 1

    # 3. Signal
    if score >= 2:
        signal = 'strong_buy'
    elif score == 1:
        signal = 'buy'
    elif score == -1:
        signal = 'sell'
    elif score <= -2:
        signal = 'strong_sell'
    else:
        signal = 'neutral'

    # 4. Summary text (Arabic)
    net_m = last_net / 1_000_000
    direction = "شراء" if last_net > 0 else "بيع"
    summary = f"صافي {direction} أجانب: {abs(net_m):.1f}M ج.م | Trend: {trend}"

    return {
        'score':      score,
        'signal':     signal,
        'trend':      trend,
        'latest_net': last_net,
        'latest_date': latest.get('trade_date'),
        'summary':    summary,
    }


def get_sector_flow_ranking(days: int = 5) -> list[dict]:
    """
    يرتب القطاعات حسب تدفقات الأجانب في آخر N أيام.
    """
    since = (date.today() - timedelta(days=days)).isoformat()
    res = sb.table('sector_investor_flows')\
            .select('sector_name,foreigners_net_egp,trade_date')\
            .gte('trade_date', since)\
            .execute()

    flows = res.data or []
    sector_totals: dict[str, float] = {}
    for row in flows:
        s = row.get('sector_name', 'Unknown')
        n = float(row.get('foreigners_net_egp') or 0)
        sector_totals[s] = sector_totals.get(s, 0) + n

    ranked = sorted(sector_totals.items(), key=lambda x: x[1], reverse=True)
    return [{'sector': s, 'net_egp': n, 'net_m': n/1_000_000} for s, n in ranked]


def boost_recommendations_with_flow(flow_score: dict) -> dict:
    """
    يحسب التعديل على composite_score للتوصيات بناءً على flow.
    يُستخدم في generate_daily_recommendations.py
    """
    score   = flow_score.get('score', 0)
    signal  = flow_score.get('signal', 'neutral')

    # تعديل مئوي على الـ composite score
    adjustment_map = {
        'strong_buy':  +0.10,   # +10%
        'buy':         +0.05,   # +5%
        'neutral':      0.00,
        'sell':        -0.05,   # -5%
        'strong_sell': -0.15,   # -15% (تحذير قوي)
    }

    adjustment = adjustment_map.get(signal, 0.0)

    return {
        'flow_score':      score,
        'flow_signal':     signal,
        'score_adjustment': adjustment,
        'apply': adjustment != 0.0,
    }


def print_report(days: int = 30):
    """طباعة تقرير شامل لتدفقات الأجانب."""
    flows = get_recent_flows(days)

    print('\n' + '═' * 60)
    print('     📊 تقرير تدفقات الأجانب – البورصة المصرية')
    print('═' * 60)

    if not flows:
        print('❌ لا توجد بيانات في قاعدة البيانات.')
        print('   شغّل: python egx_flow_scraper.py أولاً')
        return

    # Summary
    flow_score = compute_flow_score(flows)
    print(f"\n📅 آخر يوم بيانات: {flow_score.get('latest_date')}")
    print(f"🌍 صافي الأجانب:   {flow_score['latest_net']/1_000_000:+.1f}M ج.م")
    print(f"📈 Trend:           {flow_score['trend']}")
    print(f"🎯 Signal:          {flow_score['signal'].upper()}")
    print(f"⚡ Flow Score:      {flow_score['score']:+d}")
    print(f"📝 الملخص:          {flow_score['summary']}")

    # Historical table
    print(f'\n{"التاريخ":<12} {"صافي الأجانب (M)":<20} {"المؤسسات المصرية (M)":<22} {"الإجمالي (M)"}')
    print('─' * 75)
    for row in flows[:10]:
        d         = row.get('trade_date', '')
        f_net     = float(row.get('foreigners_net_egp') or 0) / 1_000_000
        eg_net    = float(row.get('egyptian_inst_net_egp') or 0) / 1_000_000
        total     = float(row.get('total_volume_egp') or 0) / 1_000_000
        indicator = '🟢' if f_net > 0 else '🔴'
        print(f"{d:<12} {indicator} {f_net:>+10.1f}M        {eg_net:>+10.1f}M        {total:>10.1f}M")

    # Sector ranking
    sector_rank = get_sector_flow_ranking(days=5)
    if sector_rank:
        print(f'\n🏭 القطاعات الأكثر جذباً للأجانب (آخر 5 أيام):')
        print('─' * 45)
        for i, s in enumerate(sector_rank[:5], 1):
            bar = '█' * min(int(abs(s['net_m']) / 10), 20)
            sign = '+' if s['net_m'] >= 0 else ''
            print(f"  {i}. {s['sector']:<25} {sign}{s['net_m']:.1f}M  {bar}")

    # Impact on recommendations
    boost = boost_recommendations_with_flow(flow_score)
    print(f'\n🎯 تأثير على التوصيات:')
    adj = boost['score_adjustment']
    if adj > 0:
        print(f"  ✅ تعزيز التوصيات بنسبة {adj*100:+.0f}% (الأجانب يشترون)")
    elif adj < 0:
        print(f"  ⚠️  تخفيض الثقة بنسبة {adj*100:+.0f}% (الأجانب يبيعون)")
    else:
        print(f"  ➡️  لا تعديل على التوصيات (نشاط محايد)")

    print('═' * 60 + '\n')


def main():
    parser = argparse.ArgumentParser(description='Foreign Flow Analyzer')
    parser.add_argument('--days',   type=int, default=30, help='Lookback days')
    parser.add_argument('--report', action='store_true',  help='Print full report')
    args = parser.parse_args()

    if args.report:
        print_report(args.days)
    else:
        flows      = get_recent_flows(args.days)
        flow_score = compute_flow_score(flows)
        boost      = boost_recommendations_with_flow(flow_score)
        print(f"Signal: {flow_score['signal']} | Score: {flow_score['score']:+d} | "
              f"Adj: {boost['score_adjustment']*100:+.0f}% | {flow_score['summary']}")


if __name__ == '__main__':
    main()
