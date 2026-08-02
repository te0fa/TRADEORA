"""
AlMal Newspaper Financial News Scraper (جريدة المال)
=====================================================
Scrapes financial news from AlMal Newspaper (almalnews.com)
Categorizes news, assigns Arabic sentiment, and marks source as '📰 جريدة المال'.
"""

import os
import sys
import time
import re
import logging
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv
import requests
from bs4 import BeautifulSoup
from supabase import create_client

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
load_dotenv(BASE_DIR / ".env")

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s [%(name)s]: %(message)s')
logger = logging.getLogger("tradeora.almal_scraper")

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
}

def scrape_almal_news():
    logger.info("📰 Scraping AlMal Newspaper (جريدة المال)...")
    
    # Load companies for symbol & name matching
    comp_res = sb.table('companies').select('id, symbol, name_ar').eq('status', 'active').execute().data or []
    
    url = "https://almalnews.com/category/%d8%a7%d9%84%d8%a8%d9%88%d8%b1%d8%b5%d8%a9-%d9%88%d8%a7%d9%84%d9%85%d8%a7%d9%84/"
    news_records = []
    
    try:
        r = requests.get(url, headers=HEADERS, timeout=10)
        if r.status_code != 200:
            logger.warning(f"Failed to fetch AlMal news: status {r.status_code}")
            return
            
        soup = BeautifulSoup(r.text, 'html.parser')
        articles = soup.select('article, .post-item, .entry-title a, h3 a')
        logger.info(f"Found {len(articles)} article nodes on AlMal Newspaper")
        
        now_iso = datetime.now(timezone.utc).isoformat()
        
        for art in articles:
            a_tag = art if art.name == 'a' else art.find('a')
            if not a_tag: continue
            
            title = a_tag.text.strip()
            href = a_tag.get('href', '')
            if not title or len(title) < 15 or not href: continue
            
            # Match company
            cid = None
            matched_sym = None
            for c in comp_res:
                s_code = c['symbol'].split('.')[0]
                if s_code.lower() in title.lower() or (c.get('name_ar') and c['name_ar'] in title):
                    cid = c['id']
                    matched_sym = c['symbol']
                    break
                    
            # Sentiment Analysis
            sentiment = 'neutral'
            impact_score = 0.0
            if any(k in title for k in ['أرباح', 'توزيعات', 'نمو', 'صفقة', 'استحواذ', 'ارتفاع', 'صعود', 'طفرة']):
                sentiment = 'positive'
                impact_score = 0.7
            elif any(k in title for k in ['خسائر', 'تراجع', 'هبوط', 'غرامة', 'عجز', 'ديون', 'إيقاف', 'انكماش']):
                sentiment = 'negative'
                impact_score = -0.6
                
            news_item = {
                'company_id': cid,
                'title': f"[{matched_sym}] {title}" if matched_sym else title,
                'published_at': now_iso,
                'source': '📰 جريدة المال',
                'url': href,
                'category': 'corporate' if cid else 'macro',
                'sentiment': sentiment,
                'confidence': 0.9,
                'impact_score': impact_score,
                'expected_impact_ar': 'خبر تحليلي من جريدة المال الاقتصادية المتخصصة.'
            }
            news_records.append(news_item)
            
    except Exception as e:
        logger.error(f"Error scraping AlMal newspaper: {e}")
        
    logger.info(f"Saving {len(news_records)} news items from AlMal Newspaper...")
    for n in news_records:
        try:
            sb.table('company_news').upsert(n, on_conflict='url').execute()
        except Exception as e:
            pass
            
    logger.info("✅ AlMal Newspaper Scraping Complete!")

if __name__ == '__main__':
    scrape_almal_news()
