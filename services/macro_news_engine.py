"""
Tradeora Macro, Geopolitical & NLP News Intelligence Engine
Tracks USD/EGP, Gold, Oil, Macroeconomic indicators, Regional Geopolitical Tensions,
and performs Arabic Natural Language Processing (NLP) with Sectoral Correlation Mapping.
"""

import os
import re
import logging
from typing import Dict, Any, List

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("tradeora.macro_news_engine")

class MacroNewsIntelligenceEngine:
    def __init__(self):
        # Arabic Lexicon for Geopolitical & Regional Conflicts
        self.geopolitical_war_keywords = [
            "حرب", "توترات", "صراع", "تصعيد", "البحر الأحمر", "الملاحة", "قناة السويس",
            "هجمات", "ضربات", "عسكرية", "مخاطر إقليمية", "نزاع"
        ]

        # Arabic Lexicon for Monetary Policy, Inflation & Devaluation
        self.macro_fx_keywords = [
            "دولار", "تعويم", "الجنيه", "الفائدة", "المركزي", "التضخم", "شهادات",
            "صندوق النقد", "احتياطي", "سيولة", "سندات"
        ]

        # Sectoral Sensitivity Matrix to Macro Variables
        self.sector_sensitivity = {
            "العقارات": {
                "usd_devaluation_impact": +0.25, # Real estate acts as a major hedge against inflation/devaluation
                "high_interest_impact": -0.15,
                "badge": "🏡 التحوط العقاري ضد التضخم والدولار"
            },
            "البنوك والخدمات المالية": {
                "high_interest_impact": +0.30, # Higher net interest margins (NIM) for banks like CIB
                "badge": "🏦 استفادة البنوك من ارتفاع الفائدة"
            },
            "البتروكيماويات والكيماويات": {
                "usd_devaluation_impact": +0.35, # Export earnings in USD (Abu Qir, MOPCO, SKPC)
                "oil_price_impact": +0.20,
                "badge": "🚀 نمو إيرادات التصدير بالدولار"
            },
            "الأغذية والمشروبات": {
                "usd_devaluation_impact": -0.20, # Higher raw material import costs
                "badge": "⚠️ ارتفاع تكلفة الخامات والواردات"
            },
            "الموارد الأساسية والحديد": {
                "usd_devaluation_impact": +0.20, # Metal prices tied to USD/Gold
                "badge": "🧱 ارتباط المنتجات بالأسعار العالمية"
            }
        }

    def analyze_arabic_nlp_sentiment(self, text: str, sector: str = None) -> Dict[str, Any]:
        """
        Processes Arabic text for sentiment, impact score (-1.0 to +1.0),
        and maps sector-specific correlation badges.
        """
        war_hits = sum(1 for kw in self.geopolitical_war_keywords if kw in text)
        macro_hits = sum(1 for kw in self.macro_fx_keywords if kw in text)

        # Base sentiment classification
        if war_hits > 0:
            category = "macro_geopolitical"
            impact_score = max(-0.4 - (0.2 * war_hits), -1.0)
            badge_ar = "🚨 توترات جيوسياسية وإقليمية"
            expected_impact = "تحركات حذرة وضغوط جيوسياسية مؤقتة على شهية المخاطرة."
        elif macro_hits > 0:
            category = "macro_fx"
            if any(k in text for k in ["ارتفاع", "نمو", "استقرار", "تدفقات"]):
                impact_score = min(0.3 + (0.15 * macro_hits), 1.0)
                badge_ar = "💵 تحسن مؤشرات الاقتصاد الكلي"
                expected_impact = "تدفقات نقدية وإيجابية تدعم التقييم الكلي للسوق."
            else:
                impact_score = max(-0.2 - (0.15 * macro_hits), -0.8)
                badge_ar = "📉 ضغوط أسعار الصرف والفائدة"
                expected_impact = "تذبذب مؤقت نتيجة إعادة تقييم محفظة الاستثمار."
        else:
            category = "corporate"
            impact_score = 0.0
            badge_ar = "📊 متابعة التطورات التشغيلية"
            expected_impact = "تأثير محايد ومستقر."

        # Sectoral Correlation Correction
        sector_badge = None
        if sector and sector in self.sector_sensitivity:
            sens = self.sector_sensitivity[sector]
            sector_badge = sens.get("badge")
            if category == "macro_currency_fx":
                impact_score += sens.get("usd_devaluation_impact", 0.0)

        impact_score = min(max(impact_score, -1.0), 1.0)

        return {
            "category": category,
            "impact_score": round(impact_score, 2),
            "badge_ar": badge_ar,
            "sector_badge_ar": sector_badge,
            "expected_impact_ar": expected_impact
        }

    def get_macro_market_summary(self) -> Dict[str, Any]:
        """
        Provides current macroeconomic baseline metrics for USD/EGP, Gold, Brent Oil,
        and Central Bank Interest Rates context.
        """
        return {
            "usd_egp_rate": 48.50,
            "usd_egp_status": "مستقر مع حركة مرنة",
            "gold_24k_egp": 4550.0,
            "gold_status": "📈 ملاذ آمن للتحوط",
            "brent_crude_usd": 78.20,
            "cbe_interest_rate": "27.25%",
            "macro_risk_level": "⚖️ متوازن (مخاطر جيوسياسية متوسطة)",
            "top_hedged_sectors": ["العقارات", "البتروكيماويات والتصدير", "البنوك"]
        }


# Global Singleton Instance
macro_engine = MacroNewsIntelligenceEngine()

if __name__ == "__main__":
    test_text = "ارتفاع الدولار وتوتر الملاحة في البحر الأحمر وتأثيرها على البورصة"
    res = macro_engine.analyze_arabic_nlp_sentiment(test_text, "البتروكيماويات والكيماويات")
    print("NLP & Macro Analysis Result:", res)
    print("Macro Market Summary:", macro_engine.get_macro_market_summary())
