import pytest
import os
import json
from pathlib import Path
from services.model_v7_trainer import (
    train_clean_model_v7,
    load_model_v7_isolated,
    predict_model_v7_single_sample,
    MODEL_V7_PATH,
    METADATA_V7_PATH
)
from services.feature_pruning import ACTIVE_FEATURE_COLUMNS

def test_train_clean_model_v7_generates_isolated_artifacts():
    metadata = train_clean_model_v7(seed=42)

    assert MODEL_V7_PATH.exists()
    assert METADATA_V7_PATH.exists()

    assert metadata["model_version"] == "v7_clean"
    assert metadata["algorithm"] == "HistGradientBoostingClassifier"
    assert metadata["seed"] == 42
    assert metadata["leakage_audit_result"]["passed_date_guard"] is True
    assert metadata["leakage_audit_result"]["zero_lookahead_bias"] is True

    # Confirm feature schema matches ACTIVE_FEATURE_COLUMNS
    assert metadata["feature_schema"]["active_feature_columns"] == ACTIVE_FEATURE_COLUMNS


def test_model_v7_isolated_inference_compatibility():
    # Load model and run shadow inference
    sample_features = {
        "rsi_14": 28.5,
        "macd_histogram": 0.45,
        "sma_20_ratio": 1.02,
        "ema_50_ratio": 1.05,
        "atr_pct": 0.025,
        "volume_ratio_5d": 1.8,
        "pe_ratio": 7.2,
        "pb_ratio": 1.1,
        "roe": 22.0,
        "debt_to_equity": 0.4,
        "sector_relative_volume": 1.5
    }

    res = predict_model_v7_single_sample(sample_features)

    assert res["model_version"] == "v7_clean"
    assert res["is_shadow_mode"] is True
    assert 0.0 <= res["signal_probability"] <= 1.0
    assert res["prediction_class"] in (0, 1)


def test_reproducibility_with_fixed_seed():
    meta1 = train_clean_model_v7(seed=42)
    acc1 = meta1["validation_metrics_oos"]["accuracy"]

    meta2 = train_clean_model_v7(seed=42)
    acc2 = meta2["validation_metrics_oos"]["accuracy"]

    # 100% reproducible metrics
    assert acc1 == acc2
