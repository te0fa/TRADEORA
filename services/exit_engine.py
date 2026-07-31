"""
services/exit_engine.py
========================
Dynamic Exit Engine – يحلل الصفقات المفتوحة يومياً ويُصدر إشارات خروج ذكية.

الإشارات المدعومة:
  1. Trailing Stop (4 مراحل)
  2. RSI Exhaustion (RSI > 75 مع ربح > 3%)
  3. MACD Dead Cross (تقاطع سلبي مع ربح)
  4. EMA20 Break (كسر المتوسط بعد صعود)
  5. Momentum Collapse (3 جلسات هابطة متتالية)
  6. Volume Divergence (سعر يصعد لكن حجم يهبط)

يُستخدم من:
  - generate_daily_recommendations.py (daily batch)
  - يمكن استدعاؤه مستقلاً: python -m services.exit_engine
"""

import os
import logging
import numpy as np
import pandas as pd
from dataclasses import dataclass, field
from typing import Optional, List, Dict

logger = logging.getLogger("tradeora.exit_engine")


@dataclass
class ExitSignal:
    exit_now: bool
    reason: str
    reason_ar: str
    urgency: str          # 'critical' | 'high' | 'medium' | 'low' | 'none'
    new_sl: float         # Updated trailing stop level
    trailing_phase: str   # Phase description
    indicators: dict = field(default_factory=dict)


# ── Technical Helpers ─────────────────────────────────────────────────────────

def _ema(arr: np.ndarray, span: int) -> np.ndarray:
    k = 2 / (span + 1)
    result = np.empty_like(arr, dtype=float)
    result[0] = arr[0]
    for i in range(1, len(arr)):
        result[i] = arr[i] * k + result[i - 1] * (1 - k)
    return result


def _rsi(closes: np.ndarray, period: int = 14) -> float:
    """Wilder's RSI – returns latest RSI value."""
    if len(closes) < period + 2:
        return 50.0
    delta = np.diff(closes)
    gain = np.where(delta > 0, delta, 0.0)
    loss = np.where(delta < 0, -delta, 0.0)
    # Wilder smoothing
    avg_gain = gain[:period].mean()
    avg_loss = loss[:period].mean()
    for i in range(period, len(gain)):
        avg_gain = (avg_gain * (period - 1) + gain[i]) / period
        avg_loss = (avg_loss * (period - 1) + loss[i]) / period
    if avg_loss == 0:
        return 100.0
    return float(100 - 100 / (1 + avg_gain / avg_loss))


def _macd(closes: np.ndarray) -> Dict:
    """Returns MACD hist, signal, and dead cross detection."""
    if len(closes) < 27:
        return {'hist': 0, 'hist_prev': 0, 'dead_cross': False, 'line': 0}
    e12  = _ema(closes, 12)
    e26  = _ema(closes, 26)
    ml   = e12 - e26
    sig  = _ema(ml, 9)
    hist      = float(ml[-1] - sig[-1])
    hist_prev = float(ml[-2] - sig[-2]) if len(ml) > 1 else 0
    return {
        'hist':       hist,
        'hist_prev':  hist_prev,
        'dead_cross': hist_prev > 0 > hist,
        'line':       float(ml[-1]),
    }


def _ema20_break(closes: np.ndarray) -> bool:
    """True if price closed below EMA20 after being above it for 3+ days."""
    if len(closes) < 25:
        return False
    e20 = _ema(closes, 20)
    was_above = closes[-4] > e20[-4] and closes[-3] > e20[-3] and closes[-2] > e20[-2]
    now_below  = closes[-1] < e20[-1] * 0.995
    return bool(was_above and now_below)


def _volume_divergence(closes: np.ndarray, volumes: np.ndarray, window: int = 5) -> bool:
    """Price making higher highs but volume declining = bearish divergence."""
    if len(closes) < window + 2 or len(volumes) < window + 2:
        return False
    price_up  = closes[-1] > closes[-window] and closes[-2] > closes[-window - 1]
    vol_down  = volumes[-window:].mean() < volumes[-window * 2:-window].mean() * 0.85
    return bool(price_up and vol_down)


# ── Trailing Stop Computation ─────────────────────────────────────────────────

def compute_trailing_stop(
    entry: float, tp1: float, tp2: float, sl: float,
    current_price: float, highest_since_entry: float, is_buy: bool
) -> tuple[float, str]:
    """
    4-Phase Trailing Stop:
      Phase 1: price < TP1           → original SL
      Phase 2: price >= TP1          → SL to entry (break-even)
      Phase 3: price >= TP1 × 1.03  → trail at highest × 0.94
      Phase 4: price >= TP2          → trail at highest × 0.96
    Returns (new_sl, phase_name)
    """
    if not is_buy:
        return sl, 'sell_direction'

    high = max(highest_since_entry, current_price)

    if current_price >= tp2:
        trail = high * 0.96
        return max(sl, trail), 'phase4_tp2_tight_trail'
    elif current_price >= tp1 * 1.03:
        trail = high * 0.94
        return max(sl, trail), 'phase3_active_trail'
    elif current_price >= tp1:
        return max(sl, entry), 'phase2_breakeven'
    return sl, 'phase1_original'


# ── Main Exit Engine ──────────────────────────────────────────────────────────

class ExitEngine:
    """
    Evaluates dynamic exit conditions for an open trade.
    Designed to be called per trade with full candle history.
    """

    def evaluate(
        self,
        closes: List[float],
        volumes: Optional[List[float]],
        entry: float,
        tp1: float,
        tp2: float,
        current_sl: float,
        current_price: float,
        highest_since_entry: float,
        is_buy: bool,
        unrealized_pnl_pct: float,
        symbol: str = '',
    ) -> ExitSignal:
        """
        Main evaluation function. Returns ExitSignal with recommendation.

        Parameters:
            closes            – List of closing prices (oldest→latest)
            volumes           – Optional list of volumes (same length)
            entry             – Trade entry price
            tp1, tp2          – Take profit levels
            current_sl        – Current stop loss (may already be trailing)
            current_price     – Latest market price
            highest_since_entry – Highest price reached since trade opened
            is_buy            – True for BUY, False for SELL
            unrealized_pnl_pct – Current unrealized P&L %
            symbol            – Stock symbol for logging
        """
        arr   = np.array(closes, dtype=float)
        vols  = np.array(volumes, dtype=float) if volumes else np.ones(len(closes))

        # ── Trailing stop ─────────────────────────────────────────────────────
        new_sl, phase = compute_trailing_stop(
            entry, tp1, tp2, current_sl, current_price, highest_since_entry, is_buy
        )

        # ── Check if trailing stop was hit ────────────────────────────────────
        if is_buy and current_price <= new_sl and new_sl > current_sl + 0.001:
            return ExitSignal(
                exit_now=True,
                reason='trailing_stop',
                reason_ar=f'وقف متحرك مُفعَّل ({phase}): السعر {current_price:.2f} كسر الحماية {new_sl:.2f}',
                urgency='critical',
                new_sl=new_sl,
                trailing_phase=phase,
                indicators={'phase': phase, 'highest': highest_since_entry}
            )

        # ── RSI ───────────────────────────────────────────────────────────────
        rsi_val = _rsi(arr) if len(arr) > 15 else 50.0

        if is_buy and rsi_val >= 80 and unrealized_pnl_pct >= 5:
            return ExitSignal(
                exit_now=True,
                reason='rsi_extreme_exhaustion',
                reason_ar=f'إجهاد شرائي شديد جداً (RSI {rsi_val:.0f}) مع ربح +{unrealized_pnl_pct:.1f}% → خروج فوري',
                urgency='critical',
                new_sl=new_sl, trailing_phase=phase,
                indicators={'rsi': rsi_val, 'pnl': unrealized_pnl_pct}
            )

        if is_buy and rsi_val >= 75 and unrealized_pnl_pct >= 3:
            return ExitSignal(
                exit_now=False,
                reason='rsi_exhaustion_warning',
                reason_ar=f'تحذير إجهاد (RSI {rsi_val:.0f}): يُنصح بجني 50% من الأرباح الآن (+{unrealized_pnl_pct:.1f}%)',
                urgency='high',
                new_sl=new_sl, trailing_phase=phase,
                indicators={'rsi': rsi_val, 'pnl': unrealized_pnl_pct}
            )

        # ── MACD ──────────────────────────────────────────────────────────────
        macd_data = _macd(arr)

        if macd_data['dead_cross'] and unrealized_pnl_pct > 0:
            return ExitSignal(
                exit_now=True,
                reason='macd_dead_cross',
                reason_ar=f'تقاطع MACD سلبي مع ربح +{unrealized_pnl_pct:.1f}% → اخرج الآن لحماية الأرباح',
                urgency='high',
                new_sl=new_sl, trailing_phase=phase,
                indicators={'macd_hist': macd_data['hist'], 'macd_prev': macd_data['hist_prev']}
            )

        if macd_data['dead_cross'] and unrealized_pnl_pct <= 0:
            return ExitSignal(
                exit_now=False,
                reason='macd_dead_cross_losing',
                reason_ar=f'تقاطع MACD سلبي مع خسارة {unrealized_pnl_pct:.1f}% → الصفقة في خطر، راجع وقف الخسارة',
                urgency='medium',
                new_sl=new_sl, trailing_phase=phase,
                indicators={'macd_hist': macd_data['hist']}
            )

        # ── EMA20 Break ───────────────────────────────────────────────────────
        if _ema20_break(arr) and is_buy and unrealized_pnl_pct > 0:
            return ExitSignal(
                exit_now=True,
                reason='ema20_break',
                reason_ar=f'كسر EMA20 بعد صعود ↘ اخرج بربح +{unrealized_pnl_pct:.1f}%',
                urgency='high',
                new_sl=new_sl, trailing_phase=phase,
                indicators={'ema20_break': True}
            )

        # ── Volume Divergence ─────────────────────────────────────────────────
        if _volume_divergence(arr, vols) and unrealized_pnl_pct >= 2:
            return ExitSignal(
                exit_now=False,
                reason='volume_divergence',
                reason_ar=f'تباعد سعر/حجم: السعر يصعد بحجم متراجع → احتمال انعكاس، جني جزئي موصى به',
                urgency='medium',
                new_sl=new_sl, trailing_phase=phase,
                indicators={'vol_divergence': True}
            )

        # ── Momentum Collapse ─────────────────────────────────────────────────
        if len(arr) >= 4:
            last4 = arr[-4:]
            down3 = all(last4[i] < last4[i - 1] for i in range(1, 4))
            if down3 and unrealized_pnl_pct < -2 and is_buy:
                return ExitSignal(
                    exit_now=False,
                    reason='momentum_collapse',
                    reason_ar=f'انهيار زخم: 3 جلسات هابطة متتالية، خسارة {unrealized_pnl_pct:.1f}% → راجع موقفك',
                    urgency='medium',
                    new_sl=new_sl, trailing_phase=phase,
                    indicators={'consecutive_down': 3, 'pnl': unrealized_pnl_pct}
                )

        # ── All clear ─────────────────────────────────────────────────────────
        return ExitSignal(
            exit_now=False,
            reason='hold',
            reason_ar=f'الصفقة ضمن المعايير | وقف: {new_sl:.2f} ({phase}) | RSI: {rsi_val:.0f}',
            urgency='none',
            new_sl=new_sl, trailing_phase=phase,
            indicators={'rsi': rsi_val, 'macd_hist': macd_data['hist'], 'phase': phase}
        )


# ── Singleton instance ────────────────────────────────────────────────────────
exit_engine = ExitEngine()


# ── CLI Runner (python -m services.exit_engine) ───────────────────────────────
if __name__ == '__main__':
    import sys, json
    from pathlib import Path
    from dotenv import load_dotenv
    from supabase import create_client

    load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')
    sb = create_client(
        os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
        os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    )

    logging.basicConfig(level=logging.INFO,
                        format='%(asctime)s [%(levelname)s] %(message)s')
    logger.info("🚀 Exit Engine – Scanning active trades...")

    active = sb.table('recommended_trades') \
               .select('id, company_id, symbol, direction, entry_price, tp1, tp2, sl, features_snapshot') \
               .eq('status', 'active').execute().data or []

    logger.info(f"   Found {len(active)} active trades")
    exit_count = warning_count = hold_count = 0

    for trade in active:
        cid  = trade['company_id']
        rows = sb.table('market_prices') \
                 .select('close_price, volume') \
                 .eq('company_id', cid) \
                 .order('price_date', desc=False) \
                 .limit(40).execute().data or []

        if len(rows) < 10:
            continue

        closes  = [float(r['close_price']) for r in rows if r.get('close_price')]
        volumes = [float(r.get('volume') or 1) for r in rows]
        snap    = trade.get('features_snapshot') or {}

        entry   = float(trade['entry_price'])
        tp1     = float(trade['tp1'])
        tp2     = float(trade['tp2'])
        sl      = float(trade['sl'])
        is_buy  = trade.get('direction', 'buy') != 'sell'
        current = closes[-1] if closes else entry
        high    = max(float(snap.get('highest_since_entry', entry)), current)
        pnl     = (current - entry) / entry * 100 * (1 if is_buy else -1)

        signal = exit_engine.evaluate(
            closes=closes, volumes=volumes,
            entry=entry, tp1=tp1, tp2=tp2,
            current_sl=sl, current_price=current,
            highest_since_entry=high, is_buy=is_buy,
            unrealized_pnl_pct=pnl, symbol=trade['symbol']
        )

        if signal.exit_now:
            exit_count += 1
            logger.warning(f"  🔴 {trade['symbol']:10s} EXIT [{signal.reason}] {signal.reason_ar}")
        elif signal.urgency in ('high', 'medium'):
            warning_count += 1
            logger.info(f"  🟡 {trade['symbol']:10s} WARN [{signal.reason}] {signal.reason_ar}")
        else:
            hold_count += 1
            logger.info(f"  🟢 {trade['symbol']:10s} HOLD | PnL={pnl:+.1f}% | {signal.reason_ar}")

    print(f"\n{'='*60}")
    print(f"  Exit Engine Summary")
    print(f"{'='*60}")
    print(f"  🔴 Exit Signals : {exit_count}")
    print(f"  🟡 Warnings     : {warning_count}")
    print(f"  🟢 Hold         : {hold_count}")
    print(f"{'='*60}")
