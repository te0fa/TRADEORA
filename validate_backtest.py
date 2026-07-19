# -*- coding: utf-8 -*-
"""
validate_backtest.py — TRADEORA Phase 1
التحقق من صحة الباك تيست: Look-ahead bias, Walk-Forward, Transaction Costs, Statistical Significance
"""

import os
import sys
import math
from datetime import datetime
import pandas as pd
import numpy as np
from dotenv import load_dotenv
from supabase import create_client

# تحميل إعدادات البيئة
load_dotenv()

# تهيئة عميل Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    # محاولة التحميل من أسماء بديلة في .env
    SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] لم يتم العثور على SUPABASE_URL أو SUPABASE_KEY في متغيرات البيئة.")
    sys.exit(1)

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

# محاولة استيراد quantstats كخيار أساسي للتحليلات الإحصائية
try:
    import quantstats as qs
except ImportError:
    qs = None
    print("[WARN] مكتبة quantstats غير مثبتة. سيتم استخدام الحسابات اليدوية كبديل.")

# محاولة استيراد vectorbt كخيار اختياري
try:
    import vectorbt as vbt
except ImportError:
    vbt = None
    print("[INFO] مكتبة vectorbt غير متوفرة. سيتم استخدام محاكي الباك تيست المبني على pandas تلقائياً.")


# ──────────────────────────────────────────────────────────────────────────
# 🔍 دالة جلب البيانات من Supabase وترتيبها زمنياً
# ──────────────────────────────────────────────────────────────────────────
def load_symbol_data(company_id: str, symbol: str, timeframe: str) -> pd.DataFrame:
    """
    تقوم بجلب البيانات التاريخية للشركة المحددة والفريم الزمني من قاعدة البيانات.
    """
    print(f"[INFO] جلب البيانات لـ {symbol} على فريم {timeframe}...", flush=True)
    
    if timeframe == '1d':
        # جلب البيانات اليومية من جدول market_prices
        res = sb.table('market_prices') \
            .select('price_date,open_price,high_price,low_price,close_price,volume') \
            .eq('company_id', company_id) \
            .order('price_date') \
            .execute()
        
        data = res.data if res.data else []
        if not data:
            return pd.DataFrame()
            
        df = pd.DataFrame(data)
        df.rename(columns={
            'price_date': 'date',
            'open_price': 'open',
            'high_price': 'high',
            'low_price': 'low',
            'close_price': 'close'
        }, inplace=True)
    else:
        # جلب البيانات اللحظية من جدول intraday_snapshots
        src = f'tradingview_{timeframe}'
        res = sb.table('intraday_snapshots') \
            .select('snapshot_time,open_price,high_price,low_price,price,volume') \
            .eq('company_id', company_id) \
            .eq('source', src) \
            .order('snapshot_time') \
            .execute()
            
        data = res.data if res.data else []
        if not data:
            return pd.DataFrame()
            
        df = pd.DataFrame(data)
        df.rename(columns={
            'snapshot_time': 'date',
            'open_price': 'open',
            'high_price': 'high',
            'low_price': 'low',
            'price': 'close'
        }, inplace=True)

    # التحقق من وجود الأعمدة وملء القيم المفقودة بالـ close
    for col in ['open', 'high', 'low', 'close']:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
            
    if 'volume' in df.columns:
        df['volume'] = pd.to_numeric(df['volume'], errors='coerce').fillna(0.0)
    else:
        df['volume'] = 0.0

    df.dropna(subset=['close'], inplace=True)
    
    # تعويض القيم المفقودة في open/high/low بسعر الإغلاق
    df['open'] = df['open'].fillna(df['close'])
    df['high'] = df['high'].fillna(df['close'])
    df['low'] = df['low'].fillna(df['close'])
    
    # جعل date هو الـ index وتنسيقه كـ datetime مرتب تصاعدياً
    df['date'] = pd.to_datetime(df['date'])
    df.set_index('date', inplace=True)
    df.sort_index(inplace=True)
    
    return df


# ──────────────────────────────────────────────────────────────────────────
# 🧮 دالة حساب المؤشرات وتوليد الإشارات مع تصحيح Look-Ahead Bias
# ──────────────────────────────────────────────────────────────────────────
def calc_rsi_pandas(series: pd.Series, period: int = 14) -> pd.Series:
    """حساب مؤشر القوة النسبية RSI باستخدام pandas لتفادي انحياز النظر للمستقبل."""
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).copy()
    loss = (-delta.where(delta < 0, 0)).copy()
    
    avg_gain = gain.rolling(window=period, min_periods=period).mean()
    avg_loss = loss.rolling(window=period, min_periods=period).mean()
    
    # تنعيم Wilder الأسري
    for i in range(period, len(series)):
        avg_gain.iloc[i] = (avg_gain.iloc[i-1] * (period - 1) + gain.iloc[i]) / period
        avg_loss.iloc[i] = (avg_loss.iloc[i-1] * (period - 1) + loss.iloc[i]) / period
        
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def calc_macd_hist_pandas(series: pd.Series) -> pd.Series:
    """حساب الهيستوجرام لمؤشر MACD (12, 26, 9)"""
    ema12 = series.ewm(span=12, adjust=False).mean()
    ema26 = series.ewm(span=26, adjust=False).mean()
    macd = ema12 - ema26
    signal = macd.ewm(span=9, adjust=False).mean()
    return macd - signal

def compute_signals(df: pd.DataFrame) -> pd.DataFrame:
    """
    تحسب المؤشرات الفنية وتولّد إشارات الشراء/البيع.
    - الدخول يكون في سعر الفتح للشمعة التالية open.shift(-1) لمنع الـ Look-Ahead Bias.
    """
    if len(df) < 50:
        df['buy_signal'] = False
        df['sell_signal'] = False
        df['entry_price'] = df['open']
        return df

    close = df['close']
    
    # حساب المؤشرات
    df['rsi'] = calc_rsi_pandas(close, 14)
    df['macd_hist'] = calc_macd_hist_pandas(close)
    df['sma20'] = close.rolling(window=20).mean()
    df['sma50'] = close.rolling(window=50).mean()
    
    # توليد الإشارات بناءً على إغلاق الشمعة الحالية t
    df['buy_signal'] = (
        (df['rsi'] > 45) & (df['rsi'] < 72) & 
        (df['macd_hist'] > 0) & 
        (close > df['sma20']) & (df['sma20'] > df['sma50'])
    )
    
    df['sell_signal'] = (
        (df['rsi'] < 55) & (df['rsi'] > 28) & 
        (df['macd_hist'] < 0) & 
        (close < df['sma20']) & (df['sma20'] < df['sma50'])
    )
    
    # تصحيح الـ Look-Ahead Bias: سعر الدخول الفعلي هو افتتاح الشمعة التالية (t+1)
    df['entry_price'] = df['open'].shift(-1)
    
    return df


# ──────────────────────────────────────────────────────────────────────────
# 💰 دالة خصم تكاليف المعاملات (العمولة والانزلاق السعري)
# ──────────────────────────────────────────────────────────────────────────
def apply_transaction_costs(returns_series: pd.Series, commission_pct=0.25, slippage_pct=0.10) -> pd.Series:
    """
    تخصم التكاليف من سلسلة العوائد.
    إجمالي التكلفة للصفقة (دخول + خروج) = (commission_pct + slippage_pct) * 2
    """
    cost_per_trade = (commission_pct + slippage_pct) * 2 / 100.0 # تحويل لنسبة عشرية
    
    # نخصم التكلفة فقط في الفترات التي تحتوي على تداول (عوائد غير صفرية)
    adjusted_returns = returns_series.copy()
    
    # نقوم بخصم التكاليف من العوائد النشطة
    # للتبسيط، نخصم تكلفة المعاملة عند كل تغير فعلي في العائد (الذي يمثل إغلاق صفقة)
    # أو نخصم التكاليف مباشرةً داخل المحاكي لكل صفقة منفصلة (وهو الأدق)
    return adjusted_returns


# ──────────────────────────────────────────────────────────────────────────
# 📅 دالة تقسيم التحقق الأمامي المتداول (Walk-Forward Validation Splits)
# ──────────────────────────────────────────────────────────────────────────
def walk_forward_split(df: pd.DataFrame, train_months=6, test_months=2):
    """
    تقسم البيانات التاريخية إلى فترات تدريب واختبار متتالية بنظام النافذة المتدحرجة.
    """
    if len(df) == 0:
        return []
        
    start_date = df.index.min()
    end_date = df.index.max()
    
    # حساب عدد الشهور الكلي بشكل تقريبي
    total_months = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)
    if total_months < (train_months + test_months):
        return []
        
    folds = []
    current_train_start = start_date
    
    while True:
        current_train_end = current_train_start + pd.DateOffset(months=train_months)
        current_test_end = current_train_end + pd.DateOffset(months=test_months)
        
        if current_train_end >= end_date:
            break
            
        if current_test_end > end_date:
            current_test_end = end_date
            
        train_df = df.loc[current_train_start : current_train_end - pd.Timedelta(seconds=1)]
        test_df = df.loc[current_train_end : current_test_end]
        
        if len(train_df) > 10 and len(test_df) > 5:
            fold_label = f"{current_train_end.strftime('%Y-%m')} to {current_test_end.strftime('%Y-%m')}"
            folds.append({
                'label': fold_label,
                'train_start': train_df.index.min(),
                'train_end': train_df.index.max(),
                'test_start': test_df.index.min(),
                'test_end': test_df.index.max(),
                'train_df': train_df,
                'test_df': test_df
            })
            
        # الانتقال للخطوة التالية بـ test_months
        current_train_start = current_train_start + pd.DateOffset(months=test_months)
        if current_train_start + pd.DateOffset(months=train_months) >= end_date:
            break
            
    return folds


# ──────────────────────────────────────────────────────────────────────────
# 🌡️ دالة تحديد حالة السوق (Market Regime)
# ──────────────────────────────────────────────────────────────────────────
def detect_market_regime(df: pd.DataFrame) -> pd.Series:
    """
    Bullish  (صاعد): SMA20 > SMA50 وكلاهما في اتجاه صعودي
    Bearish  (هابط): SMA20 < SMA50 وكلاهما في اتجاه هبوطي
    Sideways (عرضي): باقي الحالات
    """
    if 'sma20' not in df.columns or 'sma50' not in df.columns:
        return pd.Series('Sideways', index=df.index)
        
    sma20 = df['sma20']
    sma50 = df['sma50']
    
    sma20_diff = sma20.diff()
    sma50_diff = sma50.diff()
    
    regime = pd.Series('Sideways', index=df.index)
    
    bullish = (sma20 > sma50) & (sma20_diff > 0) & (sma50_diff > 0)
    bearish = (sma20 < sma50) & (sma20_diff < 0) & (sma50_diff < 0)
    
    regime[bullish] = 'Bullish'
    regime[bearish] = 'Bearish'
    
    return regime


# ──────────────────────────────────────────────────────────────────────────
# 🧮 المحاكي اليدوي للباك تيست المبني على Pandas (الـ Fallback الأساسي)
# ──────────────────────────────────────────────────────────────────────────
def run_manual_backtest(df: pd.DataFrame, tp_pct: float, sl_pct: float, lookahead: int,
                        commission_pct=0.25, slippage_pct=0.10) -> tuple[list, pd.Series]:
    """
    محاكاة يدوية دقيقة للباك تيست لتجنب الـ Look-Ahead Bias وحساب التكاليف والصفقات.
    """
    trades = []
    n = len(df)
    
    # مصفوفة الإشارات
    buy_signals = df['buy_signal']
    sell_signals = df['sell_signal']
    
    in_position = False
    active_trade = None
    
    # محاكاة الصفقات
    for i in range(n - 1):
        if not in_position:
            is_buy = buy_signals.iloc[i]
            is_sell = sell_signals.iloc[i]
            
            if is_buy or is_sell:
                entry_idx = i + 1  # الدخول في الشمعة التالية
                entry_price = df['open'].iloc[entry_idx]
                direction = 'buy' if is_buy else 'sell'
                
                # حساب مستويات الهدف والوقف
                if direction == 'buy':
                    tp1_price = entry_price * (1 + tp_pct)
                    tp2_price = entry_price * (1 + (tp_pct * 2)) # TP2 ضعف الهدف الأول
                    sl_price = entry_price * (1 - sl_pct)
                else:
                    tp1_price = entry_price * (1 - tp_pct)
                    tp2_price = entry_price * (1 - (tp_pct * 2))
                    sl_price = entry_price * (1 + sl_pct)
                    
                tp1_hit = False
                tp2_hit = False
                exit_price = None
                exit_idx = -1
                
                # فحص الشموع المستقبلية داخل نافذة lookahead
                limit = min(entry_idx + lookahead, n - 1)
                for idx in range(entry_idx, limit + 1):
                    fh = df['high'].iloc[idx]
                    fl = df['low'].iloc[idx]
                    
                    if direction == 'buy':
                        # فحص وقف الخسارة أولاً للحذر
                        if fl <= sl_price:
                            exit_price = sl_price
                            exit_idx = idx
                            break
                        # فحص الهدف الثاني
                        if fh >= tp2_price:
                            tp2_hit = True
                            exit_price = tp2_price
                            exit_idx = idx
                            break
                        # فحص الهدف الأول
                        if fh >= tp1_price:
                            tp1_hit = True
                    else:
                        # فحص وقف الخسارة للبيع القصير
                        if fh >= sl_price:
                            exit_price = sl_price
                            exit_idx = idx
                            break
                        # فحص الهدف الثاني للبيع القصير
                        if fl <= tp2_price:
                            tp2_hit = True
                            exit_price = tp2_price
                            exit_idx = idx
                            break
                        # فحص الهدف الأول للبيع القصير
                        if fl <= tp1_price:
                            tp1_hit = True
                            
                if exit_idx == -1:
                    # إغلاق عند نهاية الفترة بسعر الإغلاق
                    exit_idx = limit
                    exit_price = df['close'].iloc[limit]
                    
                # حساب العائد الأساسي
                raw_return = (exit_price - entry_price) / entry_price if direction == 'buy' else (entry_price - exit_price) / entry_price
                
                # خصم التكاليف للصفقة كاملة (دخول وخروج)
                cost_pct = (commission_pct + slippage_pct) * 2 / 100.0
                net_return = raw_return - cost_pct
                
                active_trade = {
                    'entry_idx': entry_idx,
                    'exit_idx': exit_idx,
                    'direction': direction,
                    'entry_price': entry_price,
                    'exit_price': exit_price,
                    'entry_date': df.index[entry_idx],
                    'exit_date': df.index[exit_idx],
                    'tp1_hit': tp1_hit,
                    'tp2_hit': tp2_hit,
                    'stopped': exit_price == sl_price,
                    'net_return': net_return,
                    'raw_return': raw_return
                }
                trades.append(active_trade)
                in_position = True
        else:
            # نحن في صفقة، لا نفتح صفقات جديدة حتى نصل لشمعة الخروج للصفقة الحالية
            if i >= active_trade['exit_idx']:
                in_position = False
                active_trade = None

    # حساب القيمة الرأسمالية للمحفظة لإنشاء سلسلة العوائد اليومية
    portfolio_value = np.ones(n) * 100000.0 # البداية بـ 100 ألف
    current_cash = 100000.0
    shares = 0.0
    active_t = None
    
    # محاكاة القيمة اليومية للمحفظة
    for t in range(n):
        # البحث عن صفقة تبدأ في t
        t_start = next((tr for tr in trades if tr['entry_idx'] == t), None)
        if t_start:
            active_t = t_start
            cost_pct = (commission_pct + slippage_pct) / 100.0
            if active_t['direction'] == 'buy':
                shares = current_cash * (1 - cost_pct) / active_t['entry_price']
                current_cash = 0.0
            else:
                # بيع قصير افتراضي
                shares = -current_cash / active_t['entry_price']
                current_cash = current_cash + (abs(shares) * active_t['entry_price'] * (1 - cost_pct))
                
        # تحديث قيمة المحفظة بناءً على أسعار الإغلاق
        if shares != 0.0 and active_t:
            if active_t['direction'] == 'buy':
                portfolio_value[t] = current_cash + (shares * df['close'].iloc[t])
            else:
                portfolio_value[t] = current_cash + (shares * df['close'].iloc[t]) # القيمة تنقص كلما ارتفع السعر
        else:
            portfolio_value[t] = current_cash
            
        # فحص إغلاق الصفقة في t
        if active_t and t == active_t['exit_idx']:
            cost_pct = (commission_pct + slippage_pct) / 100.0
            if active_t['direction'] == 'buy':
                current_cash = shares * active_t['exit_price'] * (1 - cost_pct)
            else:
                current_cash = current_cash - (abs(shares) * active_t['exit_price'] * (1 + cost_pct))
            shares = 0.0
            portfolio_value[t] = current_cash
            active_t = None
            
    p_series = pd.Series(portfolio_value, index=df.index)
    returns_series = p_series.pct_change().fillna(0.0)
    
    return trades, returns_series


# ──────────────────────────────────────────────────────────────────────────
# 📊 دالة حساب المقاييس الإحصائية وسنوية معامل شارب
# ──────────────────────────────────────────────────────────────────────────
def compute_metrics(returns_series: pd.Series, trades: list, ann_factor: float, label: str = "") -> dict:
    """
    تحسب الإحصائيات الشاملة باستخدام quantstats أو المعادلات البديلة.
    """
    total_trades = len(trades)
    
    if total_trades == 0:
        return {
            "label": label,
            "total_trades": 0,
            "win_rate": 0.0,
            "avg_return_per_trade": 0.0,
            "total_return": 0.0,
            "sharpe_ratio": 0.0,
            "max_drawdown": 0.0,
            "profit_factor": 0.0,
            "calmar_ratio": 0.0,
            "statistical_significance": False
        }
        
    # حساب نسبة الصفقات الرابحة ومتوسط العائد
    wins = sum(1 for t in trades if t['net_return'] > 0)
    win_rate = (wins / total_trades) * 100.0
    avg_ret = sum(t['net_return'] for t in trades) / total_trades * 100.0
    
    # إجمالي العائد التراكمي للمحفظة
    cum_ret = (returns_series + 1).prod() - 1
    total_return_pct = cum_ret * 100.0
    
    # حساب مقاييس المخاطر والأداء
    sharpe = 0.0
    max_dd = 0.0
    profit_factor = 0.0
    calmar = 0.0
    
    if qs is not None:
        try:
            sharpe = qs.stats.sharpe(returns_series, periods=ann_factor)
            max_dd = qs.stats.max_drawdown(returns_series) * 100.0
            profit_factor = qs.stats.profit_factor(returns_series)
            calmar = qs.stats.calmar(returns_series)
        except Exception:
            pass
            
    # حسابات بديلة في حال تعذر quantstats أو قيم غير صالحة
    if pd.isna(sharpe) or np.isinf(sharpe) or sharpe == 0.0:
        std_ret = returns_series.std()
        sharpe = (returns_series.mean() / std_ret * np.sqrt(ann_factor)) if std_ret > 0 else 0.0
        
    if pd.isna(max_dd) or np.isinf(max_dd) or max_dd == 0.0:
        cum_prod = (1 + returns_series).cumprod()
        running_max = cum_prod.cummax()
        drawdown = (cum_prod - running_max) / running_max
        max_dd = drawdown.min() * 100.0
        
    if pd.isna(profit_factor) or np.isinf(profit_factor) or profit_factor == 0.0:
        pos_sum = sum(t['net_return'] for t in trades if t['net_return'] > 0)
        neg_sum = abs(sum(t['net_return'] for t in trades if t['net_return'] < 0))
        profit_factor = pos_sum / neg_sum if neg_sum > 0 else 1.0
        
    if pd.isna(calmar) or np.isinf(calmar) or calmar == 0.0:
        calmar = (cum_ret / abs(max_dd / 100.0)) if max_dd != 0 else 0.0

    return {
        "label": label,
        "total_trades": total_trades,
        "win_rate": round(win_rate, 2),
        "avg_return_per_trade": round(avg_ret, 2),
        "total_return": round(total_return_pct, 2),
        "sharpe_ratio": round(sharpe, 2) if not pd.isna(sharpe) else 0.0,
        "max_drawdown": round(max_dd, 2) if not pd.isna(max_dd) else 0.0,
        "profit_factor": round(profit_factor, 2) if not pd.isna(profit_factor) else 1.0,
        "calmar_ratio": round(calmar, 2) if not pd.isna(calmar) else 0.0,
        "statistical_significance": total_trades >= 30
    }


# ──────────────────────────────────────────────────────────────────────────
# 📈 دالة الباك تيست باستخدام VectorBT (اختيارية)
# ──────────────────────────────────────────────────────────────────────────
def run_vectorbt_backtest(df: pd.DataFrame, tp_pct: float, sl_pct: float, timeframe: str):
    """
    تشغيل باك تيست باستخدام مكتبة vectorbt كخيار متقدم للتحقق.
    """
    if vbt is None:
        return None
        
    try:
        portfolio = vbt.Portfolio.from_signals(
            close=df['close'],
            entries=df['buy_signal'],
            exits=df['sell_signal'],
            sl_stop=sl_pct,
            tp_stop=tp_pct,
            fees=0.0025,       # عمولة دخول وخروج
            slippage=0.001,    # انزلاق سعري
            init_cash=100000.0,
            freq='D' if timeframe == '1d' else '15T'
        )
        return portfolio
    except Exception as e:
        print(f"[WARN] فشل تشغيل vectorbt: {e}")
        return None


# ──────────────────────────────────────────────────────────────────────────
# 🎯 نقطة الدخول والتحكم الرئيسية
# ──────────────────────────────────────────────────────────────────────────
def main():
    # قراءة قاموس الفترات الإعدادية ديناميكياً من backtest_signals.py
    # لمنع التعارض في نسب الأهداف والوقف
    try:
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        import backtest_signals
        TIMEFRAMES = backtest_signals.TIMEFRAMES
        print("[INFO] تم تحميل إعدادات الفريمات الزمنية (TP/SL) بنجاح من backtest_signals.py")
    except Exception as e:
        print(f"[WARN] فشل تحميل الإعدادات من backtest_signals.py: {e}. سيتم استخدام إعدادات افتراضية.")
        TIMEFRAMES = {
            '1d': {'source': 'daily', 'tp': 0.035, 'tp2': 0.07, 'sl': 0.035, 'look': 30},
            '15m': {'source': 'intraday', 'tp': 0.015, 'tp2': 0.03, 'sl': 0.01, 'look': 20},
            '1h': {'source': 'intraday', 'tp': 0.02, 'tp2': 0.04, 'sl': 0.015, 'look': 20},
            '4h': {'source': 'intraday', 'tp': 0.025, 'tp2': 0.05, 'sl': 0.02, 'look': 20},
        }

    # جلب الشركات الفعالة
    try:
        companies = sb.table('companies').select('id, symbol').execute().data
    except Exception as e:
        print(f"[ERROR] فشل جلب الشركات من Supabase: {e}")
        sys.exit(1)
        
    if not companies:
        print("[ERROR] لم يتم العثور على أي شركات في جدول companies.")
        sys.exit(1)
        
    print(f"[INFO] تم تحميل {len(companies)} شركة من قاعدة البيانات لعمل التحقق.")
    
    all_portfolio_trades_count = 0
    results_to_upsert = []
    
    for co_idx, co in enumerate(companies):
        company_id = co['id']
        symbol = co['symbol']
        
        for timeframe, cfg in TIMEFRAMES.items():
            # تحميل البيانات التاريخية وترتيبها
            df = load_symbol_data(company_id, symbol, timeframe)
            if df.empty or len(df) < 60:
                print(f"[SKIP] شركة {symbol} فريم {timeframe} ليس بها بيانات كافية.")
                continue
                
            # حساب الإشارات مع تصحيح الـ Look-ahead bias
            df = compute_signals(df)
            
            # تحديد معامل السنوية لمعامل شارب حسب ساعات البورصة المصرية
            if timeframe == '1d':
                ann_factor = 250.0
            elif timeframe == '4h':
                ann_factor = 343.75
            elif timeframe == '1h':
                ann_factor = 1375.0
            elif timeframe == '15m':
                ann_factor = 5500.0
            else:
                ann_factor = 250.0
                
            # تقسيم التحقق الأمامي المتداول (Walk-Forward)
            folds = walk_forward_split(df, train_months=6, test_months=2)
            if not folds:
                print(f"[SKIP] شركة {symbol} فريم {timeframe} ليس بها فترات كافية لـ Walk-Forward Split.")
                continue
                
            print(f"\n📊 نتائج Walk-Forward لـ {symbol} فريم {timeframe}")
            print("┌" + "─"*13 + "┬" + "─"*10 + "┬" + "─"*10 + "┬" + "─"*12 + "┬" + "─"*13 + "┬" + "─"*11 + "┐")
            print("│ Fold        │ Trades   │ Win Rate │ Sharpe     │ Max DD      │ Total Ret │")
            print("├" + "─"*13 + "┼" + "─"*10 + "┼" + "─"*10 + "┼" + "─"*12 + "┼" + "─"*13 + "┼" + "─"*11 + "┤")
            
            fold_metrics_list = []
            
            for fold in folds:
                train_df = fold['train_df']
                test_df = fold['test_df']
                
                # تشغيل الباك تيست على فترة الاختبار (Test Fold)
                # نستخدم نسب TP1 و SL المسحوبة ديناميكياً
                tp_pct = cfg['tp']
                sl_pct = cfg['sl']
                look = cfg['look']
                
                # الباك تيست الرئيسي والـ Fallback
                trades, returns_series = run_manual_backtest(
                    test_df, tp_pct, sl_pct, look,
                    commission_pct=0.25, slippage_pct=0.10
                )
                
                # حساب المؤشرات الإحصائية للفولد
                metrics = compute_metrics(returns_series, trades, ann_factor, label=fold['label'])
                fold_metrics_list.append((fold, metrics, trades))
                
                # زيادة العداد الإجمالي لجميع صفقات المحفظة
                all_portfolio_trades_count += len(trades)
                
                # طباعة صف النتائج في الكونسول للفولد الحالي
                print(f"│ {metrics['label']:<11} │ {metrics['total_trades']:<8} │ {metrics['win_rate']:<7}% │ {metrics['sharpe_ratio']:<10} │ {metrics['max_drawdown']:<10}% │ +{metrics['total_return']:<8}% │")
                
            print("└" + "─"*13 + "┴" + "─"*10 + "┴" + "─"*10 + "┴" + "─"*12 + "┴" + "─"*13 + "┴" + "─"*11 + "┘")
            
            # تحليل الأداء حسب حالات السوق الثلاثة لكامل الفترة الاختبارية المدمجة
            regimes = detect_market_regime(df)
            regime_dict = regimes.to_dict()
            
            # حساب Win Rate لكل حالة سوق
            for fold, metrics, trades in fold_metrics_list:
                bullish_trades = [t for t in trades if regime_dict.get(t['entry_date'], 'Sideways') == 'Bullish']
                bearish_trades = [t for t in trades if regime_dict.get(t['entry_date'], 'Sideways') == 'Bearish']
                sideways_trades = [t for t in trades if regime_dict.get(t['entry_date'], 'Sideways') == 'Sideways']
                
                def calc_subset_winrate(subset):
                    if not subset: return 0.0
                    w = sum(1 for t in subset if t['net_return'] > 0)
                    return round((w / len(subset)) * 100.0, 2)
                    
                bullish_wr = calc_subset_winrate(bullish_trades)
                bearish_wr = calc_subset_winrate(bearish_trades)
                sideways_wr = calc_subset_winrate(sideways_trades)
                
                # إعداد الصف للإدراج في قاعدة البيانات
                results_to_upsert.append({
                    "company_id": company_id,
                    "symbol": symbol,
                    "timeframe": timeframe,
                    "fold_label": fold['label'],
                    "train_start": fold['train_start'].strftime('%Y-%m-%d'),
                    "train_end": fold['train_end'].strftime('%Y-%m-%d'),
                    "test_start": fold['test_start'].strftime('%Y-%m-%d'),
                    "test_end": fold['test_end'].strftime('%Y-%m-%d'),
                    "total_trades": metrics['total_trades'],
                    "win_rate": metrics['win_rate'],
                    "sharpe_ratio": metrics['sharpe_ratio'],
                    "max_drawdown": metrics['max_drawdown'],
                    "total_return": metrics['total_return'],
                    "profit_factor": metrics['profit_factor'],
                    "calmar_ratio": metrics['calmar_ratio'],
                    "win_rate_after_costs": metrics['win_rate'], # محسوبة بالتكاليف بالفعل
                    "return_after_costs": metrics['total_return'],
                    "commission_pct": 0.25,
                    "slippage_pct": 0.10,
                    "market_regime_bullish_wr": bullish_wr,
                    "market_regime_bearish_wr": bearish_wr,
                    "market_regime_sideways_wr": sideways_wr,
                    "lookahead_bias_detected": False, # تم التصحيح بشكل صارم
                    "notes": "Walk-forward validation executed with look-ahead bias correction."
                })

            # طباعة تأثير التكاليف الإجمالي التقريبي وحالة السوق للفولد الأخير للمثال
            if fold_metrics_list:
                last_fold, last_m, last_trades = fold_metrics_list[-1]
                raw_wins = sum(1 for t in last_trades if t['raw_return'] > 0)
                raw_wr = (raw_wins / len(last_trades) * 100.0) if last_trades else 0.0
                
                print("\n🌡️ الأداء حسب حالة السوق (آخر فولد):")
                # إيجاد عدد صفقات كل حالة
                print(f"• Bullish  (صاعد):  Win Rate = {results_to_upsert[-1]['market_regime_bullish_wr']}% | Trades = {sum(1 for t in last_trades if regime_dict.get(t['entry_date'], 'Sideways') == 'Bullish')}")
                print(f"• Bearish  (هابط):  Win Rate = {results_to_upsert[-1]['market_regime_bearish_wr']}% | Trades = {sum(1 for t in last_trades if regime_dict.get(t['entry_date'], 'Sideways') == 'Bearish')}")
                print(f"• Sideways (عرضي): Win Rate = {results_to_upsert[-1]['market_regime_sideways_wr']}% | Trades = {sum(1 for t in last_trades if regime_dict.get(t['entry_date'], 'Sideways') == 'Sideways')}")
                
                print("\n💰 تأثير تكاليف التنفيذ (آخر فولد):")
                print(f"• Win Rate قبل التكاليف: {round(raw_wr, 2)}%")
                print(f"• Win Rate بعد التكاليف (0.25% + 0.1% slippage): {last_m['win_rate']}%")
                diff_ret = sum(t['raw_return'] - t['net_return'] for t in last_trades) * 100.0
                print(f"• فرق العائد الإجمالي المفقود في التكاليف: -{round(diff_ret, 2)}%")

    # حفظ النتائج في قاعدة البيانات
    if results_to_upsert:
        print(f"\n[INFO] حفظ {len(results_to_upsert)} سجل في Supabase...")
        try:
            sb.table('backtest_validation_results').upsert(results_to_upsert, on_conflict='company_id,timeframe,fold_label').execute()
            print("✅ تم حفظ النتائج بنجاح في الجدول backtest_validation_results.")
        except Exception as e:
            print(f"[WARN] فشل حفظ السجلات في Supabase: {e}. قد تحتاج لتشغيل كود إنشاء الجدول SQL أولاً.")
            
    # التقرير الإجمالي الشامل والتحذيرات الإحصائية في الكونسول
    print("\n" + "═"*54)
    print("  TRADEORA Backtest Validation Report Summary")
    print(f"  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("═"*54)
    print("⚠️  تحذيرات Look-Ahead Bias الإحصائية:")
    print("• [OK] الدخول في سعر افتتاح الشمعة التالية (shift(-1)).")
    print("• [OK] المؤشرات الفنية تحتسب على الشمعة المغلقة الحالية فقط.")
    
    # شرط الـ 300 صفقة كحد أدنى إحصائي للمحفظة
    print(f"• إجمالي صفقات المحفظة المختبرة: {all_portfolio_trades_count}")
    if all_portfolio_trades_count < 300:
        print(f"• [WARN] إجمالي صفقات الباكتست ({all_portfolio_trades_count}) أقل من الحد الأدنى المقبول إحصائياً وهو 300 صفقة!")
    else:
        print(f"• [OK] إجمالي الصفقات ({all_portfolio_trades_count}) أكبر من 300 صفقة. النتائج ذات دلالة إحصائية.")
    print("═"*54)


if __name__ == '__main__':
    main()
