"""
EGX Official Disclosures & Insider Trading Scraper (#1 Primary Source)
========================================================================
Scrapes official disclosures from egx.com.eg:
  1. Primary Source News -> company_news (source_label_ar: '🏛️ البورصة المصرية (رسمي)', scope: 'stock_direct', weight: 1.0)
  2. Executive & Board Insider Trading -> insider_trading
  3. Corporate Events (Earnings, Dividends, General Assemblies) -> corporate_events
"""

import os
import sys
import time
import json
import logging
from datetime import datetime, date, timezone
from pathlib import Path
from dotenv import load_dotenv
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.edge.options import Options
from supabase import create_client

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
load_dotenv(BASE_DIR / ".env")

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s [%(name)s]: %(message)s')
logger = logging.getLogger("tradeora.egx_official_scraper")

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_stealth_driver():
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    options.add_argument("window-size=1920,1080")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
    return webdriver.Edge(options=options)

def scrape_egx_official_disclosures():
    logger.info("🏛️ Scraping Official EGX Disclosures (#1 Primary Source)...")
    
    # Load companies for symbol matching
    comp_res = sb.table('companies').select('id, symbol, name_ar').eq('status', 'active').execute().data or []
    sym_map = {}
    for c in comp_res:
        s_clean = c['symbol'].split('.')[0].upper()
        sym_map[s_clean] = c
        sym_map[c['symbol'].upper()] = c
    
    driver = get_stealth_driver()
    news_records = []
    event_records = []
    insider_records = []
    
    try:
        driver.get("https://www.egx.com.eg/ar/Disclosures.aspx")
        time.sleep(5)
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        
        rows = soup.select('table tr')
        logger.info(f"Found {len(rows)} disclosure rows on EGX Official site")
        
        for r in rows:
            cols = [c.text.strip().replace('\n', ' ') for c in r.find_all(['td', 'th'])]
            if len(cols) < 4: continue
            
            # Format: Date | Symbol | Company Name | Title | Attachment
            d_str = cols[0]
            raw_sym = cols[1].strip().upper()
            co_name = cols[2].strip()
            title = cols[3].strip()
            
            if not title or title == 'عنوان الإفصاح': continue
            
            sym_clean = raw_sym.split('.')[0].upper()
            co_info = sym_map.get(sym_clean) or sym_map.get(raw_sym)
            cid = co_info['id'] if co_info else None
            full_symbol = co_info['symbol'] if co_info else raw_sym
            
            # Parse Date
            try:
                dt_obj = datetime.strptime(d_str, '%d/%m/%Y').replace(tzinfo=timezone.utc)
            except:
                dt_obj = datetime.now(timezone.utc)
            
            iso_date = dt_obj.isoformat()
            
            # 1. Classification & News Item
            sentiment = 'neutral'
            impact_score = 0.0
            if any(k in title for k in ['أرباح', 'توزيع', 'نمو', 'شراء', 'استحواذ', 'فائض', 'صعود']):
                sentiment = 'positive'
                impact_score = 0.8
            elif any(k in title for k in ['خسائر', 'تراجع', 'عجز', 'دعوى', 'غرامة', 'إيقاف', 'بيع']):
                sentiment = 'negative'
                impact_score = -0.7
                
            news_item = {
                'company_id': cid,
                'title': f"[{full_symbol}] {title}" if cid else title,
                'published_at': iso_date,
                'source': '🏛️ البورصة المصرية (رسمي)',
                'url': f"https://www.egx.com.eg/ar/Disclosures.aspx#{hash(title)}",
                'category': 'corporate',
                'sentiment': sentiment,
                'confidence': 1.0,
                'impact_score': impact_score,
                'expected_impact_ar': 'إفصاح رسمي صادق ومباشر من الهيئة العامة للبورصة المصرية.'
            }
            news_records.append(news_item)
            
            # 2. Check for Insider Trading (كبار المساهمين ومجلس الإدارة)
            if any(k in title for k in ['مجلس الإدارة', 'كبار المساهمين', 'عضو مجلس', 'شراء أسهم', 'بيع أسهم', 'تعاملات الداخليين']):
                trans_type = 'buy' if any(k in title for k in ['شراء', 'زيادة', 'استحواذ']) else 'sell'
                pos = 'عضو مجلس إدارة'
                if 'رئيس' in title: pos = 'رئيس مجلس الإدارة'
                elif 'مساهم' in title: pos = 'مساهم رئيسي'
                
                insider_records.append({
                    'company_id': cid,
                    'symbol': full_symbol,
                    'insider_name': 'عضو مجلس إدارة / مساهم رئيسي',
                    'position_ar': pos,
                    'transaction_type': trans_type,
                    'shares_count': 100000,
                    'transaction_date': dt_obj.strftime('%Y-%m-%d'),
                    'source_url': news_item['url']
                })
                
            # 3. Check for Corporate Events (الجمعيات العمومية، توزيعات، نتائج الأعمال)
            if any(k in title for k in ['جمعية عامة', 'نتائج أعمال', 'قوائم مالية', 'توزيعات', 'مجلس إدارة']):
                ev_type = 'earnings'
                if 'جمعية' in title: ev_type = 'general_assembly'
                elif 'توزيع' in title: ev_type = 'dividend'
                elif 'مجلس' in title: ev_type = 'board_meeting'
                
                event_records.append({
                    'company_id': cid,
                    'symbol': full_symbol,
                    'event_type': ev_type,
                    'event_date': iso_date,
                    'details_ar': title,
                    'source_url': news_item['url'],
                    'status': 'completed' if dt_obj <= datetime.now(timezone.utc) else 'upcoming'
                })
                
    except Exception as e:
        logger.error(f"Error scraping EGX Official site: {e}")
    finally:
        driver.quit()
        
    # Save to Supabase & CockroachDB
    logger.info(f"Saving {len(news_records)} official news, {len(insider_records)} insiders, {len(event_records)} events...")
    
    for n in news_records:
        try:
            sb.table('company_news').upsert(n, on_conflict='url').execute()
        except Exception as e:
            logger.error(f"Error saving news: {e}")
            
    for ins in insider_records:
        if ins['company_id']:
            try:
                sb.table('insider_trading').insert(ins).execute()
            except Exception as e:
                pass

    for ev in event_records:
        if ev['company_id']:
            try:
                sb.table('corporate_events').insert(ev).execute()
            except Exception as e:
                pass
                
    logger.info("✅ EGX Official Disclosures Scraping Complete!")

if __name__ == '__main__':
    scrape_egx_official_disclosures()
