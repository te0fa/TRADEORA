import datetime
import pytz
import logging
from database.db import get_db_client

logger = logging.getLogger(__name__)

class TradeNewsInterpreter:
    def __init__(self):
        pass

    def generate_trade_explanation(self, symbol: str, company_id: str, direction: str) -> dict:
        """
        Generates an Arabic textual explanation detailing how recent corporate news and macro trends 
        impact a specific stock and its trade direction.
        """
        sb = get_db_client()
        if not sb:
            return {
                "summary": "التقييم الفني محايد لعدم الاتصال بقاعدة البيانات.",
                "corporate_sentiment": "neutral",
                "macro_regime": "مستقر"
            }

        cairo_tz = pytz.timezone('Africa/Cairo')
        now = datetime.datetime.now(cairo_tz)
        five_days_ago = now - datetime.timedelta(days=5)

        # 1. Fetch Corporate News
        corp_news = []
        try:
            res = sb.table("company_news")\
                    .select("*")\
                    .eq("company_id", company_id)\
                    .gte("published_at", five_days_ago.isoformat())\
                    .execute()
            corp_news = res.data or []
        except Exception as e:
            logger.error(f"Error fetching corporate news for {symbol}: {e}")

        # 2. Fetch Recent Macro News (Last 7 days)
        seven_days_ago = now - datetime.timedelta(days=7)
        macro_news = []
        try:
            res = sb.table("company_news")\
                    .select("*")\
                    .is_("company_id", "null")\
                    .gte("published_at", seven_days_ago.isoformat())\
                    .execute()
            macro_news = res.data or []
        except Exception as e:
            logger.error(f"Error fetching macro news: {e}")

        # 3. Analyze Corporate News
        pos_corp = sum(1 for n in corp_news if n['sentiment'] == 'positive')
        neg_corp = sum(1 for n in corp_news if n['sentiment'] == 'negative')
        
        corp_summary = ""
        if corp_news:
            corp_summary = f"شهد السهم {len(corp_news)} من الأخبار في آخر 5 أيام ({pos_corp} إيجابي، {neg_corp} سلبي)."
        else:
            corp_summary = "لا توجد أخبار جوهرية مباشرة على السهم في آخر 5 أيام."

        # 4. Analyze Macro Trends
        fx_news = [n for n in macro_news if n['category'] == 'macro_fx']
        rate_news = [n for n in macro_news if n['category'] == 'macro_rate']
        geo_news = [n for n in macro_news if n['category'] == 'macro_geopolitical']

        macro_details = []
        if fx_news:
            pos_fx = sum(1 for n in fx_news if n['sentiment'] == 'positive')
            neg_fx = sum(1 for n in fx_news if n['sentiment'] == 'negative')
            macro_details.append(f"سعر الصرف يتجه نحو المشاعر {'الإيجابية' if pos_fx >= neg_fx else 'السلبية'}")
        if rate_news:
            pos_rate = sum(1 for n in rate_news if n['sentiment'] == 'positive')
            neg_rate = sum(1 for n in rate_news if n['sentiment'] == 'negative')
            macro_details.append(f"أخبار أسعار الفائدة والسياسات النقدية تشير إلى استقرار أو {'تأثير إيجابي' if pos_rate >= neg_rate else 'ضغوط تضخمية'}")
        if geo_news:
            neg_geo = sum(1 for n in geo_news if n['sentiment'] == 'negative')
            if neg_geo > 0:
                macro_details.append("وجود توترات جيوسياسية قد تزيد من تذبذب السوق العام")

        macro_summary = " | ".join(macro_details) if macro_details else "الأوضاع الاقتصادية الكلية مستقرة نسبياً."

        # 5. Formulate Trade Explanation
        decision_impact = ""
        if direction.lower() == 'buy':
            if pos_corp > neg_corp:
                decision_impact = "تدعم الأخبار الإيجابية الأخيرة الاتجاه الفني للصعود بشكل قوي."
            elif neg_corp > pos_corp:
                decision_impact = "تحذير: توجد أخبار سلبية على السهم قد تعوق الصعود الفني مؤقتاً."
            else:
                decision_impact = "الاتجاه الفني مدعوم بزخم معتدل بغياب أخبار جوهرية معاكسة."
        else: # sell / short
            if neg_corp > pos_corp:
                decision_impact = "تتفق المشاعر السلبية مع الإشارات الفنية للهبوط."
            elif pos_corp > neg_corp:
                decision_impact = "تحذير: زخم الأخبار الإيجابية قد يسبب صعوداً مفاجئاً يعاكس إشارة الهبوط الفنية."
            else:
                decision_impact = "إشارة الهبوط تعتمد أساساً على المؤشرات الفنية للزخم والتداول."

        # 6. Calculate Probability Adjustment
        # Adjust technical probability up or down based on corporate and macro news sentiment
        prob_adjust = 0.0
        
        # Corporate impact (up to +/- 10%)
        total_corp = pos_corp + neg_corp
        if total_corp > 0:
            corp_ratio = (pos_corp - neg_corp) / total_corp
            if direction.lower() == 'buy':
                prob_adjust += corp_ratio * 0.10
            else:
                prob_adjust -= corp_ratio * 0.10
                
        # Macro impact (up to +/- 5%)
        # Simple macro score sum
        macro_score = 0.0
        if fx_news:
            pos_fx = sum(1 for n in fx_news if n['sentiment'] == 'positive')
            neg_fx = sum(1 for n in fx_news if n['sentiment'] == 'negative')
            macro_score += 0.02 if pos_fx >= neg_fx else -0.02
        if rate_news:
            pos_rate = sum(1 for n in rate_news if n['sentiment'] == 'positive')
            neg_rate = sum(1 for n in rate_news if n['sentiment'] == 'negative')
            macro_score += 0.02 if pos_rate >= neg_rate else -0.02
        if geo_news:
            neg_geo = sum(1 for n in geo_news if n['sentiment'] == 'negative')
            if neg_geo > 0:
                macro_score -= 0.01
                
        if direction.lower() == 'buy':
            prob_adjust += macro_score
        else:
            prob_adjust -= macro_score

        full_explanation = f"تقييم إشارة الـ {direction.upper()} لسهم {symbol}: {corp_summary} {decision_impact} الأثر الكلي: {macro_summary}"

        return {
            "symbol": symbol,
            "direction": direction,
            "explanation": full_explanation,
            "pos_corp_count": pos_corp,
            "neg_corp_count": neg_corp,
            "macro_summary": macro_summary,
            "probability_adjustment": round(prob_adjust, 4)
        }

