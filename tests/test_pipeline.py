import os
import pytest
from scrapers.egx_scraper import EGXScraper
from services.importer import DataImporter
from config import settings

@pytest.fixture
def real_pdf_path():
    path = r"e:\TRADEORA\data\egx_daily_report.pdf"
    return path if os.path.exists(path) else None

def test_parse_pdf(real_pdf_path):
    if not real_pdf_path:
        pytest.skip("Real EGX PDF report not found in data folder. Skipping test.")
        
    scraper = EGXScraper()
    records = scraper._parse_pdf(real_pdf_path)
    assert len(records) > 0
    
    # We should have successfully matched and resolved major tickers
    comi_recs = [r for r in records if r["symbol"] == "COMI"]
    assert len(comi_recs) > 0
    comi = comi_recs[0]
    
    # Check that details are present and normalized
    assert "البنك التجاري الدولي" in comi["name"]
    assert comi["currency"] == "EGP"
    assert isinstance(comi["open_price"], (int, float))
    assert isinstance(comi["high_price"], (int, float))
    assert isinstance(comi["low_price"], (int, float))
    assert isinstance(comi["close_price"], (int, float))
    assert isinstance(comi["volume"], int)
    assert isinstance(comi["value_traded"], (int, float))
    assert comi["price_date"] == "2026-07-12"

def test_validation():
    importer = DataImporter(dry_run=True)
    
    # Valid record
    valid_rec = {
        "symbol": "TEST",
        "open_price": 10.0,
        "high_price": 12.0,
        "low_price": 9.0,
        "close_price": 11.0,
        "volume": 100,
        "value_traded": 1100
    }
    crit, soft = importer._validate_record(valid_rec)
    assert len(crit) == 0
    assert len(soft) == 0
    
    # Invalid: Close Price outside High-Low range (Soft warning)
    invalid_rec_1 = valid_rec.copy()
    invalid_rec_1["close_price"] = 15.0
    crit, soft = importer._validate_record(invalid_rec_1)
    assert len(crit) == 0
    assert len(soft) == 1
    assert "outside the High-Low range" in soft[0]
    
    # Invalid: High Price < Low Price (Critical + Soft)
    invalid_rec_2 = valid_rec.copy()
    invalid_rec_2["high_price"] = 8.0
    crit, soft = importer._validate_record(invalid_rec_2)
    assert len(crit) == 1
    assert len(soft) == 1
    assert any("less than Low Price" in e for e in crit)
    
    # Invalid: Negative volume (Critical)
    invalid_rec_3 = valid_rec.copy()
    invalid_rec_3["volume"] = -10
    crit, soft = importer._validate_record(invalid_rec_3)
    assert len(crit) == 1
    assert "must be non-negative" in crit[0]

def test_importer_dry_run(real_pdf_path):
    if not real_pdf_path:
        pytest.skip("Real EGX PDF report not found in data folder. Skipping test.")
        
    scraper = EGXScraper()
    records = scraper._parse_pdf(real_pdf_path)
    
    importer = DataImporter(dry_run=True)
    summary = importer.import_records(records)
    
    assert summary["rows_read"] == len(records)
    # Check that records were successfully imported (some may be de-duplicated)
    assert summary["inserted_prices"] > 0
    assert summary["new_companies"] > 0
    assert summary["errors_count"] == 0
    assert summary["warnings_count"] == 6

