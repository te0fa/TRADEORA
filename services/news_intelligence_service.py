import os
import sys
import re
import datetime
import logging
import requests
import xml.etree.ElementTree as ET
import pytz
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

load_dotenv(BASE_DIR / ".env")

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s [%(name)s]: %(message)s')
logger = logging.getLogger("tradeora.news_intelligence")

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

from supabase import create_client, Client
sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


class NewsIntelligenceService:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        self.positive_keywords = [
            "أرباح", "عقد", "صفقة", "شراكة", "توزيعات", "نمو", "استحواذ", "طفرة", "توسع", 
            "شراء أسهم خزينة", "فائض", "توصية بالشراء", "زيادة رأس المال", "صعود", "تصدير", "انتعاش"
        ]
        self.negative_keywords = [
            "خسائر", "تراجع", "هبوط", "توترات", "حرب", "تصعيد", "نزاع", "ديون", "دعوى", 
            "غرامة", "إيقاف", "إلغاء", "عجز", "تصفية", "انكماش", "تأخير", "عقوبة", "نزاع"
        ]

    def analyze_sentiment_and_impact(self, title: str, category: str) -> tuple[str, float, str]:
        """
        Analyzes sentiment and generates concise Arabic impact text and score (-1.0 to +1.0).
        """
        pos_hits = sum(1 for kw in self.positive_keywords if kw in title)
        neg_hits = sum(1 for kw in self.negative_keywords if kw in title)

        if pos_hits > neg_hits:
            sentiment = "positive"
            impact_score = min(0.3 + 0.2 * pos_hits, 1.0)
            if "عقد" in title or "صفقة" in title or "استحواذ" in title:
                expected_impact = "تأثير إيجابي قوي على السهم بفضل تدفقات الصفقات والتعاقدات الجديدة."
            elif "توزيعات" in title or "أرباح" in title:
                expected_impact = "تأثير إيجابي ممتاز يدعم سعر السهم ويعزز الجاذبية الاستثمارية."
            elif "انتعاش" in title or "صعود" in title:
                expected_impact = "تأثير إيجابي يدعم حركة الانتعاش الفني والسعر السائد."
            else:
                expected_impact = "تأثير إيجابي معتدل يدعم الحركة الصعودية للسهم."
        elif neg_hits > pos_hits:
            sentiment = "negative"
            impact_score = max(-0.3 - 0.2 * neg_hits, -1.0)
            if "حرب" in title or "توترات" in title or "تصعيد" in title:
                expected_impact = "تأثير سلبي ناتج عن التوترات الجيوسياسية وضغوط مخاطر المنطقة."
            elif "خسائر" in title or "تراجع" in title:
                expected_impact = "تأثير سلبي على السهم يضغط على مستويات الدعم الفني."
            else:
                expected_impact = "تأثير سلبي حذر قد يسبب تذبذباً مؤقتاً في السعر."
        else:
            sentiment = "neutral"
            impact_score = 0.0
            expected_impact = "تأثير محايد مستقر، يتابع السوق التطورات دون ضغط مباشر."

        return sentiment, impact_score, expected_impact

    def fetch_rss_news(self, companies: list[dict]) -> list[dict]:
        """Fetch live news from Google News RSS feeds for EGX, macro, and geopolitics."""
        logger.info("Fetching live news via Google News RSS feeds...")
        cairo_tz = pytz.timezone('Africa/Cairo')
        now_iso = datetime.datetime.now(cairo_tz).isoformat()

        rss_feeds = [
            ("https://news.google.com/rss/search?q=%D8%A7%D9%84%D8%A8%D9%88%D8%B1%D8%B5%D8%A9+%D8%A7%D9%84%D9%85%D8%B1%D9%83%D8%B2%D9%8A+%D9%85%D8%B5%D8%B1&hl=ar&gl=EG&ceid=EG:ar", "Google News EGX"),
            ("https://news.google.com/rss/search?q=%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF+%D9%85%D8%B5%D8%B1+%D8%B5%D9%81%D9%82%D8%A9+%D8%B9%D9%82%D8%AF+%D8%AA%D9%88%D8%AA%D8%B1%D8%A7%D8%AA&hl=ar&gl=EG&ceid=EG:ar", "Google News Geopolitical"),
            ("https://news.google.com/rss/search?q=%D8%A3%D8%B1%D8%A8%D8%A7%D8%AD+%D8%AA%D9%88%D8%B2%D9%8A%D8%B9%D8%A7%D8%AA+%D8%A7%D8%B3%D8%AA%D8%AD%D9%88%D8%A7%D8%B0+%D9%85%D8%B5%D8%B1&hl=ar&gl=EG&ceid=EG:ar", "Google News Corporate")
        ]

        comp_symbol_map = {c["symbol"].split(".")[0]: c for c in companies}
        comp_name_map = {c["name_ar"]: c for c in companies if c.get("name_ar")}

        news_items = []

        for url, source_label in rss_feeds:
            try:
                r = requests.get(url, headers=self.headers, timeout=8)
                if r.status_code == 200:
                    root = ET.fromstring(r.content)
                    items = root.findall("./channel/item")
                    for item in items:
                        title_el = item.find("title")
                        link_el = item.find("link")
                        pub_el = item.find("pubDate")

                        if title_el is None or not title_el.text:
                            continue

                        title = title_el.text.strip()
                        link = link_el.text.strip() if link_el is not None else ""

                        # Match company
                        matched_company = None
                        for sym, c in comp_symbol_map.items():
                            if sym in title or (c.get("name_ar") and c["name_ar"] in title):
                                matched_company = c
                                break

                        cid = matched_company["id"] if matched_company else None
                        sec_name = matched_company.get("sector") if matched_company else None
                        
                        if matched_company:
                            cat = "corporate"
                        elif any(k in title for k in ["فائدة", "دولار", "المركزي", "الجنيه"]):
                            cat = "macro_fx"
                        else:
                            cat = "macro_geopolitical"

                        sentiment, impact_score, expected_impact = self.analyze_sentiment_and_impact(title, cat)

                        news_items.append({
                            "company_id": cid,
                            "title": title,
                            "published_at": now_iso,
                            "source": source_label,
                            "url": link or f"https://news.google.com/{hash(title)}",
                            "category": cat,
                            "sentiment": sentiment,
                            "confidence": 1.0,
                            "impact_score": impact_score,
                            "expected_impact_ar": expected_impact,
                            "sector_name": sec_name
                        })
            except Exception as e:
                logger.warning(f"Error fetching RSS feed {source_label}: {e}")

        return news_items


def run_news_intelligence_pipeline():
    logger.info("=== Starting AI News & Macro Geopolitical Intelligence Pipeline ===")
    
    comp_res = sb.table("companies").select("id, symbol, name_ar, sector").execute()
    companies = comp_res.data or []

    service = NewsIntelligenceService()
    all_news = service.fetch_rss_news(companies)

    logger.info(f"Total News Scraped & Analyzed: {len(all_news)}")

    if not all_news:
        logger.warning("No news items extracted.")
        return

    # Filter duplicates by title/url
    unique_news = {}
    for item in all_news:
        unique_news[item["url"]] = item

    payloads = list(unique_news.values())
    logger.info(f"Upserting {len(payloads)} unique news items to Supabase...")

    # Upsert in chunks
    for item in payloads:
        try:
            sb.table("company_news").upsert(item, on_conflict="url").execute()
        except Exception as e:
            logger.debug(f"Skip item upsert error: {e}")

    logger.info("=== AI News & Geopolitical Intelligence Pipeline Completed Successfully ===")

if __name__ == "__main__":
    run_news_intelligence_pipeline()
