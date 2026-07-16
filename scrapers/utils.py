import datetime
import re
import pytz

class MarketClosedException(Exception):
    """Custom exception raised when the market is closed and scraping is guarded."""
    pass

def is_market_open() -> bool:
    """
    Checks if the Egyptian Exchange (EGX) is currently open.
    Trading Days: Sunday to Thursday (weekday 0, 1, 2, 3, 6)
    Trading Hours: 10:00 AM to 02:30 PM Cairo Time (GMT+2 or GMT+3 depending on DST)
    """
    try:
        cairo_tz = pytz.timezone('Africa/Cairo')
        now = datetime.datetime.now(cairo_tz)
        
        # Weekday: Monday=0, Tuesday=1, Wednesday=2, Thursday=3, Friday=4, Saturday=5, Sunday=6
        # EGX trading days are Sunday to Thursday
        if now.weekday() not in [0, 1, 2, 3, 6]:
            return False
            
        start_time = now.replace(hour=10, minute=0, second=0, microsecond=0)
        end_time = now.replace(hour=14, minute=30, second=0, microsecond=0)
        
        return start_time <= now <= end_time
    except Exception as e:
        print(f"Error checking market status: {e}")
        # Default to False in case of errors to be safe
        return False

def normalize_arabic(text: str) -> str:
    """
    Normalizes Arabic text to standard format for reliable comparisons:
    - Removes diacritics (Harakat)
    - Replaces variant alefs (أ, إ, آ) with standard alef (ا)
    - Replaces teh marbuta (ة) with heh (ه)
    - Replaces yeh barree (ى) with standard yeh (ي)
    - Removes non-alphanumeric/non-arabic-character symbols and extra spacing
    """
    if not text:
        return ""
    text = str(text).strip().lower()
    # Remove Arabic diacritics
    text = re.sub(r'[\u064b-\u0652]', '', text)
    # Normalize alef
    text = re.sub(r'[أإآ]', 'ا', text)
    # Normalize teh marbuta
    text = re.sub(r'ة', 'ه', text)
    # Normalize yeh
    text = re.sub(r'ى', 'ي', text)
    # Replace 'ابو ' with 'ابو' (normalize spacing for Abu/أبو)
    text = re.sub(r'\bابو\s+', 'ابو', text)
    # Replace any punctuation and non-alphanumeric chars with space
    text = re.sub(r'[^\w\s]', ' ', text)
    # Normalize multiple spaces to single space
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def get_yahoo_ticker(symbol: str) -> str:
    """
    Maps an EGX symbol to its correct Yahoo Finance ticker.
    Handles special cases like ISIN tickers (e.g. ORAS, DCRC, NCGC).
    """
    mapping = {
        "ORAS": "EGS95001C011.CA",
        "DCRC": "EGS21451C017-EGP.CA",
        "NCGC": "EGS32131C012-EGP.CA",
        "GTHE": "EGS74081C018-EGP.CA",
        "ACRO": "EGS3E071C013-EGP.CA",
        "AMES": "EGS72081C010.CA",
        "CAED": "EGS72201C014.CA",
        "ELNA": "EGS300L1C011.CA",
        "NIPH": "EGS38331C012.CA",
        "RREI": "EGS65011C016.CA",
        "AJWA": "EGS30211C014.CA",
        "BONY": "EGS656M1C010.CA",
        "DOMT": "EGS30031C016.CA",
        "FERC": "EGS385S1C012.CA",
        "GTEX": "EGS59U92C011.CA",
        "RAKT": "EGS36021C011.CA",
        "TANM": "EGS21EB1C011.CA",
        "TAQA": "EGS490S1C014.CA",
        "UTOP": "EGS655Y1C017.CA"
    }
    symbol_upper = symbol.upper()
    return mapping.get(symbol_upper, f"{symbol_upper}.CA")

