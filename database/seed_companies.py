import os
import json
import re
import logging
import shutil
import unicodedata
from pypdf import PdfReader
from config import settings
from database import db

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PDF_PATH = os.path.join(settings.BASE_DIR, "data", "egypt-list-q1-2026.pdf")
JSON_PATH = os.path.join(settings.BASE_DIR, "data", "shariah_companies.json")

def parse_boubyan_pdf(pdf_path: str) -> list[dict]:
    """Parses the Boubyan Capital Shariah-compliant stocks PDF and returns mapped companies."""
    if not os.path.exists(pdf_path):
        logger.error(f"Boubyan PDF file not found at: {pdf_path}")
        return []

    logger.info(f"Parsing Boubyan Shariah PDF: {pdf_path}")
    reader = PdfReader(pdf_path)
    companies = []
    
    excluded_suffixes = {"SAE", "PLC", "CO", "LTD", "EDR", "EDRS", "II", "III", "IV"}

    for idx in range(len(reader.pages)):
        text = reader.pages[idx].extract_text() or ""
        lines = text.split("\n")
        for line in lines:
            line_clean = line.strip()
            m = re.match(r'^(\d+)\s*(?:[\uf084]\s*)?(.+?)\s*(?:[\uf083]\s*)?(\1)$', line_clean)
            if m:
                serial = m.group(1)
                content = m.group(2).strip()
                words = content.split()
                
                ticker_candidates = []
                for w_idx, w in enumerate(words):
                    w_clean = re.sub(r'[^A-Z0-9]', '', w)
                    if 3 <= len(w_clean) <= 6 and w_clean.isupper() and w_clean not in excluded_suffixes:
                        if w_idx > 0:
                            ticker_candidates.append((w_idx, w_clean, w))
                
                if ticker_candidates:
                    w_idx, ticker, raw_w = ticker_candidates[-1]
                    eng_words = words[:w_idx]
                    arb_words = words[w_idx + 1:]
                    
                    arb_prefix = ""
                    if len(raw_w) > len(ticker) and raw_w.startswith(ticker):
                        arb_prefix = raw_w[len(ticker):]
                    
                    eng_name = " ".join(eng_words).strip()
                    arb_name = (arb_prefix + " " + " ".join(arb_words)).strip()
                    
                    if ticker == "RVA" and eng_name.endswith(" A"):
                        ticker = "ARVA"
                        eng_name = eng_name[:-2].strip()
                        
                    normalized = unicodedata.normalize('NFKC', arb_name)
                    arb_name_cleaned = re.sub(r'\s+', ' ', normalized).strip()
                    if not any(0x0600 <= ord(c) <= 0x06FF for c in arb_name_cleaned):
                        arb_name_cleaned = None
                        
                    companies.append({
                        "symbol": ticker,
                        "name_en": eng_name,
                        "name_ar": arb_name_cleaned,
                        "is_shariah_compliant": True,
                        "currency": "EGP",
                        "listing_status": "listed"
                    })
                    
    logger.info(f"Successfully parsed {len(companies)} Shariah companies.")
    return companies

def seed_database():
    """Parses PDF and inserts/updates companies in the database."""
    # Ensure data folder exists
    os.makedirs(os.path.dirname(JSON_PATH), exist_ok=True)
    
    # 1. Copy PDF from scratch if needed
    scratch_pdf = r"C:\Users\mosta\.gemini\antigravity\brain\b83515ce-ab0e-42d2-883a-1ec0fc99ec58\scratch\egypt-list-q1-2026.pdf"
    if os.path.exists(scratch_pdf) and not os.path.exists(PDF_PATH):
        shutil.copy2(scratch_pdf, PDF_PATH)
        logger.info(f"Copied Boubyan PDF to: {PDF_PATH}")
        
    if not os.path.exists(PDF_PATH):
        logger.error(f"Cannot seed database: {PDF_PATH} does not exist.")
        return
        
    # 2. Parse companies
    companies = parse_boubyan_pdf(PDF_PATH)
    
    if not companies:
        logger.warning("No companies parsed to seed.")
        return
        
    # Save to local JSON for scraper mapping
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(companies, f, ensure_ascii=False, indent=4)
    logger.info(f"Saved Shariah mapping JSON to: {JSON_PATH}")
    
    # 3. Seed Supabase
    db.set_dry_run(False) # Turn off dry-run to attempt database connection
    client = db.get_db_client()
    
    if db.is_dry_run() or client is None:
        logger.info("Supabase client not initialized or running in Dry Run mode. Seeding simulated.")
        print(f"Simulating seeding of {len(companies)} companies...")
        return
        
    logger.info(f"Connecting to Supabase to seed {len(companies)} companies...")
    inserted_count = 0
    updated_count = 0
    
    for c in companies:
        try:
            res = client.table("companies").select("id, is_shariah_compliant").eq("symbol", c["symbol"]).execute()
            if res.data:
                company_id = res.data[0]["id"]
                updates = {
                    "is_shariah_compliant": True,
                    "name_en": c["name_en"]
                }
                if c["name_ar"]:
                    updates["name_ar"] = c["name_ar"]
                client.table("companies").update(updates).eq("id", company_id).execute()
                updated_count += 1
            else:
                client.table("companies").insert(c).execute()
                inserted_count += 1
        except Exception as e:
            logger.error(f"Error seeding company {c['symbol']}: {e}")
            
    logger.info(f"Database seeding completed. Inserted: {inserted_count}, Updated: {updated_count}")

if __name__ == "__main__":
    seed_database()
