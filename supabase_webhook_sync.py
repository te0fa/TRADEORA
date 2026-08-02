"""
supabase_webhook_sync.py
========================
FastAPI webhook server يستقبل إشعارات من Supabase Database Webhooks
ويشغّل sync فوري لـ CockroachDB عند أي تغيير.

الاستخدام (على أي VPS أو Railway):
    pip install fastapi uvicorn
    uvicorn supabase_webhook_sync:app --host 0.0.0.0 --port 8080

إعداد Supabase Webhook:
    Dashboard → Database → Webhooks → Create Webhook
    URL: https://your-server.com/webhook/sync
    Events: INSERT, UPDATE, DELETE
    Tables: recommended_trades, companies, daily_investor_flows, ...
    Secret: WEBHOOK_SECRET في .env
"""

import os, hmac, hashlib, logging, asyncio
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger('tradeora.webhook')

WEBHOOK_SECRET = os.getenv('SUPABASE_WEBHOOK_SECRET', '')

app = FastAPI(title='TRADEORA Sync Webhook')

# ─── Track last sync per table (debounce) ────────────────────
_last_sync: dict[str, float] = {}
DEBOUNCE_SEC = 30  # لو في أكتر من event في 30 ثانية، نعمل sync مرة واحدة


def verify_signature(body: bytes, signature: str) -> bool:
    """تحقق من صحة الـ webhook signature من Supabase."""
    if not WEBHOOK_SECRET:
        return True  # لو مفيش secret، skip التحقق
    expected = hmac.new(
        WEBHOOK_SECRET.encode(), body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f'sha256={expected}', signature or '')


async def run_sync(table: str):
    """شغّل sync في الخلفية لجدول معين."""
    import time
    now = time.time()

    # Debounce: لو تم sync منذ أقل من 30 ثانية، تجاهل
    if now - _last_sync.get(table, 0) < DEBOUNCE_SEC:
        logger.info(f'  Debounced sync for {table}')
        return

    _last_sync[table] = now
    logger.info(f'  🔄 Syncing {table} → CockroachDB...')

    try:
        from cockroach_sync import sync_table
        n = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: sync_table(table, 'id', days_back=30,
                               date_col=_table_date_col(table))
        )
        logger.info(f'  ✅ {table}: {n:,} rows synced')
    except Exception as e:
        logger.error(f'  ❌ Sync error for {table}: {e}')


def _table_date_col(table: str) -> str | None:
    cols = {
        'recommended_trades': 'recommended_at',
        'daily_investor_flows': 'trade_date',
        'sector_investor_flows': 'trade_date',
        'intraday_snapshots': 'snapshot_time',
        'market_prices': 'price_date',
        'corporate_events': 'event_date',
        'insider_trading': 'transaction_date',
    }
    return cols.get(table)


@app.post('/webhook/sync')
async def webhook_sync(request: Request, background_tasks: BackgroundTasks):
    """Supabase Database Webhook endpoint."""
    body = await request.body()

    # Verify signature
    sig = request.headers.get('x-supabase-signature', '')
    if WEBHOOK_SECRET and not verify_signature(body, sig):
        raise HTTPException(status_code=401, detail='Invalid signature')

    payload = await request.json()
    table = payload.get('table', '')
    event = payload.get('type', '')

    logger.info(f'📩 Webhook: {event} on {table}')

    if table:
        background_tasks.add_task(run_sync, table)

    return {'status': 'ok', 'table': table, 'event': event}


@app.get('/health')
async def health():
    """Health check."""
    return {'status': 'healthy', 'service': 'tradeora-sync-webhook'}


@app.get('/check')
async def check_sync():
    """قارن الأرقام بين الداتابيسين فوراً."""
    from cockroach_sync import check_sync as do_check
    import io, sys
    buf = io.StringIO()
    old = sys.stdout
    sys.stdout = buf
    do_check()
    sys.stdout = old
    return {'report': buf.getvalue()}
