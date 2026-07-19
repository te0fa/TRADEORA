import re
import logging

logger = logging.getLogger(__name__)

# Config flags
USE_NLP_SENTIMENT = False  # Set to True if transformers and torch are installed

class SentimentAnalyzer:
    def __init__(self):
        # Phase 1: Keyword Dictionary
        self.positive_keywords = [
            "أرباح قياسية", "توزيعات", "توسع", "نمو", "استحواذ", "ارتفاع صافي", 
            "تضاعف", "توصية بالشراء", "صعود", "فائض", "طفرة", "زيادة رأس المال",
            "أرباح قوية", "شراكة استراتيجية", "شراء أسهم خزينة"
        ]
        
        self.negative_keywords = [
            "خسائر", "تراجع", "تحقيق", "هبوط", "انخفاض أرباح", "غرامة", "تأجيل", 
            "رفض", "إيقاف", "عجز", "ديون", "انكماش", "تصفية", "دعوى قضائية",
            "عقوبة", "تأخر", "إلغاء", "شطب"
        ]
        
        self.nlp_pipeline = None
        if USE_NLP_SENTIMENT:
            try:
                from transformers import pipeline
                # Load CAMeL-Lab Arabic sentiment model
                self.nlp_pipeline = pipeline(
                    "text-classification",
                    model="CAMeL-Lab/bert-base-arabic-camelbert-msa-sentiment"
                )
                logger.info("Successfully loaded CAMeL-Lab Arabic BERT sentiment model.")
            except Exception as e:
                logger.error(f"Failed to load BERT sentiment model: {e}. Falling back to keywords.")

    def categorize_news(self, title: str, has_company: bool = False) -> str:
        """
        Determines whether the news is corporate or relates to macro indicators.
        """
        title_lower = title.lower()
        
        # Macro interest rates
        if any(term in title_lower for term in ["فائدة", "المركزي", "ليدور", "عائد", "السياسة النقدية"]):
            return "macro_rate"
            
        # Macro foreign exchange / currency
        if any(term in title_lower for term in ["تعويم", "دولار", "سعر الصرف", "النقد الأجنبي", "الجنيه"]):
            return "macro_fx"
            
        # Macro geopolitical / war
        if any(term in title_lower for term in ["حرب", "تصعيد", "توترات", "جيوسياسي", "هجوم", "صراع"]):
            return "macro_geopolitical"
            
        # Default to corporate if company_id mapping exists, otherwise macro_geopolitical or general
        if has_company:
            return "corporate"
            
        return "macro_geopolitical"

    def analyze_sentiment(self, title: str) -> tuple[str, float]:
        """
        Analyzes the sentiment of a news title.
        Returns:
            (sentiment, confidence) where sentiment is 'positive', 'negative', or 'neutral'
        """
        if self.nlp_pipeline:
            try:
                result = self.nlp_pipeline(title)[0]
                label = result['label'].lower()
                score = float(result['score'])
                
                # Model labels mapping (depends on model specific training output, usually POSITIVE/NEGATIVE/NEUTRAL)
                if 'pos' in label:
                    return 'positive', score
                elif 'neg' in label:
                    return 'negative', score
                else:
                    return 'neutral', score
            except Exception as e:
                logger.warning(f"Error executing NLP pipeline: {e}. Falling back to keywords.")
                
        # Keyword-based Fallback
        pos_count = sum(1 for kw in self.positive_keywords if kw in title)
        neg_count = sum(1 for kw in self.negative_keywords if kw in title)
        
        if pos_count > neg_count:
            return 'positive', 1.0
        elif neg_count > pos_count:
            return 'negative', 1.0
        else:
            return 'neutral', 1.0
