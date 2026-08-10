import pytest
import pandas as pd
from datetime import date
from services.date_guard import (
    DateGuard,
    LookAheadBiasViolationError,
    enforce_feature_temporal_boundary,
    compute_target_label
)

def test_canary_future_data_triggers_hard_failure():
    as_of = date(2026, 6, 5)
    guard = DateGuard(as_of)

    # Valid dates + 1 Canary Future Date (2026-06-06)
    dates_with_canary = [
        date(2026, 6, 3),
        date(2026, 6, 4),
        date(2026, 6, 5),
        date(2026, 6, 6)  # Canary future leak!
    ]

    with pytest.raises(LookAheadBiasViolationError) as exc_info:
        guard.validate_series_dates(dates_with_canary, label="Canary Check")

    assert "LOOKAHEAD_BIAS_VIOLATION" in str(exc_info.value)
    assert "2026-06-06" in str(exc_info.value)


def test_dataframe_feature_filtering_hard_failure_on_unfiltered_input():
    as_of = date(2026, 6, 5)
    guard = DateGuard(as_of)

    df = pd.DataFrame({
        "price_date": ["2026-06-03", "2026-06-04", "2026-06-05", "2026-06-10"],  # Future date!
        "close_price": [50.0, 51.0, 52.0, 9999.0]  # Canary price spike
    })

    with pytest.raises(LookAheadBiasViolationError) as exc_info:
        guard.filter_features(df, date_column="price_date")

    assert "LOOKAHEAD_BIAS_VIOLATION" in str(exc_info.value)


def test_safe_temporal_slicing_isolates_features_for_scaling():
    as_of = date(2026, 6, 5)
    guard = DateGuard(as_of)

    df_raw = pd.DataFrame({
        "price_date": ["2026-06-03", "2026-06-04", "2026-06-05", "2026-06-10"],
        "close_price": [50.0, 51.0, 52.0, 9999.0]
    })

    # Safely slice before feature calculation
    sliced_df = enforce_feature_temporal_boundary(df_raw, date_col="price_date", as_of_date=as_of)

    # Validate that sliced_df passes DateGuard cleanly with 0 errors
    guarded_df = guard.filter_features(sliced_df, date_column="price_date")
    assert len(guarded_df) == 3
    assert "2026-06-10" not in guarded_df["price_date"].values
    assert 9999.0 not in guarded_df["close_price"].values


def test_target_label_distinction_allows_future_horizon_for_supervised_ground_truth():
    df_prices = pd.DataFrame({
        "price_date": ["2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04", "2026-06-05", "2026-06-08"],
        "close_price": [100.0, 102.0, 104.0, 106.0, 108.0, 110.0]
    })
    as_of = date(2026, 6, 1)

    # Features must be strictly <= 2026-06-01
    features_df = enforce_feature_temporal_boundary(df_prices, date_col="price_date", as_of_date=as_of)
    assert len(features_df) == 1
    assert features_df.iloc[0]["price_date"] == "2026-06-01"

    # Target label computes 5-day forward return: (P[2026-06-08] - P[2026-06-01]) / P[2026-06-01]
    # (110 - 100) / 100 = +10.0%
    target_return = compute_target_label(df_prices, date_col="price_date", price_col="close_price", as_of_date=as_of, forward_days=5)
    assert target_return == 10.0
