"""
services/observability.py — Unified Pipeline Health & Observability SDK
========================================================================
Single authoritative telemetry contract for all Tradeora ingestion, monitoring,
recommendation, and background pipelines.

Features:
- Unified schema: pipeline_id, run_id, started_at, finished_at, status, rows_processed,
  error_code, error_message, duration_ms, metadata.
- Idempotent database heartbeat into public.pipeline_health (CockroachDB / Postgres).
- Telegram alert dispatching on failure, zero-rows, or consecutive failure anomalies.
- Structured file logging in logs/pipeline_health.log.
"""

import os
import sys
import uuid
import time
import json
import logging
import traceback
from functools import wraps
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

# ── Logging Setup ─────────────────────────────────────────────────────────────
log_dir = Path(__file__).parent.parent / 'logs'
log_dir.mkdir(exist_ok=True)
log_file_path = log_dir / 'pipeline_health.log'

logger = logging.getLogger('tradeora.observability')
logger.setLevel(logging.INFO)

# Ensure file handler is attached
if not any(isinstance(h, logging.FileHandler) and getattr(h, 'baseFilename', '') == str(log_file_path.resolve()) for h in logger.handlers):
    fh = logging.FileHandler(log_file_path, encoding='utf-8')
    fh.setFormatter(logging.Formatter('%(asctime)s [%(levelname)s] %(name)s: %(message)s'))
    logger.addHandler(fh)

import psycopg2
import psycopg2.extras
import requests

DATABASE_URL = os.getenv('DATABASE_URL')
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')

CONSECUTIVE_FAILURE_THRESHOLD = 2


def get_db_connection():
    """Returns direct psycopg2 connection to CockroachDB / PostgreSQL."""
    if DATABASE_URL:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        return conn
    return None


def send_telegram_alert(title: str, message: str, level: str = 'ERROR') -> bool:
    """Dispatches a formatted alert notification to Telegram."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        logger.debug("Telegram credentials not set; skipping remote alert.")
        return False

    icon = '🚨' if level == 'ERROR' else ('⚠️' if level == 'WARNING' else 'ℹ️')
    text = (
        f"{icon} *TRADEORA TELEMETRY ALERT: {title}*\n\n"
        f"{message}\n\n"
        f"🕒 Time: `{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}`"
    )

    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        res = requests.post(url, json={
            "chat_id": TELEGRAM_CHAT_ID,
            "text": text,
            "parse_mode": "Markdown"
        }, timeout=8)
        return res.status_code == 200
    except Exception as e:
        logger.warning(f"Failed to dispatch Telegram alert: {e}")
        return False


def get_consecutive_failures(pipeline_id: str) -> int:
    """Queries DB to determine recent consecutive failures for this pipeline."""
    conn = get_db_connection()
    if not conn:
        return 0
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT status FROM public.pipeline_health
                WHERE pipeline_id = %s
                ORDER BY started_at DESC
                LIMIT 5;
            """, (pipeline_id,))
            rows = cur.fetchall()
            failures = 0
            for r in rows:
                if r[0] == 'FAILED':
                    failures += 1
                else:
                    break
            return failures
    except Exception as e:
        logger.debug(f"Error fetching consecutive failures: {e}")
        return 0
    finally:
        conn.close()


def record_pipeline_run(
    pipeline_id: str,
    run_id: str,
    status: str,
    started_at: datetime,
    finished_at: Optional[datetime] = None,
    duration_ms: Optional[int] = None,
    rows_processed: int = 0,
    error_code: Optional[str] = None,
    error_message: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> bool:
    """
    Idempotently records a pipeline execution heartbeat into database & logs.
    """
    if finished_at is None:
        finished_at = datetime.now(timezone.utc)
    if duration_ms is None and started_at:
        duration_ms = int((finished_at - started_at).total_seconds() * 1000)

    meta_json = json.dumps(metadata or {})
    
    # 1. Structured File Logging
    logger.info(
        f"Heartbeat | Pipeline: {pipeline_id} | Run: {run_id} | Status: {status} | "
        f"Rows: {rows_processed} | Duration: {duration_ms}ms"
    )
    if error_message:
        logger.error(f"  Error [{error_code}]: {error_message}")
    for h in logger.handlers:
        h.flush()

    # 2. Database Record (Idempotent Upsert)
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO public.pipeline_health (
                        pipeline_id, run_id, status, started_at, finished_at,
                        duration_ms, rows_processed, error_code, error_message, metadata
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (pipeline_id, run_id) DO UPDATE SET
                        status = EXCLUDED.status,
                        finished_at = EXCLUDED.finished_at,
                        duration_ms = EXCLUDED.duration_ms,
                        rows_processed = EXCLUDED.rows_processed,
                        error_code = EXCLUDED.error_code,
                        error_message = EXCLUDED.error_message,
                        metadata = EXCLUDED.metadata,
                        updated_at = NOW();
                """, (
                    pipeline_id, run_id, status, started_at, finished_at,
                    duration_ms, rows_processed, error_code, error_message, meta_json
                ))
        except Exception as e:
            logger.error(f"Failed to record pipeline health in DB: {e}")
        finally:
            conn.close()

    # 3. Alerting Logic
    if status == 'FAILED':
        consecutive = get_consecutive_failures(pipeline_id)
        alert_msg = (
            f"• *Pipeline ID:* `{pipeline_id}`\n"
            f"• *Run ID:* `{run_id}`\n"
            f"• *Error Code:* `{error_code or 'UNKNOWN'}`\n"
            f"• *Error:* `{error_message or 'No message provided'}`\n"
            f"• *Consecutive Failures:* `{consecutive}`"
        )
        send_telegram_alert(f"Pipeline Failed: {pipeline_id}", alert_msg, level='ERROR')

    elif status == 'SUCCESS' and rows_processed == 0 and metadata and metadata.get('expect_nonzero_rows', False):
        alert_msg = (
            f"• *Pipeline ID:* `{pipeline_id}`\n"
            f"• *Run ID:* `{run_id}`\n"
            f"• *Notice:* Pipeline completed successfully but processed 0 rows.\n"
            f"• *Duration:* `{duration_ms}ms`"
        )
        send_telegram_alert(f"Unexpected Zero Rows: {pipeline_id}", alert_msg, level='WARNING')

    return True


class observe_pipeline:
    """
    Context manager & decorator to observe pipeline execution automatically.
    
    Usage:
        @observe_pipeline("eod_price_importer", expect_nonzero_rows=True)
        def run_importer():
            ...
            return {"rows_processed": 303}
    """
    def __init__(self, pipeline_id: str, run_id: Optional[str] = None, expect_nonzero_rows: bool = False):
        self.pipeline_id = pipeline_id
        self.run_id = run_id or os.getenv('GITHUB_RUN_ID') or f"local_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        self.expect_nonzero_rows = expect_nonzero_rows
        self.started_at = None
        self.rows_processed = 0
        self.metadata = {"expect_nonzero_rows": expect_nonzero_rows}

    def __enter__(self):
        self.started_at = datetime.now(timezone.utc)
        record_pipeline_run(
            pipeline_id=self.pipeline_id,
            run_id=self.run_id,
            status='RUNNING',
            started_at=self.started_at,
            metadata=self.metadata
        )
        return self

    def set_rows_processed(self, count: int):
        self.rows_processed = count

    def add_metadata(self, key: str, value: Any):
        self.metadata[key] = value

    def __exit__(self, exc_type, exc_val, exc_tb):
        finished_at = datetime.now(timezone.utc)
        if exc_type is not None:
            error_code = exc_type.__name__
            error_message = str(exc_val)
            record_pipeline_run(
                pipeline_id=self.pipeline_id,
                run_id=self.run_id,
                status='FAILED',
                started_at=self.started_at,
                finished_at=finished_at,
                rows_processed=self.rows_processed,
                error_code=error_code,
                error_message=error_message,
                metadata={**self.metadata, "traceback": traceback.format_exc()}
            )
            return False  # Re-raise exception
        else:
            record_pipeline_run(
                pipeline_id=self.pipeline_id,
                run_id=self.run_id,
                status='SUCCESS',
                started_at=self.started_at,
                finished_at=finished_at,
                rows_processed=self.rows_processed,
                metadata=self.metadata
            )
            return True

    def __call__(self, func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            with self as observer:
                result = func(*args, **kwargs)
                if isinstance(result, dict) and "rows_processed" in result:
                    observer.set_rows_processed(result["rows_processed"])
                elif isinstance(result, int):
                    observer.set_rows_processed(result)
                return result
        return wrapper
