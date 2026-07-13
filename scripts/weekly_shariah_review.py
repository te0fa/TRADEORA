import os
import re
import sys
import argparse
import requests
import urllib.parse
from bs4 import BeautifulSoup
from pypdf import PdfReader
from database.db import get_db_client

def discover_latest_pdf_url() -> str:
    """Discovers the latest Egypt Shariah PDF URL from Boubyan Capital's page."""
    base_page = "https://www.boubyancapital.com/ar/brokerage-ar/"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    
    r = requests.get(base_page, headers=headers, timeout=15)
    r.raise_for_status()
    
    soup = BeautifulSoup(r.text, 'html.parser')
    for link in soup.find_all('a'):
        href = link.get('href', '')
        # Check if link points to the Egypt Shariah PDF list
        if '.pdf' in href.lower() and 'egypt-list' in href.lower():
            full_url = urllib.parse.urljoin("https://www.boubyancapital.com", href)
            return full_url
            
    raise RuntimeError("Could not find the Egypt Shariah PDF link on Boubyan brokerage page.")

def download_pdf(url: str, save_path: str):
    """Downloads the PDF from the given URL and saves it locally."""
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    r = requests.get(url, headers=headers, timeout=30)
    r.raise_for_status()
    with open(save_path, "wb") as f:
        f.write(r.content)

def parse_shariah_pdf(pdf_path: str) -> set[str]:
    """Parses the Shariah PDF and extracts the unique set of symbols."""
    reader = PdfReader(pdf_path)
    symbols = set()
    excluded_suffixes = {"SAE", "PLC", "CO", "LTD", "EDR", "EDRS", "II", "III", "IV"}

    for page_idx in range(len(reader.pages)):
        text = reader.pages[page_idx].extract_text() or ""
        lines = text.split("\n")
        for line in lines:
            line_clean = line.strip()
            # Match serial number bounding lines (e.g. "1 ... 1")
            m = re.match(r'^(\d+)\s*(?:[\uf084]\s*)?(.+?)\s*(?:[\uf083]\s*)?(\1)$', line_clean)
            if m:
                content = m.group(2).strip()
                words = content.split()
                
                ticker_candidates = []
                for w_idx, w in enumerate(words):
                    w_clean = re.sub(r'[^A-Z0-9]', '', w)
                    if 3 <= len(w_clean) <= 6 and w_clean.isupper() and w_clean not in excluded_suffixes:
                        if w_idx > 0:
                            ticker_candidates.append(w_clean)
                
                if ticker_candidates:
                    ticker = ticker_candidates[-1]
                    if ticker == "RVA":
                        ticker = "ARVA"
                    symbols.add(ticker)
                    
    return symbols

def main():
    parser = argparse.ArgumentParser(description="Weekly Shariah compliance reviewer.")
    parser.add_argument("--dry-run", action="store_true", help="Run without updating the database.")
    args = parser.parse_args()

    print("============================================================")
    print("                WEEKLY SHARIAH COMPLIANCE REVIEW            ")
    print("============================================================")

    # 1. Discover and download PDF
    try:
        pdf_url = discover_latest_pdf_url()
        print(f"Discovered Shariah PDF URL: {pdf_url}")
    except Exception as e:
        print(f"Error discovering PDF URL: {e}")
        sys.exit(1)
        
    temp_pdf_path = "data/weekly_shariah_temp.pdf"
    os.makedirs("data", exist_ok=True)
    
    try:
        print("Downloading PDF...")
        download_pdf(pdf_url, temp_pdf_path)
        print("Download complete.")
    except Exception as e:
        print(f"Error downloading PDF: {e}")
        sys.exit(1)

    # 2. Parse symbols from PDF
    try:
        active_shariah_symbols = parse_shariah_pdf(temp_pdf_path)
        print(f"Parsed {len(active_shariah_symbols)} Shariah-compliant symbols from PDF.")
    except Exception as e:
        print(f"Error parsing PDF: {e}")
        sys.exit(1)
    finally:
        # Cleanup temp file
        if os.path.exists(temp_pdf_path):
            os.remove(temp_pdf_path)

    # 3. Connect to Database and retrieve current Shariah status
    client = get_db_client()
    if not client:
        print("Error: Supabase client is not available. Please check environment configuration.")
        sys.exit(1)
        
    try:
        res = client.table("companies").select("id, symbol, name_ar, is_shariah_compliant").execute()
        db_companies = res.data
    except Exception as e:
        print(f"Error reading from database: {e}")
        sys.exit(1)

    old_shariah_companies = [c for c in db_companies if c.get("is_shariah_compliant") == True]
    old_shariah_symbols = {c["symbol"].upper() for c in old_shariah_companies}
    old_shariah_count = len(old_shariah_companies)

    print(f"Database currently contains {old_shariah_count} Shariah-compliant companies.")

    # 4. Compare status and identify changes
    entered = [] # (company_dict, new_status)
    exited = []
    
    # We iterate over all database companies to check their new state
    for c in db_companies:
        sym = c["symbol"].upper()
        currently_shariah = c.get("is_shariah_compliant") == True
        should_be_shariah = sym in active_shariah_symbols
        
        if should_be_shariah and not currently_shariah:
            entered.append(c)
        elif not should_be_shariah and currently_shariah:
            exited.append(c)

    changes_count = len(entered) + len(exited)
    change_percent = (changes_count / old_shariah_count * 100) if old_shariah_count > 0 else 0.0

    print("\n------------------------------------------------------------")
    print(f"New Entrants    : {len(entered)}")
    for c in entered:
        print(f"  + {c['symbol']}: {c['name_ar']}")
    print(f"Exited Companies: {len(exited)}")
    for c in exited:
        print(f"  - {c['symbol']}: {c['name_ar']}")
    print(f"Calculated Change %: {change_percent:.2f}%")
    print("------------------------------------------------------------")

    # 5. Safety checks and execution
    if args.dry_run:
        print("\n[DRY RUN] Finished without making database updates.")
        sys.exit(0)

    if change_percent > 20.0:
        print(f"\n❌ SAFETY TRIGGER: Change percentage ({change_percent:.2f}%) exceeds 20% limit!")
        print("Database updates aborted to prevent accidental data corruption.")
        sys.exit(1)

    # Apply changes to Supabase
    if changes_count == 0:
        print("\nNo changes detected. Database is up to date.")
        sys.exit(0)

    print(f"\nApplying database updates for {changes_count} records...")
    
    for c in entered:
        try:
            # Update company status
            client.table("companies").update({"is_shariah_compliant": True}).eq("id", c["id"]).execute()
            # Log audit trail
            client.table("shariah_audit_log").insert({
                "company_id": c["id"],
                "old_status": False,
                "new_status": True
            }).execute()
            print(f"Successfully marked {c['symbol']} as Shariah-compliant.")
        except Exception as e:
            print(f"Failed to update {c['symbol']}: {e}")

    for c in exited:
        try:
            # Update company status
            client.table("companies").update({"is_shariah_compliant": False}).eq("id", c["id"]).execute()
            # Log audit trail
            client.table("shariah_audit_log").insert({
                "company_id": c["id"],
                "old_status": True,
                "new_status": False
            }).execute()
            print(f"Successfully marked {c['symbol']} as Non-compliant.")
        except Exception as e:
            print(f"Failed to update {c['symbol']}: {e}")

    print("\nWeekly Shariah review applied and logged successfully.")

if __name__ == "__main__":
    main()
