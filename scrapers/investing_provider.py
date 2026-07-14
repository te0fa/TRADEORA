import os
import json
import datetime
import pytz
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from scrapers.utils import is_market_open, normalize_arabic, MarketClosedException

class InvestingProvider:
    """
    Data provider for Investing.com Egypt market prices.
    Uses Playwright to select All Egypt Stocks filter and load the complete list.
    """
    
    def __init__(self, mapping_dir: str = "data"):
        self.mapping_dir = mapping_dir
        self.url = "https://sa.investing.com/equities/egypt"
        self.fuzzy_matches = [] # List of tuples: (original_row_name, symbol, mapped_name)
        
    def _load_mappings(self) -> dict:
        """Loads and merges Arabic name mappings, normalizing keys for comparison."""
        mapping = {}
        
        # 1. TradingView Mapping
        tv_path = os.path.join(self.mapping_dir, "tradingview_mapping.json")
        if os.path.exists(tv_path):
            try:
                with open(tv_path, "r", encoding="utf-8") as f:
                    tv_data = json.load(f)
                    for name, sym in tv_data.items():
                        norm = normalize_arabic(name)
                        if norm:
                            mapping[norm] = (sym.upper(), name)
            except Exception as e:
                print(f"[InvestingProvider] Error loading TV mapping: {e}")
                
        # 2. Mubasher Mapping (takes priority or complements)
        mubasher_path = os.path.join(self.mapping_dir, "mubasher_mapping.json")
        if os.path.exists(mubasher_path):
            try:
                with open(mubasher_path, "r", encoding="utf-8") as f:
                    mubasher_data = json.load(f)
                    for name, details in mubasher_data.items():
                        sym = details.get("symbol")
                        if sym:
                            norm = normalize_arabic(name)
                            if norm:
                                mapping[norm] = (sym.upper(), name)
            except Exception as e:
                print(f"[InvestingProvider] Error loading Mubasher mapping: {e}")
                
        return mapping

    def _parse_volume(self, vol_str: str) -> int:
        """Parses formatted volume strings (e.g. '169.93M', '331.69K') to integers."""
        if not vol_str or vol_str == "-":
            return 0
        vol_str = vol_str.strip().upper()
        multiplier = 1
        if vol_str.endswith("M"):
            multiplier = 1000000
            vol_str = vol_str[:-1]
        elif vol_str.endswith("K"):
            multiplier = 1000
            vol_str = vol_str[:-1]
        try:
            return int(float(vol_str.replace(",", "")) * multiplier)
        except ValueError:
            return 0

    async def fetch_prices(self, bypass_session_guard: bool = False) -> tuple:
        """
        Fetches all Egypt stock prices from sa.investing.com.
        Returns a tuple of (results_list, fuzzy_matches_list).
        """
        if not bypass_session_guard and not is_market_open():
            print("[InvestingProvider] Market Closed. Skipping scraping.")
            raise MarketClosedException("Market Closed")
            
        mapping = self._load_mappings()
        results = []
        self.fuzzy_matches = []
        
        # Explicit symbol overrides for Investing.SA names to resolve collisions
        name_overrides_raw = {
            "فوري": "FWRY",
            "السويدي": "SWDY",
            "هيرمس": "HRHO",
            "الاسكندرية لتداول الحاويات": "ALCN",
            "الاسكندرية لتداول الحاويات والبضائع": "ALCN",
            "الاسكندرية للحاويات": "ALCN",
            "الإسكندرية للحاويات": "ALCN",
            "العبوات الدوائية": "APPC",
            "اسيك للتعدين": "ASCM",
            "أسكوم": "ASCM",
            "اسكوم": "ASCM",
            "سي اي كابيتال": "CICH",
            "مصر للكيماويات": "MICH",
            "راميدا": "RMDA",
            "تعليم لخدمات الإدارة": "TALM",
            "تعليم لخدمات الادارة": "TALM",
            "اوراسكوم كونستراكشون": "ORAS",
            "اوراسكوم كونستراكشون بي ال سي": "ORAS",
            "اوراسكوم للانشاءات": "ORAS",
            "أوراسكوم للإنشاءات": "ORAS",
            "راية للاتصالات": "RACC",
            "راية مركز الاتصالات": "RACC",
            "راية خدمات مراكز الاتصالات": "RACC",
            "راية القابضة": "RAYA",
            "راية القابضة للاستثمارات المالية": "RAYA",
            "ثمار": "EASB",
            "كيما": "EGCH",
            "ابوظبي الاسلامي": "ADIB",
            "مصرف ابوظبي الاسلامي": "ADIB",
            "مصرف ابو ظبي الاسلامي": "ADIB",
            "أبو ظبي الإسلامي": "ADIB",
        }
        name_overrides = {normalize_arabic(k): v for k, v in name_overrides_raw.items()}
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                viewport={"width": 1280, "height": 900}
            )
            page = await context.new_page()
            # Modify navigator.webdriver
            await page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            
            try:
                print("[InvestingProvider] Loading Egypt equities page...")
                await page.goto(self.url, wait_until="domcontentloaded", timeout=40000)
                await page.wait_for_timeout(5000)
                
                # Step 1: Open index dropdown filter
                print("[InvestingProvider] Selecting 'جميع أسهم مصر' index filter...")
                dropdown = page.locator("div.dropdown_noSelect__rU_0Y").filter(has_text="EGX 30").first
                await dropdown.scroll_into_view_if_needed()
                await dropdown.click()
                await page.wait_for_timeout(1000)
                
                # Click the option "جميع أسهم مصر"
                option = page.locator("span:has-text('جميع أسهم مصر')").first
                await option.click()
                await page.wait_for_timeout(5000)
                
                # Step 2: Scroll and Click 'Load More' twice
                for click_num in range(1, 3):
                    print(f"[InvestingProvider] Attempting load more click #{click_num}...")
                    load_more = page.locator("text='تحميل المزيد'").first
                    if await load_more.is_visible():
                        await load_more.scroll_into_view_if_needed()
                        await page.wait_for_timeout(1000)
                        await load_more.click()
                        await page.wait_for_timeout(4000)
                    else:
                        print(f"[InvestingProvider] Load more button not visible at click #{click_num}")
                        
                # Step 3: Parse the rendered HTML table
                print("[InvestingProvider] Parsing stock prices table...")
                content = await page.content()
                soup = BeautifulSoup(content, 'html.parser')
                
                tables = soup.find_all("table")
                if tables:
                    rows = tables[0].find_all("tr")
                    print(f"[InvestingProvider] Found {len(rows)-1} rows in table.")
                    
                    cairo_tz = pytz.timezone('Africa/Cairo')
                    timestamp = datetime.datetime.now(cairo_tz).isoformat()
                    
                    for row in rows[1:]:
                        cells = [td.text.strip() for td in row.find_all("td")]
                        if len(cells) >= 8:
                            # 1. Company Name (Arabic)
                            raw_name = cells[1]
                            norm_name = normalize_arabic(raw_name)
                            if not norm_name:
                                continue
                                
                            # Match company symbol
                            matched_symbol = None
                            matched_mapped_name = None
                            is_fuzzy = False
                            
                            # Check explicit overrides first
                            if raw_name in name_overrides:
                                matched_symbol = name_overrides[raw_name]
                                matched_mapped_name = raw_name
                                is_fuzzy = True
                            elif norm_name in name_overrides:
                                matched_symbol = name_overrides[norm_name]
                                matched_mapped_name = raw_name
                                is_fuzzy = True
                            # Exact Normalized Match
                            elif norm_name in mapping:
                                matched_symbol, matched_mapped_name = mapping[norm_name]
                            else:
                                # Safe word-level matching
                                words_row = set(norm_name.split())
                                best_match = None
                                best_score = 0
                                
                                for m_norm, (sym, original_name) in mapping.items():
                                    words_map = set(m_norm.split())
                                    
                                    # Ensure words_map is a subset of words_row
                                    if words_map.issubset(words_row):
                                        intersection = words_map.intersection(words_row)
                                        union = words_map.union(words_row)
                                        score = len(intersection) / len(union) if union else 0
                                        
                                        # Strict rules for single-word mapping names (like 'ثمار' or 'كيما')
                                        if len(words_map) == 1:
                                            # For single-word names, only match if it's a high Jaccard similarity (e.g. >= 0.5)
                                            # This prevents 'ثمار' from matching 'الخليج للاستثمارات العربية'
                                            if score >= 0.5:
                                                if score > best_score:
                                                    best_score = score
                                                    best_match = (sym, original_name)
                                        else:
                                            # Multi-word subset matches are safe
                                            if score > best_score:
                                                best_score = score
                                                best_match = (sym, original_name)
                                                
                                if best_match and best_score > 0.3:
                                    matched_symbol, matched_mapped_name = best_match
                                    # It's fuzzy if it wasn't an exact match
                                    is_fuzzy = (normalize_arabic(matched_mapped_name) != norm_name)
                                    
                            if matched_symbol:
                                if is_fuzzy:
                                    self.fuzzy_matches.append((raw_name, matched_symbol, matched_mapped_name))
                                    
                                # Parse values
                                try:
                                    # Cells layout:
                                    # 0: Empty, 1: Name, 2: Last Price, 3: High, 4: Low, 5: Change, 6: Change %, 7: Volume
                                    price = float(cells[2].replace(",", ""))
                                    change = float(cells[5].replace(",", ""))
                                    change_percent = float(cells[6].replace(",", "").replace("%", ""))
                                    volume = self._parse_volume(cells[7])
                                    
                                    results.append({
                                        "symbol": matched_symbol,
                                        "price": price,
                                        "change": change,
                                        "change_percent": change_percent,
                                        "volume": volume,
                                        "timestamp": timestamp,
                                        "source": "Investing"
                                    })
                                except Exception as val_err:
                                    # Skip rows with invalid or missing values
                                    pass
                                    
            except Exception as e:
                print(f"[InvestingProvider] Error: {e}")
            finally:
                await browser.close()
                
        return results, self.fuzzy_matches
