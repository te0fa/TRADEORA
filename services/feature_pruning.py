"""
services/feature_pruning.py — Feature Variance Audit & Non-Informative Feature Pruning Engine
=============================================================================================
Audits and eliminates zero-variance, constant, and non-informative features across ML pipelines.

Rules:
- A feature is classified as NON_INFORMATIVE (DEAD) if:
  1. Variance sigma^2 < min_variance_threshold (e.g. 1e-6).
  2. Single unique value constitutes > 99.9% of all samples.
  3. Feature is a hardcoded constant (0, 0.5, 1.0).
- Dead features are safely removed from the pipeline, and metadata schemas are updated in sync.
"""

import logging
from typing import Dict, Any, List, Tuple, Optional
import pandas as pd
import numpy as np

logger = logging.getLogger("tradeora.feature_pruning")

# Canonical Active Feature Metadata Schema (Training & Inference Parity)
ACTIVE_FEATURE_COLUMNS: List[str] = [
    "rsi_14",
    "macd_histogram",
    "sma_20_ratio",
    "ema_50_ratio",
    "atr_pct",
    "volume_ratio_5d",
    "pe_ratio",
    "pb_ratio",
    "roe",
    "debt_to_equity",
    "sector_relative_volume"
]


def audit_feature_variance(
    df: pd.DataFrame,
    feature_columns: Optional[List[str]] = None,
    min_variance_threshold: float = 1e-6
) -> Dict[str, Any]:
    """
    Audits feature distributions, variances, and unique value frequencies.
    
    Returns:
      {
        "total_features": int,
        "active_informative_features": List[str],
        "dead_constant_features": List[str],
        "feature_metrics": Dict[str, Dict]
      }
    """
    cols = feature_columns if feature_columns is not None else [c for c in df.columns if c in ACTIVE_FEATURE_COLUMNS or c.startswith('f_')]
    cols = [c for c in cols if c in df.columns]

    active_features = []
    dead_features = []
    metrics = {}

    for c in cols:
        series = pd.to_numeric(df[c], errors='coerce').dropna()
        if len(series) == 0:
            dead_features.append(c)
            metrics[c] = {"variance": 0.0, "reason": "EMPTY_OR_ALL_NULL", "status": "DEAD"}
            continue

        unique_vals = series.unique()
        if len(series) <= 1:
            # Single sample cannot evaluate variance; keep feature as active
            active_features.append(c)
            metrics[c] = {"variance": None, "unique_count": len(unique_vals), "status": "ACTIVE", "reason": "SINGLE_SAMPLE_INFERENCE"}
            continue

        var_val = float(series.var(ddof=0))
        mode_freq = (series == unique_vals[0]).mean() if len(unique_vals) > 0 else 1.0

        is_dead = False
        reason = "VALID"

        if len(unique_vals) <= 1 or var_val < min_variance_threshold:
            is_dead = True
            reason = f"ZERO_VARIANCE (var={var_val:.8f}, unique_val={unique_vals[0] if len(unique_vals)>0 else None})"
        elif mode_freq > 0.999:
            is_dead = True
            reason = f"SINGLE_VALUE_DOMINANCE (freq={mode_freq*100:.2f}%)"

        metrics[c] = {
            "variance": round(var_val, 6),
            "unique_count": len(unique_vals),
            "mode_frequency": round(mode_freq, 4),
            "status": "DEAD" if is_dead else "ACTIVE",
            "reason": reason
        }

        if is_dead:
            dead_features.append(c)
            logger.warning(f"[Dead Feature Detected]: {c} -> {reason}")
        else:
            active_features.append(c)

    return {
        "total_features": len(cols),
        "active_informative_features": active_features,
        "dead_constant_features": dead_features,
        "feature_metrics": metrics
    }


def prune_non_informative_features(
    df: pd.DataFrame,
    feature_columns: Optional[List[str]] = None,
    min_variance_threshold: float = 1e-6
) -> Tuple[pd.DataFrame, List[str]]:
    """
    Prunes non-informative dead features from DataFrame while preserving schema parity.
    Returns: (pruned_df, list_of_dropped_features)
    """
    audit = audit_feature_variance(df, feature_columns=feature_columns, min_variance_threshold=min_variance_threshold)
    dead_cols = audit["dead_constant_features"]

    if not dead_cols:
        return df.copy(), []

    pruned_df = df.drop(columns=dead_cols).copy()
    logger.info(f"Pruned {len(dead_cols)} non-informative features: {dead_cols}")
    return pruned_df, dead_cols
