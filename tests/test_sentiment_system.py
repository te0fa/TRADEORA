import datetime
import pytz
from services.sentiment_analyzer import SentimentAnalyzer
from scrapers.news_scraper import EGXNewsScraper
from train_model import precompute_sentiment_features

def test_sentiment_classification():
    analyzer = SentimentAnalyzer()
    
    # 1. Test corporate sentiment
    pos_title = "أرباح قياسية وتوزيعات أرباح نقدية للمساهمين"
    neg_title = "تراجع وخسائر فادحة وتأجيل الجمعية العمومية"
    neu_title = "انعقاد الجمعية العامة العادية اليوم"
    
    sent_pos, _ = analyzer.analyze_sentiment(pos_title)
    sent_neg, _ = analyzer.analyze_sentiment(neg_title)
    sent_neu, _ = analyzer.analyze_sentiment(neu_title)
    
    assert sent_pos == "positive"
    assert sent_neg == "negative"
    assert sent_neu == "neutral"

def test_news_categorization():
    analyzer = SentimentAnalyzer()
    
    # Test rate news
    rate_title = "قرار البنك المركزي المصري بخصوص أسعار الفائدة اليوم"
    cat_rate = analyzer.categorize_news(rate_title)
    assert cat_rate == "macro_rate"
    
    # Test forex news
    fx_title = "تراجع سعر صرف الجنيه المصري أمام الدولار بعد التعويم"
    cat_fx = analyzer.categorize_news(fx_title)
    assert cat_fx == "macro_fx"
    
    # Test geopolitical news
    geo_title = "توترات جيوسياسية وتصعيد عسكري في المنطقة"
    cat_geo = analyzer.categorize_news(geo_title)
    assert cat_geo == "macro_geopolitical"

def test_look_ahead_bias_prevention():
    cairo_tz = pytz.timezone('Africa/Cairo')
    
    companies = [{"id": "co-1", "sector": "Real Estate"}]
    all_candles = {
        "co-1": [
            {"time": "2026-07-01T10:00:00", "close": 10.0, "high": 10.5, "low": 9.5, "volume": 1000},
            {"time": "2026-07-02T10:00:00", "close": 10.2, "high": 10.6, "low": 9.9, "volume": 1100},
        ]
    }
    
    # News on T+1 (should NOT leak to T)
    news_list = [
        {
            "category": "corporate",
            "company_id": "co-1",
            "sentiment": "positive",
            "dt": datetime.datetime(2026, 7, 2, 8, 0, 0, tzinfo=cairo_tz), # published before day 2 session
            "published_at": "2026-07-02T08:00:00",
            "title": "أرباح جيدة جدا للشركة"
        }
    ]
    
    company_day_sentiment, _, _, _ = precompute_sentiment_features(companies, all_candles, news_list)
    
    # Day 1 (2026-07-01) sentiment should be 0.0 because news is published on 2026-07-02
    assert company_day_sentiment["co-1"]["2026-07-01"] == 0.0
    
    # Day 2 (2026-07-02) sentiment should be 1.0 (positive)
    assert company_day_sentiment["co-1"]["2026-07-02"] == 1.0

def test_trade_news_interpreter():
    from services.trade_interpreter import TradeNewsInterpreter
    interpreter = TradeNewsInterpreter()
    
    # We pass mock dry-run DB scenario parameters
    result = interpreter.generate_trade_explanation("COMI", "co-mock-id", "buy")
    assert "COMI" in result["symbol"]
    assert "buy" in result["direction"]
    assert "explanation" in result
    assert isinstance(result["explanation"], str)
    assert "probability_adjustment" in result
    assert isinstance(result["probability_adjustment"], float)


