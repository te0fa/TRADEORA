import pytest
import pandas as pd
from train_model import precompute_sector_relative_volumes

def test_sector_relative_volume_calculation():
    # Mock companies
    companies = [
        {"id": "co_1", "symbol": "A", "sector": "Banks"},
        {"id": "co_2", "symbol": "B", "sector": "Banks"},
        {"id": "co_3", "symbol": "C", "sector": "Tech"}
    ]

    # Mock candles
    # co_1: Banks
    # co_2: Banks
    # co_3: Tech
    all_candles = {
        "co_1": [
            {"time": "2026-07-01", "volume": 100},
            {"time": "2026-07-02", "volume": 120},
            {"time": "2026-07-03", "volume": 300} # Spike (3x)
        ],
        "co_2": [
            {"time": "2026-07-01", "volume": 200},
            {"time": "2026-07-02", "volume": 210},
            {"time": "2026-07-03", "volume": 220} # Normal
        ],
        "co_3": [
            {"time": "2026-07-01", "volume": 50},
            {"time": "2026-07-02", "volume": 50},
            {"time": "2026-07-03", "volume": 150} # Tech sector volume spikes too
        ]
    }

    lookup = precompute_sector_relative_volumes(companies, all_candles)
    
    # Verify we get the outputs for each company and date
    assert ("co_1", "2026-07-03") in lookup
    assert ("co_2", "2026-07-03") in lookup
    assert ("co_3", "2026-07-03") in lookup

    # For co_1 on 2026-07-03:
    # co_1 volume on 2026-07-03: 300. Avg 3 days: (100+120+300)/3 = 173.33. Stock Vol Ratio = 300 / 173.33 = 1.7307
    # Banks Sector (co_1 + co_2) daily vols:
    # 2026-07-01: 100+200 = 300
    # 2026-07-02: 120+210 = 330
    # 2026-07-03: 300+220 = 520
    # Banks Sector Avg 3 days: (300+330+520)/3 = 383.33
    # Banks Sector Vol Ratio: 520 / 383.33 = 1.3565
    # co_1 Sector Relative Vol = 1.7307 / 1.3565 = 1.275
    val_co1 = lookup[("co_1", "2026-07-03")]
    assert abs(val_co1 - 1.275) < 0.05

if __name__ == "__main__":
    test_sector_relative_volume_calculation()
    print("Sector relative volume calculation test passed!")
