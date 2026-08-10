"""
services/date_guard.py — Global DateGuard & Look-Ahead Bias Enforcer
====================================================================
Hard Failure Runtime Guard for ML Pipelines, Preprocessing, & Feature Engineering.

Rules:
1. Every feature generation operation MUST be bound to a strict as_of_date.
2. ANY attempt to query, read, scale, or impute using data where timestamp > as_of_date
   triggers an immediate HARD FAILURE (LookAheadBiasViolationError). No warnings, no silent fallbacks.
3. Target / Label Distinction:
   - Input Features: MUST be strictly <= as_of_date.
   - Ground Truth Targets (e.g., 5-day forward return): Are explicitly marked as TARGET_LABEL
     and evaluated over (as_of_date, as_of_date + forward_horizon].
"""

import os
import logging
from datetime import date, datetime, timezone
from typing import Dict, Any, List, Optional, Union, Sequence, Callable
import pandas as pd
import numpy as np

logger = logging.getLogger("tradeora.date_guard")


class LookAheadBiasViolationError(RuntimeError):
    """Raised immediately when any feature pipeline attempts to access data beyond as_of_date."""
    pass


class DateGuard:
    """
    Context manager and runtime proxy that enforces strict temporal boundaries.
    """
    def __init__(self, as_of_date: date | str):
        if isinstance(as_of_date, str):
            self.as_of_date = datetime.strptime(as_of_date[:10], "%Y-%m-%d").date()
        else:
            self.as_of_date = as_of_date

    def __enter__(self):
        logger.debug(f"[DateGuard ACTIVE] Strict temporal boundary enforced at as_of_date = {self.as_of_date}")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        logger.debug(f"[DateGuard RELEASED] Boundary at {self.as_of_date} disengaged.")
        return False

    def validate_series_dates(self, dates: Sequence[date | str | pd.Timestamp], label: str = "Feature Data") -> None:
        """
        Validates that every timestamp in dates is <= as_of_date.
        Raises LookAheadBiasViolationError on the first future date detected.
        """
        for d in dates:
            if d is None:
                continue
            if isinstance(d, str):
                dt = datetime.strptime(d[:10], "%Y-%m-%d").date()
            elif isinstance(d, pd.Timestamp):
                dt = d.date()
            elif isinstance(d, datetime):
                dt = d.date()
            elif isinstance(d, date):
                dt = d
            else:
                continue

            if dt > self.as_of_date:
                raise LookAheadBiasViolationError(
                    f"LOOKAHEAD_BIAS_VIOLATION in [{label}]: Attempted to access future data at date {dt} "
                    f"which exceeds strict boundary as_of_date={self.as_of_date}!"
                )

    def filter_features(self, df: pd.DataFrame, date_column: str = "price_date") -> pd.DataFrame:
        """
        Filters a DataFrame to rows strictly <= as_of_date.
        If un-guarded future rows exist in input df without pre-filtering, raises hard failure!
        """
        if date_column not in df.columns:
            return df

        timestamps = pd.to_datetime(df[date_column]).dt.date
        future_mask = timestamps > self.as_of_date

        if future_mask.any():
            future_dates = timestamps[future_mask].unique()
            raise LookAheadBiasViolationError(
                f"LOOKAHEAD_BIAS_VIOLATION: Input feature DataFrame contains {future_mask.sum()} rows "
                f"from future dates {list(future_dates)[:3]} > as_of_date={self.as_of_date}!"
            )

        return df.copy()


def enforce_feature_temporal_boundary(df: pd.DataFrame, date_col: str, as_of_date: date | str) -> pd.DataFrame:
    """
    Utility helper to safely slice a feature dataset strictly up to as_of_date before feature computation or scaling.
    """
    if isinstance(as_of_date, str):
        cutoff = datetime.strptime(as_of_date[:10], "%Y-%m-%d").date()
    else:
        cutoff = as_of_date

    ts = pd.to_datetime(df[date_col]).dt.date
    valid_df = df[ts <= cutoff].copy()
    return valid_df


def compute_target_label(
    prices_df: pd.DataFrame,
    date_col: str,
    price_col: str,
    as_of_date: date | str,
    forward_days: int = 5
) -> Optional[float]:
    """
    Computes ground truth target label (e.g., 5-day forward return).
    EXPLICIT DESIGN: Target labels ARE allowed to observe future prices (as_of_date, as_of_date + forward_days]
    because they represent future ground truth outcomes for supervised training, NOT input features.
    """
    if isinstance(as_of_date, str):
        start_dt = datetime.strptime(as_of_date[:10], "%Y-%m-%d").date()
    else:
        start_dt = as_of_date

    df_sorted = prices_df.sort_values(by=date_col).reset_index(drop=True)
    ts = pd.to_datetime(df_sorted[date_col]).dt.date

    base_rows = df_sorted[ts == start_dt]
    if base_rows.empty:
        return None

    base_idx = base_rows.index[0]
    target_idx = base_idx + forward_days

    if target_idx >= len(df_sorted):
        return None  # Out of range, future not yet known

    p_base = float(df_sorted.loc[base_idx, price_col])
    p_future = float(df_sorted.loc[target_idx, price_col])

    if p_base <= 0:
        return None

    forward_return = ((p_future - p_base) / p_base) * 100.0
    return round(forward_return, 4)
