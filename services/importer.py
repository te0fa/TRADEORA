import os
import json
import logging
import traceback
from datetime import datetime
from config import settings
from database import db

logger = logging.getLogger(__name__)

class DataImporter:
    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        db.set_dry_run(dry_run)
        
        # Statistics
        self.stats = {
            "execution_time_seconds": 0.0,
            "started_at": "",
            "finished_at": "",
            "source": settings.DEFAULT_SOURCE,
            "rows_read": 0,
            "new_companies": 0,
            "updated_companies": 0,
            "inserted_prices": 0,
            "updated_prices": 0,
            "warnings_count": 0,
            "errors_count": 0,
            "errors": [],
            "warnings": []
        }

    def import_records(self, records: list[dict]) -> dict:
        """Runs the import pipeline for the given raw scraper records."""
        start_time = datetime.now()
        self.stats["started_at"] = start_time.isoformat()
        self.stats["rows_read"] = len(records)
        
        logger.info(f"Starting import process for {len(records)} records.")
        
        # Create import job in database
        job_id = db.create_import_job(self.stats["source"])
        
        try:
            valid_prices_to_upsert = []
            
            for idx, r in enumerate(records):
                symbol = r.get("symbol")
                if not symbol:
                    self._add_warning(f"Row {idx} is missing a symbol. Skipped.")
                    continue
                    
                # 1. Data Quality Checks
                critical_errors, soft_warnings = self._validate_record(r)
                if critical_errors:
                    for err in critical_errors:
                        self._add_warning(f"Critical Quality Check failed for stock '{symbol}': {err}")
                    continue
                
                # Determine quality flag
                quality_flag = None
                if soft_warnings:
                    quality_flag = "close_outside_range"
                    for wrn in soft_warnings:
                        self._add_warning(f"Soft Quality Warning for stock '{symbol}': {wrn}")
                
                # 2. Process Company (Insert/Update)
                company_id = self._process_company(r)
                if not company_id:
                    self._add_error(f"Could not resolve or create company for symbol: {symbol}")
                    continue
                
                # 3. Prepare Price Record for UPSERT
                price_data = {
                    "company_id": company_id,
                    "open_price": r.get("open_price"),
                    "high_price": r.get("high_price"),
                    "low_price": r.get("low_price"),
                    "close_price": r.get("close_price"),
                    "previous_close": r.get("previous_close"),
                    "change_value": r.get("change_value"),
                    "change_percent": r.get("change_percent"),
                    "volume": r.get("volume"),
                    "value_traded": r.get("value_traded"),
                    "source": self.stats["source"],
                    "price_date": r.get("price_date"),
                    "data_quality_flag": quality_flag
                }
                valid_prices_to_upsert.append(price_data)

            # 4. Perform batch UPSERT for prices
            if valid_prices_to_upsert:
                inserted, updated = db.upsert_market_prices(valid_prices_to_upsert)
                self.stats["inserted_prices"] = inserted
                self.stats["updated_prices"] = updated
                logger.info(f"UPSERT complete: {inserted} prices inserted/updated.")
            else:
                logger.warning("No valid price records to upsert.")

            status = "completed" if self.stats["errors_count"] == 0 else "warnings"
            if self.stats["warnings_count"] > 0 and status == "completed":
                status = "warnings"
                
            self._finalize_job(job_id, status, start_time)
            
        except Exception as e:
            error_msg = f"Fatal error during import pipeline: {e}"
            logger.critical(error_msg)
            logger.critical(traceback.format_exc())
            self._add_error(error_msg)
            self._finalize_job(job_id, "failed", start_time, error_msg)
            
        return self.stats

    def _validate_record(self, r: dict) -> tuple[list[str], list[str]]:
        """
        Validates a record against the Data Quality Checklist.
        Returns a tuple: (critical_errors, soft_warnings)
        """
        critical_errors = []
        soft_warnings = []
        
        # Extract fields
        open_p = r.get("open_price")
        high_p = r.get("high_price")
        low_p = r.get("low_price")
        close_p = r.get("close_price")
        volume = r.get("volume")
        value = r.get("value_traded")
        
        # Check values (Critical)
        if open_p is not None and open_p <= 0:
            critical_errors.append(f"Open Price ({open_p}) must be greater than zero.")
            
        if close_p is not None and close_p <= 0:
            critical_errors.append(f"Close Price ({close_p}) must be greater than zero.")
            
        if high_p is not None and low_p is not None and high_p < low_p:
            critical_errors.append(f"High Price ({high_p}) is less than Low Price ({low_p}).")
            
        if volume is not None and volume < 0:
            critical_errors.append(f"Volume ({volume}) must be non-negative.")
            
        if value is not None and value < 0:
            critical_errors.append(f"Value Traded ({value}) must be non-negative.")
            
        # Soft validation (Close outside High-Low range)
        if close_p is not None and high_p is not None and low_p is not None:
            if not (low_p <= close_p <= high_p):
                soft_warnings.append(f"Close Price ({close_p}) is outside the High-Low range [{low_p}, {high_p}].")
                
        return critical_errors, soft_warnings

    def _process_company(self, r: dict) -> str | None:
        """Handles company checks, insertions, and updates. Returns the company UUID."""
        symbol = r.get("symbol", "").upper()
        name_ar = r.get("name")
        sector = r.get("sector")
        
        # Try to find company by symbol
        company = db.get_company_by_symbol(symbol)
        
        if company is None:
            # Insert new company
            company_data = {
                "symbol": symbol,
                "name_ar": name_ar,
                "sector": sector,
                "isin": None,
                "name_en": r.get("name_en"),
                "market_type": None,
                "currency": "EGP",  # Default to EGP for Egyptian stocks
                "listing_status": "listed"
            }
            new_company = db.insert_company(company_data)
            if new_company:
                self.stats["new_companies"] += 1
                return new_company.get("id")
        else:
            # Check if existing company requires updates (populating missing fields)
            company_id = company["id"]
            updates = {}
            
            # Update sector if missing
            if not company.get("sector") and sector:
                updates["sector"] = sector
            # Update Arabic name if missing
            if not company.get("name_ar") and name_ar:
                updates["name_ar"] = name_ar
            # Update/populate name_en if missing or different
            new_name_en = r.get("name_en")
            if new_name_en and (not company.get("name_en") or company.get("name_en") != new_name_en):
                updates["name_en"] = new_name_en
                
            if updates:
                db.update_company(company_id, updates)
                self.stats["updated_companies"] += 1
                
            return company_id
            
        return None

    def _add_warning(self, msg: str):
        """Logs and records a pipeline warning."""
        logger.warning(msg)
        self.stats["warnings"].append(msg)
        self.stats["warnings_count"] += 1

    def _add_error(self, msg: str):
        """Logs and records a pipeline error."""
        logger.error(msg)
        self.stats["errors"].append(msg)
        self.stats["errors_count"] += 1

    def _finalize_job(self, job_id: str, status: str, start_time: datetime, error_message: str = None):
        """Updates stats and database import job record at completion."""
        end_time = datetime.now()
        execution_time = (end_time - start_time).total_seconds()
        
        self.stats["finished_at"] = end_time.isoformat()
        self.stats["execution_time_seconds"] = execution_time
        
        job_updates = {
            "finished_at": end_time.isoformat(),
            "status": status,
            "rows_read": self.stats["rows_read"],
            "rows_inserted": self.stats["inserted_prices"],
            "rows_updated": self.stats["updated_prices"],
            "warnings_count": self.stats["warnings_count"],
            "errors_count": self.stats["errors_count"],
            "error_message": error_message
        }
        db.update_import_job(job_id, job_updates)
        
        # Write JSON report to logs directory
        self._write_json_report()
        
        logger.info(f"Import job {job_id} finished with status '{status}' in {execution_time:.2f} seconds.")

    def _write_json_report(self):
        """Saves execution statistics as a JSON file in the logs directory."""
        log_dir = os.path.join(settings.BASE_DIR, "logs")
        os.makedirs(log_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = os.path.join(log_dir, f"import_report_{timestamp}.json")
        
        try:
            with open(report_file, "w", encoding="utf-8") as f:
                json.dump(self.stats, f, ensure_ascii=False, indent=4)
            logger.info(f"JSON execution report saved to {report_file}")
        except Exception as e:
            logger.error(f"Failed to write JSON execution report: {e}")
