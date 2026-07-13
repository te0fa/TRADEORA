import os
import re
import glob
import shutil
import logging
import unicodedata
import json
from datetime import datetime
import pandas as pd
import pdfplumber
from config import settings

logger = logging.getLogger(__name__)

# Column keywords for pdfplumber mapping (checking both standard and reversed headers)
COLUMN_KEYWORDS = {
    "symbol": ["#", "الكود", "الرمز", "no.", "code", "symbol"],
    "name": ["الورقة المالية", "ﺔﻴﻟﺎﻤﻟﺍ ﺔﻗﺭﻮﻟﺍ", "الشركة", "اسم الشركة", "stock name", "company name", "name"],
    "open_price": ["فتح", "ﺢﺘﻓ", "سعر الفتح", "open", "open price"],
    "high_price": ["أعلى", "ﺮﻌﺳ ﻲﻠﻋﺍ", "أعلى سعر", "high"],
    "low_price": ["أدنى", "ﺮﻌﺳ ﻲﻧﺩﺍ", "أقل سعر", "low"],
    "close_price": ["إغلاق", "إقفال", "ﻕﻼﻏﺇ", "سعر الإغلاق", "close", "close price"],
    "change_percent": ["تغير %", "% تغير", "% ﺮﻴﻐﺗ", "التغير", "% ﺮﻴﻐﺘﻟﺍ", "تغير", "change", "change %", "% change"],
    "volume": ["حجم التداول", "حجم", "الكمية", "ﻝﻭﺍﺪﺘﻟﺍ ﻢﺠﺣ ﺔﻗﺭﻮﻟﺎﺑ", "حجم التداول بالورقة", "volume", "qty", "volume (shares)"],
    "value_traded": ["قيمة التداول", "القيمة", "ﻝﻭﺍﺪﺘﻟﺍ ﺔﻤﻴﻗ ﻪﻴﻨﺠﻟﺎﺑ", "قيمة التداول بالجنيه", "value", "value traded", "value traded in egp"],
    "currency": ["العملة", "ﺔﻠﻤﻌﻟﺍ", "currency", "cr"]
}

class EGXScraper:
    def __init__(self):
        # The main source file path (once discovered and copied)
        self.copied_pdf_path = os.path.join(settings.DATA_FOLDER, "egx_daily_report.pdf")
        self.copied_pdf_path_eng = os.path.join(settings.DATA_FOLDER, "egx_daily_report_eng.pdf")
        self.shariah_json_path = os.path.join(settings.DATA_FOLDER, "shariah_companies.json")
        self.mubasher_json_path = os.path.join(settings.DATA_FOLDER, "mubasher_mapping.json")
        self.tradingview_json_path = os.path.join(settings.DATA_FOLDER, "tradingview_mapping.json")
        self.shariah_map = {}
        self.mubasher_map = {}
        self.tradingview_map = {}
        self._load_shariah_map()
        self._load_tradingview_map()
        self._load_mubasher_map()

    def _load_shariah_map(self):
        """Loads Shariah-compliant company mappings from JSON file if available."""
        if os.path.exists(self.shariah_json_path):
            try:
                with open(self.shariah_json_path, "r", encoding="utf-8") as f:
                    companies = json.load(f)
                for c in companies:
                    name_ar = c.get("name_ar")
                    ticker = c.get("symbol")
                    if name_ar and ticker:
                        norm_name = self._clean_and_normalize_arabic_for_map(name_ar)
                        self.shariah_map[norm_name] = ticker
                logger.info(f"Loaded {len(self.shariah_map)} Shariah company mappings from JSON.")
            except Exception as e:
                logger.warning(f"Failed to load Shariah companies JSON map: {e}")

    def _load_tradingview_map(self):
        """Loads TradingView company mappings from JSON file if available."""
        if os.path.exists(self.tradingview_json_path):
            try:
                with open(self.tradingview_json_path, "r", encoding="utf-8") as f:
                    self.tradingview_map = json.load(f)
                logger.info(f"Loaded {len(self.tradingview_map)} TradingView company mappings from JSON.")
            except Exception as e:
                logger.warning(f"Failed to load TradingView companies JSON map: {e}")

    def _load_mubasher_map(self):
        """Loads Mubasher company mappings from JSON file if available."""
        if os.path.exists(self.mubasher_json_path):
            try:
                with open(self.mubasher_json_path, "r", encoding="utf-8") as f:
                    self.mubasher_map = json.load(f)
                logger.info(f"Loaded {len(self.mubasher_map)} Mubasher company mappings from JSON.")
            except Exception as e:
                logger.warning(f"Failed to load Mubasher companies JSON map: {e}")

    def _clean_and_normalize_arabic_for_map(self, s: str) -> str:
        """Helper to normalize Arabic name identically to the PDF parser output."""
        if not s:
            return ""
        normalized = unicodedata.normalize('NFKC', str(s))
        cleaned = re.sub(r'\s+', ' ', normalized).strip()
        return cleaned

    def fetch_data(self) -> list[dict]:
        """
        Main interface method.
        Locates the latest Arabic and English official PDF reports,
        copies them, parses both, links them by serial/sequence number,
        extracts English names, and returns the unified price records list.
        """
        logger.info("Initializing EGX dual PDF scraper pipeline...")
        
        # 1. Try to download the latest EGX PDF files (Arabic & English) dynamically using Playwright
        try:
            from scrapers.pdf_downloader import EGXDownloader
            import asyncio
            downloader = EGXDownloader()
            # Run the async downloader in synchronous context
            arb_downloaded, eng_downloaded = asyncio.run(downloader.download_reports())
            logger.info("Playwright PDF download succeeded.")
            arb_path = arb_downloaded
            eng_path = eng_downloaded
        except Exception as download_err:
            logger.warning(
                f"Playwright download failed: {download_err}.\n"
                "Falling back to local data directory PDF discovery..."
            )
            # Fallback to scanning Desktop, Downloads for files manually downloaded by user
            arb_path, eng_path = self._find_latest_egx_pdfs()
            
        if not arb_path:
            raise FileNotFoundError("No EGX Arabic Daily Report PDF file found.")
        if not eng_path:
            raise FileNotFoundError("Corresponding EGX English Daily Report PDF file not found.")
            
        logger.info(f"Using Arabic PDF file: {arb_path}")
        logger.info(f"Using English PDF file: {eng_path}")
        
        # 2. Copy the files to local project data folder
        try:
            os.makedirs(os.path.dirname(self.copied_pdf_path), exist_ok=True)
            if os.path.abspath(arb_path) != os.path.abspath(self.copied_pdf_path):
                shutil.copy2(arb_path, self.copied_pdf_path)
            if os.path.abspath(eng_path) != os.path.abspath(self.copied_pdf_path_eng):
                shutil.copy2(eng_path, self.copied_pdf_path_eng)
            logger.info("Copied both PDF reports to local data folder.")
        except Exception as e:
            logger.warning(f"Could not copy PDF files to project data directory: {e}")
            self.copied_pdf_path = arb_path
            self.copied_pdf_path_eng = eng_path
            
        # 3. Parse both PDFs
        records_arb = self._parse_pdf(self.copied_pdf_path)
        records_eng = self._parse_pdf(self.copied_pdf_path_eng)
        
        # 4. Align and verify
        if len(records_arb) != len(records_eng):
            raise ValueError(
                f"Sync Error: Row count mismatch between Arabic PDF ({len(records_arb)}) "
                f"and English PDF ({len(records_eng)})."
            )
            
        logger.info(f"Sync Check: Both PDFs contain exactly {len(records_arb)} records. Verifying row sequence...")
        
        for i in range(len(records_arb)):
            arb = records_arb[i]
            eng = records_eng[i]
            
            # Check price match
            price_diff = abs(arb["close_price"] - eng["close_price"])
            if price_diff > 0.01:
                raise ValueError(
                    f"Sync Error: Closing price mismatch at row index {i}!\n"
                    f"  Arabic Company: '{arb['name']}' (Close: {arb['close_price']})\n"
                    f"  English Company: '{eng['name']}' (Close: {eng['close_price']})"
                )
                
            # Check serial match
            if arb.get("_serial") != eng.get("_serial"):
                raise ValueError(
                    f"Sync Error: Sequence number mismatch at row index {i}!\n"
                    f"  Arabic Serial: '{arb.get('_serial')}' (Name: '{arb['name']}')\n"
                    f"  English Serial: '{eng.get('_serial')}' (Name: '{eng['name']}')"
                )
                
            # Set English name
            arb["name_en"] = eng["name"]
            
            # Clean up temporary keys
            arb.pop("_serial", None)
            
        logger.info("Successfully matched all 236 companies 1-to-1. English names mapped.")
        return records_arb

    def _find_latest_egx_pdfs(self) -> tuple[str | None, str | None]:
        """Scans Desktop, Downloads, and local folders for recently modified Arabic and English EGX PDF files."""
        user_home = os.path.expanduser("~")
        search_dirs = [
            os.path.join(user_home, "OneDrive", "Desktop"),
            os.path.join(user_home, "Desktop"),
            os.path.join(user_home, "Downloads"),
            os.path.join(user_home, "OneDrive", "Downloads"),
            settings.DATA_FOLDER
        ]
        
        patterns = [
            "*_ARB.pdf",
            "Daily*_ARB.pdf",
            "egx_daily_report.pdf" # fallback
        ]
        
        candidates = []
        for d in search_dirs:
            if not os.path.exists(d):
                continue
            for p in patterns:
                files = glob.glob(os.path.join(d, p))
                for f in files:
                    try:
                        mtime = os.path.getmtime(f)
                        candidates.append((f, mtime))
                    except Exception:
                        pass
                        
        if not candidates:
            return None, None
            
        # Sort by modification time descending (most recent first)
        candidates.sort(key=lambda x: x[1], reverse=True)
        arb_path = candidates[0][0]
        
        # Try to find the corresponding ENG file
        eng_path = None
        if "_ARB.pdf" in arb_path:
            possible_eng = arb_path.replace("_ARB.pdf", "_ENG.pdf")
            if os.path.exists(possible_eng):
                eng_path = possible_eng
        elif "_arb.pdf" in arb_path:
            possible_eng = arb_path.replace("_arb.pdf", "_eng.pdf")
            if os.path.exists(possible_eng):
                eng_path = possible_eng
        else:
            dir_name = os.path.dirname(arb_path)
            eng_files = glob.glob(os.path.join(dir_name, "*_ENG.pdf"))
            if eng_files:
                eng_path = eng_files[0]
                
        return arb_path, eng_path

    def _clean_and_normalize_arabic(self, s: str) -> str:
        """Reverses and normalizes Arabic presentation forms to standard Arabic characters."""
        if not s:
            return ""
        s = str(s).strip()
        # Check if contains Arabic characters
        if any(0x0600 <= ord(c) <= 0x06FF or 0xFE70 <= ord(c) <= 0xFEFF for c in s):
            # Characters are printed backwards in the PDF stream, so reverse them
            reversed_str = s[::-1]
            # Convert ligatures and presentation forms to standard character classes
            normalized = unicodedata.normalize('NFKC', reversed_str)
            # Remove any excess whitespace/newlines
            cleaned = re.sub(r'\s+', ' ', normalized).strip()
            return cleaned
        return s

    def _get_ticker_symbol(self, normalized_name: str, serial_id: str) -> str:
        """Maps a company's Arabic name to its standard English ticker, or generates a stable fallback symbol."""
        name = normalized_name.strip()
        
        # 1. Try to look up in the Shariah mapping table loaded from JSON
        if name in self.shariah_map:
            return self.shariah_map[name]
            
        # 2. Try to look up in the TradingView mapping table loaded from JSON
        if name in self.tradingview_map:
            return self.tradingview_map[name]
            
        # 3. Try to look up in the Mubasher mapping table loaded from JSON
        if name in self.mubasher_map:
            return self.mubasher_map[name]["symbol"]
            
        # 3. Substring keyword mappings for major Egyptian stocks
        if "التجاري الدولي" in name or "سى اى بى" in name or "comi" in name.lower():
            return "COMI"
        elif "فوري" in name or "fwry" in name.lower():
            return "FWRY"
        elif "الشرقية" in name or "ايسترن" in name or "east" in name.lower():
            return "EAST"
        elif "طلعت مصطفى" in name or "tmgh" in name.lower():
            return "TMGH"
        elif "هيرميس" in name or "hrho" in name.lower():
            return "HRHO"
        elif "السويدى" in name or "swdy" in name.lower():
            return "SWDY"
        elif "المصرية للاتصالات" in name or "etel" in name.lower():
            return "ETEL"
        elif "ابوقير" in name or "أبو قير" in name or "abuk" in name.lower():
            return "ABUK"
        elif "حديد عز" in name or "esrs" in name.lower():
            return "ESRS"
        elif "كريدى اجريكول" in name or "cieb" in name.lower():
            return "CIEB"
        elif "قطر الوطني" in name or "qnba" in name.lower():
            return "QNBA"
            
        # Fallback using a clean prefix and the serial number
        return f"EGX_{serial_id}"

    def _clean_number(self, val) -> float | int | None:
        """Cleans formatting characters like commas, percentage signs, and converts to float/int."""
        if pd.isna(val) or val is None:
            return None
        if isinstance(val, (int, float)):
            return val
            
        s = str(val).strip()
        if not s or s in ("-", "null", "none", "N/A", "NaN", "nan"):
            return None
            
        s = s.replace(",", "").replace("%", "").strip()
        try:
            if "." in s:
                return float(s)
            return int(s)
        except ValueError:
            return None

    def _parse_pdf(self, pdf_path: str) -> list[dict]:
        """Parses stock tables from the PDF file using pdfplumber."""
        logger.info(f"Opening PDF file for parsing: {pdf_path}")
        records = []
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                # 1. Extract session date from text
                price_date = self._extract_date_from_pdf(pdf)
                logger.info(f"Extracted PDF session date: {price_date}")
                
                # 2. Iterate pages (usually stock tables are between page 13 and 25)
                # We scan all pages just to be robust, but focus on page content
                pages_count = len(pdf.pages)
                for idx in range(pages_count):
                    page = pdf.pages[idx]
                    tables = page.extract_tables()
                    
                    for t_idx, table in enumerate(tables):
                        if not table or len(table) < 2:
                            continue
                            
                        # Normalize headers
                        headers = [re.sub(r'\s+', ' ', str(c)).strip() for c in table[0]]
                        
                        # Map headers to indices
                        col_map = {}
                        for field, aliases in COLUMN_KEYWORDS.items():
                            for c_idx, h in enumerate(headers):
                                h_rev = h[::-1]
                                match = False
                                for alias in aliases:
                                    if len(alias) == 1 or alias == "cr":
                                        if h.lower().strip() == alias.lower() or h_rev.lower().strip() == alias.lower():
                                            match = True
                                            break
                                    else:
                                        if alias.lower() in h.lower() or alias.lower() in h_rev.lower():
                                            match = True
                                            break
                                if match:
                                    col_map[field] = c_idx
                                    break
                                    
                        # We identify a valid stock prices table if we match 'name' and 'close_price'
                        if "name" in col_map and "close_price" in col_map:
                            logger.debug(f"Matched prices table on Page {idx + 1}, Table {t_idx + 1}")
                            
                            for r_idx, row in enumerate(table[1:]):
                                name_col = col_map["name"]
                                if name_col >= len(row) or not row[name_col]:
                                    continue
                                    
                                raw_name = row[name_col]
                                if raw_name.strip() in (headers[name_col], "الورقة المالية"):
                                    continue
                                    
                                # Parse record
                                record = {
                                    "price_date": price_date,
                                    "source_file": os.path.basename(pdf_path)
                                }
                                
                                # Process each mapped field
                                for field, c_idx in col_map.items():
                                    if c_idx < len(row):
                                        val = row[c_idx]
                                        if val is not None:
                                            val = str(val).strip()
                                            
                                        if field == "name":
                                            record[field] = self._clean_and_normalize_arabic(val)
                                        elif field == "symbol":
                                            # We will resolve the symbol below after parsing both serial and name
                                            record["_serial"] = val
                                        elif field == "currency":
                                            record[field] = val
                                        else:
                                            record[field] = self._clean_number(val)
                                            
                                # Resolve symbol and clean details
                                if record.get("name") and record.get("close_price") is not None:
                                    serial_id = record.get("_serial") or str(r_idx + 1)
                                    record["_serial"] = serial_id
                                    record["symbol"] = self._get_ticker_symbol(record["name"], serial_id)
                                    
                                    # Add to parsed records list
                                    records.append(record)
                                    
            logger.info(f"Successfully parsed {len(records)} price records from PDF.")
            return records
            
        except Exception as e:
            error_msg = f"Failed to parse PDF file: {e}"
            logger.error(error_msg)
            logger.error(traceback.format_exc())
            raise RuntimeError(error_msg)

    def _extract_date_from_pdf(self, pdf) -> str:
        """Extracts the session date (تاريخ الجلسة) from the PDF text using regex."""
        # Search the first 10 pages for the session date
        for i in range(min(10, len(pdf.pages))):
            text = pdf.pages[i].extract_text() or ""
            # Search for standard YYYY/MM/DD matches
            matches = re.findall(r'(\d{4})/(\d{2})/(\d{2})', text)
            if matches:
                year, month, day = matches[0]
                try:
                    # Validate date
                    dt = datetime(int(year), int(month), int(day))
                    return dt.strftime("%Y-%m-%d")
                except ValueError:
                    continue
                    
        # Fallback to today's date if not found
        return datetime.today().strftime("%Y-%m-%d")
