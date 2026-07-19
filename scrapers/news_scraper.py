import re
import datetime
import logging
import requests
import random
import time
import pytz
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor
from services.sentiment_analyzer import SentimentAnalyzer
from database.db import get_db_client

logger = logging.getLogger(__name__)

class EGXNewsScraper:
    def __init__(self, max_concurrency: int = 5):
        self.max_concurrency = max_concurrency
        self.analyzer = SentimentAnalyzer()
        self.user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0"
        ]

    def _get_headers(self):
        return {
            "User-Agent": random.choice(self.user_agents),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "ar,en-US;q=0.7,en;q=0.3",
            "Referer": "https://www.google.com/"
        }

    def scrape_mubasher_macro_news(self) -> list[dict]:
        """
        Scrapes general economic news from Mubasher Egypt to gather Macro news events.
        """
        url = "https://www.mubasher.info/markets/EGX/news"
        logger.info(f"Scraping general economic news from Mubasher: {url}")
        news_items = []
        
        try:
            r = requests.get(url, headers=self._get_headers(), timeout=10)
            if r.status_code != 200:
                logger.warning(f"Failed to fetch general Mubasher news: {r.status_code}")
                return []
                
            soup = BeautifulSoup(r.text, 'html.parser')
            # Look for news list items (standard mubasher news selectors)
            articles = soup.find_all('a', href=re.compile(r'/news/\d+'))
            
            cairo_tz = pytz.timezone('Africa/Cairo')
            now_cairo = datetime.datetime.now(cairo_tz)
            
            for art in articles:
                title_el = art.find('span') or art
                title = title_el.text.strip()
                if not title or len(title) < 15:
                    continue
                    
                href = art['href']
                full_url = href if href.startswith('http') else f"https://www.mubasher.info{href}"
                
                # Mubasher doesn't always put clean timestamp in list, fallback to now or parse details
                published_at = now_cairo.isoformat()
                
                category = self.analyzer.categorize_news(title, has_company=False)
                sentiment, confidence = self.analyzer.analyze_sentiment(title)
                
                news_items.append({
                    "company_id": None,
                    "title": title,
                    "published_at": published_at,
                    "source": "Mubasher Macro",
                    "url": full_url,
                    "category": category,
                    "sentiment": sentiment,
                    "confidence": confidence
                })
        except Exception as e:
            logger.error(f"Error scraping Mubasher macro news: {e}")
            
        return news_items

    def scrape_investing_macro_news(self) -> list[dict]:
        """
        Scrapes Egypt news from Investing.com Arabic version.
        Highly valuable for macro sentiment (fx rate, geopolitical, interest rates).
        """
        url = "https://sa.investing.com/news/economy"
        logger.info(f"Scraping economic news from Investing.com: {url}")
        news_items = []
        
        try:
            # We attempt requests, if blocked we log warning.
            r = requests.get(url, headers=self._get_headers(), timeout=10)
            if r.status_code != 200:
                logger.warning(f"Investing.com returned non-200 status code: {r.status_code}")
                return []
                
            soup = BeautifulSoup(r.text, 'html.parser')
            # Standard Investing news item headers/titles
            articles = soup.find_all('a', class_=re.compile(r'title|news-item'))
            if not articles:
                # Alternate selector check
                articles = soup.find_all('a', href=re.compile(r'/news/economy/article-\d+'))
                
            cairo_tz = pytz.timezone('Africa/Cairo')
            now_cairo = datetime.datetime.now(cairo_tz)
            
            for art in articles:
                title = art.text.strip()
                if not title or len(title) < 15:
                    continue
                    
                href = art['href']
                full_url = href if href.startswith('http') else f"https://sa.investing.com{href}"
                
                category = self.analyzer.categorize_news(title, has_company=False)
                sentiment, confidence = self.analyzer.analyze_sentiment(title)
                
                news_items.append({
                    "company_id": None,
                    "title": title,
                    "published_at": now_cairo.isoformat(),
                    "source": "Investing Macro",
                    "url": full_url,
                    "category": category,
                    "sentiment": sentiment,
                    "confidence": confidence
                })
        except Exception as e:
            logger.error(f"Error scraping Investing.com: {e}. Skipping source.")
            
        return news_items

    def scrape_mubasher_corporate_news(self, company_symbol: str, company_id: str, mubasher_name: str) -> list[dict]:
        """
        Scrapes news for a specific corporate entity.
        """
        # Formulate url based on mapping or standard mubasher stock news link
        clean_name = mubasher_name.replace(" ", "-")
        url = f"https://www.mubasher.info/markets/EGX/stocks/{company_symbol}/news"
        logger.info(f"Scraping corporate news for {company_symbol}: {url}")
        
        news_items = []
        try:
            r = requests.get(url, headers=self._get_headers(), timeout=8)
            if r.status_code != 200:
                return []
                
            soup = BeautifulSoup(r.text, 'html.parser')
            articles = soup.find_all('a', href=re.compile(r'/news/\d+'))
            
            cairo_tz = pytz.timezone('Africa/Cairo')
            now_cairo = datetime.datetime.now(cairo_tz)
            
            for art in articles[:10]: # Process top 10 most recent news
                title_el = art.find('span') or art
                title = title_el.text.strip()
                if not title or len(title) < 15:
                    continue
                    
                href = art['href']
                full_url = href if href.startswith('http') else f"https://www.mubasher.info{href}"
                
                category = "corporate"
                sentiment, confidence = self.analyzer.analyze_sentiment(title)
                
                news_items.append({
                    "company_id": company_id,
                    "title": title,
                    "published_at": now_cairo.isoformat(),
                    "source": "Mubasher Corporate",
                    "url": full_url,
                    "category": category,
                    "sentiment": sentiment,
                    "confidence": confidence
                })
                
            # Anti-ban sleep
            time.sleep(random.uniform(0.5, 1.5))
        except Exception as e:
            logger.error(f"Error scraping news for corporate {company_symbol}: {e}")
            
        return news_items

    def save_news_to_db(self, news_records: list[dict]):
        """
        Upserts news records into company_news table via Supabase client.
        """
        if not news_records:
            return
            
        sb = get_db_client()
        if not sb:
            logger.info(f"[Dry Run] Simulating database insert of {len(news_records)} news records.")
            return
            
        logger.info(f"Inserting/Upserting {len(news_records)} news records into Supabase...")
        success_count = 0
        for rec in news_records:
            try:
                # Try inserting individually or batching. Individually is safer to catch unique URL conflicts
                sb.table("company_news").upsert(rec, on_conflict="url").execute()
                success_count += 1
            except Exception as e:
                # Failures are expected on duplicate URLs, we skip them silently
                pass
                
        logger.info(f"Successfully upserted {success_count} / {len(news_records)} news records.")
