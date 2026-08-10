import pytest
import pandas as pd
import numpy as np
from services.feature_pruning import (
    audit_feature_variance,
    prune_non_informative_features,
    ACTIVE_FEATURE_COLUMNS
)

def test_feature_variance_audit_detects_dead_constant_features():
    # Dataset with 2 active features and 2 dead constant features
    df = pd.DataFrame({
        "rsi_14": [30.5, 45.2, 60.1, 75.8, 52.0],
        "pe_ratio": [8.5, 12.0, 15.2, 9.1, 11.4],
        "f_dead_constant_half": [0.5, 0.5, 0.5, 0.5, 0.5], # Zero variance 0.5
        "f_dead_zero": [0.0, 0.0, 0.0, 0.0, 0.0]             # Zero variance 0.0
    })

    audit = audit_feature_variance(df, feature_columns=["rsi_14", "pe_ratio", "f_dead_constant_half", "f_dead_zero"])

    assert audit["total_features"] == 4
    assert set(audit["active_informative_features"]) == {"rsi_14", "pe_ratio"}
    assert set(audit["dead_constant_features"]) == {"f_dead_constant_half", "f_dead_zero"}
    assert audit["feature_metrics"]["f_dead_constant_half"]["status"] == "DEAD"
    assert audit["feature_metrics"]["f_dead_zero"]["status"] == "DEAD"


def test_prune_non_informative_features_preserves_active_schema():
    df = pd.DataFrame({
        "rsi_14": [30.5, 45.2, 60.1, 75.8, 52.0],
        "pe_ratio": [8.5, 12.0, 15.2, 9.1, 11.4],
        "f_dead_constant": [1.0, 1.0, 1.0, 1.0, 1.0]
    })

    pruned_df, dropped = prune_non_informative_features(df, feature_columns=["rsi_14", "pe_ratio", "f_dead_constant"])

    assert dropped == ["f_dead_constant"]
    assert list(pruned_df.columns) == ["rsi_14", "pe_ratio"]
    assert "f_dead_constant" not in pruned_df.columns


def test_training_and_inference_schema_parity():
    # Training dataset
    df_train = pd.DataFrame({
        "rsi_14": np.random.uniform(20, 80, 50),
        "macd_histogram": np.random.normal(0, 1, 50),
        "f_dead_constant": [0.0] * 50
    })

    # Single-row Inference sample
    df_infer = pd.DataFrame({
        "rsi_14": [45.0],
        "macd_histogram": [0.5],
        "f_dead_constant": [0.0]
    })

    train_pruned, train_dropped = prune_non_informative_features(df_train, feature_columns=["rsi_14", "macd_histogram", "f_dead_constant"])

    # Inference schema aligns strictly with training schema
    infer_pruned = df_infer.drop(columns=train_dropped)

    # Training and inference active columns MUST be 100% identical
    assert list(train_pruned.columns) == list(infer_pruned.columns)
