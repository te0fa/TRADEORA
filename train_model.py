import os
import numpy as np
import pandas as pd
import pandas_ta as ta
import joblib
from xgboost import XGBClassifier
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import StandardScaler
from supabase import create_client
from dotenv import load_dotenv
import datetime
from pathlib import Path
import pytz

# Load Environment Variables explicitly from script folder
load_dotenv(dotenv_path=Path(__file__).parent / '.env')

url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_KEY') or os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
sb = create_client(url, key)

def get_cairo_datetime(t):
    cairo_tz = pytz.timezone('Africa/Cairo')
    if t is None:
        return None
    try:
        if isinstance(t, (int, float)):
            return datetime.datetime.fromtimestamp(t, cairo_tz)
        if isinstance(t, datetime.date) and not isinstance(t, datetime.datetime):
            return datetime.datetime(t.year, t.month, t.day, tzinfo=cairo_tz)
        if isinstance(t, datetime.datetime):
            return t.astimezone(cairo_tz)
        if isinstance(t, str):
            try:
                return datetime.datetime.fromisoformat(t).astimezone(cairo_tz)
            except:
                parts = t.split('-')
                if len(parts) == 3:
                    return datetime.datetime(int(parts[0]), int(parts[1]), int(parts[2]), tzinfo=cairo_tz)
    except:
        pass
    return None

def precompute_sentiment_features(companies, all_candles_by_co, news_list):
    cairo_tz = pytz.timezone('Africa/Cairo')
    corp_news = {}
    macro_news = {'macro_fx': [], 'macro_rate': [], 'macro_geopolitical': []}
    for n in news_list:
        if n['category'] == 'corporate' and n['company_id']:
            corp_news.setdefault(n['company_id'], []).append(n)
        elif n['category'] in macro_news:
            macro_news[n['category']].append(n)
            
    company_day_sentiment = {}
    company_day_sensitivity = {}
    macro_day_scores = {'macro_fx': {}, 'macro_rate': {}, 'macro_geopolitical': {}}
    co_sector = {co['id']: co.get('sector', 'Unknown') for co in companies}
    
    unique_dates = set()
    for co_id, candles in all_candles_by_co.items():
        for c in candles:
            dt = get_cairo_datetime(c.get('time'))
            if dt:
                unique_dates.add(dt.date())
                
    sorted_dates = sorted(list(unique_dates))
    session_starts = [datetime.datetime(d.year, d.month, d.day, 10, 0, 0, tzinfo=cairo_tz) for d in sorted_dates]
    
    for i, date_obj in enumerate(sorted_dates):
        date_str = date_obj.isoformat()
        session_end = session_starts[i]
        if i >= 6:
            session_start = session_starts[i-6]
        else:
            session_start = session_starts[0] - datetime.timedelta(days=7)
            
        for cat in ['macro_fx', 'macro_rate', 'macro_geopolitical']:
            cat_news = macro_news[cat]
            visible = [n for n in cat_news if session_start <= n['dt'] < session_end]
            pos = sum(1 for n in visible if n['sentiment'] == 'positive')
            neg = sum(1 for n in visible if n['sentiment'] == 'negative')
            total = len(visible)
            score = (pos - neg) / total if total > 0 else 0.0
            macro_day_scores[cat][date_str] = score

    for co_id, candles in all_candles_by_co.items():
        company_day_sentiment[co_id] = {}
        company_day_sensitivity[co_id] = {}
        co_news = corp_news.get(co_id, [])
        closes = [c['close'] for c in candles]
        c_dates = [get_cairo_datetime(c.get('time')) for c in candles]
        
        sentiment_scores = []
        for i in range(len(candles)):
            dt = c_dates[i]
            if not dt:
                sentiment_scores.append(0.0)
                continue
            session_end = datetime.datetime(dt.year, dt.month, dt.day, 10, 0, 0, tzinfo=cairo_tz)
            if i >= 4:
                start_dt = c_dates[i-4]
                session_start = datetime.datetime(start_dt.year, start_dt.month, start_dt.day, 10, 0, 0, tzinfo=cairo_tz)
            else:
                session_start = session_end - datetime.timedelta(days=5)
                
            visible = [n for n in co_news if session_start <= n['dt'] < session_end]
            pos = sum(1 for n in visible if n['sentiment'] == 'positive')
            neg = sum(1 for n in visible if n['sentiment'] == 'negative')
            total = len(visible)
            score = (pos - neg) / total if total > 0 else 0.0
            sentiment_scores.append(score)
            company_day_sentiment[co_id][dt.date().isoformat()] = score
            
        for i in range(len(candles)):
            dt = c_dates[i]
            if not dt or i < 30:
                company_day_sensitivity[co_id][dt.date().isoformat() if dt else ''] = 0.0
                continue
                
            start_dt_30 = c_dates[i-29]
            session_start_30 = datetime.datetime(start_dt_30.year, start_dt_30.month, start_dt_30.day, 10, 0, 0, tzinfo=cairo_tz)
            session_end_30 = datetime.datetime(dt.year, dt.month, dt.day, 10, 0, 0, tzinfo=cairo_tz)
            visible_30 = [n for n in co_news if session_start_30 <= n['dt'] < session_end_30]
            news_count_30 = len(visible_30)
            
            if news_count_30 >= 3:
                rets = []
                sents = []
                for j in range(i-29, i+1):
                    ret = (closes[j] - closes[j-1]) / closes[j-1] if closes[j-1] > 0 else 0.0
                    rets.append(ret)
                    sents.append(sentiment_scores[j])
                
                corr = np.corrcoef(rets, sents)[0, 1]
                if np.isnan(corr):
                    corr = 0.0
            else:
                corr = None
                
            company_day_sensitivity[co_id][dt.date().isoformat()] = corr

    sector_day_sentiment = {}
    sector_day_sensitivity = {}
    
    for date_obj in sorted_dates:
        date_str = date_obj.isoformat()
        sector_scores = {}
        sector_corrs = {}
        for co_id in all_candles_by_co.keys():
            sec = co_sector.get(co_id, 'Unknown')
            score = company_day_sentiment[co_id].get(date_str, 0.0)
            corr = company_day_sensitivity[co_id].get(date_str, None)
            
            sector_scores.setdefault(sec, []).append(score)
            if corr is not None:
                sector_corrs.setdefault(sec, []).append(corr)
                
        for sec, scores in sector_scores.items():
            sector_day_sentiment[(sec, date_str)] = sum(scores) / len(scores) if scores else 0.0
            
        for sec, corrs in sector_corrs.items():
            sector_day_sensitivity[(sec, date_str)] = sum(corrs) / len(corrs) if corrs else 0.0

    for co_id in all_candles_by_co.keys():
        sec = co_sector.get(co_id, 'Unknown')
        for date_str in company_day_sensitivity[co_id].keys():
            if company_day_sensitivity[co_id][date_str] is None:
                company_day_sensitivity[co_id][date_str] = sector_day_sensitivity.get((sec, date_str), 0.0)

    return company_day_sentiment, company_day_sensitivity, sector_day_sentiment, macro_day_scores

def precompute_sector_relative_volumes(companies, all_candles_by_co):
    co_sector = {co['id']: co.get('sector', 'Unknown') for co in companies}
    records = []
    for co_id, candles in all_candles_by_co.items():
        sector = co_sector.get(co_id, 'Unknown')
        for c in candles:
            dt_str = c['time']
            if isinstance(dt_str, str):
                dt_str = dt_str.split('T')[0].split(' ')[0]
            elif hasattr(dt_str, 'strftime'):
                dt_str = dt_str.strftime('%Y-%m-%d')
            records.append({
                'company_id': co_id,
                'sector': sector,
                'date': dt_str,
                'volume': float(c.get('volume', 0) or 0)
            })
            
    if not records:
        return {}
        
    df = pd.DataFrame(records)
    
    # Stock volume ratio
    df = df.sort_values(by=['company_id', 'date'])
    df['stock_avg_vol_20'] = df.groupby('company_id')['volume'].transform(lambda x: x.rolling(20, min_periods=1).mean())
    df['stock_vol_ratio'] = df['volume'] / df['stock_avg_vol_20'].replace(0, 1)
    
    # Sector volume ratio
    sector_daily = df.groupby(['sector', 'date'])['volume'].sum().reset_index().rename(columns={'volume': 'sector_volume'})
    sector_daily = sector_daily.sort_values(by=['sector', 'date'])
    sector_daily['sector_avg_vol_20'] = sector_daily.groupby('sector')['sector_volume'].transform(lambda x: x.rolling(20, min_periods=1).mean())
    sector_daily['sector_vol_ratio'] = sector_daily['sector_volume'] / sector_daily['sector_avg_vol_20'].replace(0, 1)
    
    df = pd.merge(df, sector_daily[['sector', 'date', 'sector_vol_ratio']], on=['sector', 'date'], how='left')
    df['sector_relative_volume'] = df['stock_vol_ratio'] / df['sector_vol_ratio'].replace(0, 1)
    
    lookup = {}
    for _, row in df.iterrows():
        lookup[(row['company_id'], row['date'])] = float(row['sector_relative_volume'])
        
    return lookup

# ── مؤشرات فنية بسيطة ──────────────────

def calc_rsi(closes, period=14):
    gains, losses = [], []
    for i in range(1, len(closes)):
        d = closes[i] - closes[i-1]
        gains.append(max(d, 0))
        losses.append(max(-d, 0))
    if len(gains) < period:
        return [None]*len(closes)
    ag = sum(gains[:period])/period
    al = sum(losses[:period])/period
    rsi = [None]*len(closes)
    for i in range(period, len(closes)):
        if i > period:
            ag = (ag*(period-1)+gains[i-1])/period
            al = (al*(period-1)+losses[i-1])/period
        rs = ag/al if al else 100
        rsi[i] = 100 - 100/(1+rs)
    return rsi

def calc_ema(closes, n):
    result = [None]*len(closes)
    k = 2/(n+1)
    for i in range(n-1, len(closes)):
        if result[i-1] is None:
            result[i] = sum(closes[i-n+1:i+1])/n
        else:
            result[i] = closes[i]*k + result[i-1]*(1-k)
    return result

def calc_features(candles, company_id=None, company_sector=None, company_day_sentiment=None, company_day_sensitivity=None, sector_day_sentiment=None, macro_day_scores=None, sector_relative_volume_lookup=None):

    df = pd.DataFrame(candles)
    adx_df = df.ta.adx(length=14)
    if adx_df is not None and not adx_df.empty:
        adx_list = adx_df['ADX_14'].tolist()
        plus_di = adx_df['DMP_14'].tolist()
        minus_di = adx_df['DMN_14'].tolist()
    else:
        adx_list = [None] * len(candles)
        plus_di = [None] * len(candles)
        minus_di = [None] * len(candles)

    closes = [c['close'] for c in candles]
    highs  = [c['high']  for c in candles]
    lows   = [c['low']   for c in candles]
    vols   = [c.get('volume', 0) for c in candles]
    times  = [c.get('time', None) for c in candles]

    rsi   = calc_rsi(closes, 14)
    ema12 = calc_ema(closes, 12)
    ema26 = calc_ema(closes, 26)
    ema20 = calc_ema(closes, 20)
    ema50 = calc_ema(closes, 50)
    ema200 = calc_ema(closes, 200)

    # Bollinger Bands
    def calc_bb(closes, n=20):
        bb_width = [None]*len(closes)
        bb_pos   = [None]*len(closes)
        for i in range(n-1, len(closes)):
            window = closes[i-n+1:i+1]
            mean = sum(window)/n
            std  = (sum((x-mean)**2 for x in window)/n)**0.5
            if std > 0:
                bb_width[i] = (std*4) / mean * 100
                bb_pos[i]   = (closes[i]-mean) / (std*2)
        return bb_width, bb_pos

    # Stochastic RSI
    def calc_stoch_rsi(rsi_vals, period=14):
        stoch = [None]*len(rsi_vals)
        for i in range(period, len(rsi_vals)):
            window = [x for x in rsi_vals[i-period:i+1]
                      if x is not None]
            if len(window) < period:
                continue
            min_r, max_r = min(window), max(window)
            if max_r - min_r > 0:
                stoch[i] = (rsi_vals[i]-min_r)/(max_r-min_r)
            else:
                stoch[i] = 0.5
        return stoch

    bb_width, bb_pos = calc_bb(closes)
    stoch_rsi = calc_stoch_rsi(rsi)

    rows = []
    for i in range(50, len(candles)-1):
        cl = closes[i]
        if None in [rsi[i], ema12[i], ema26[i],
                    ema20[i], ema50[i],
                    bb_width[i], bb_pos[i],
                    stoch_rsi[i]]:
            continue

        # MACD
        macd_raw  = ema12[i] - ema26[i]
        macd_prev = ((ema12[i-1] or 0) -
                     (ema26[i-1] or 0))
        macd_hist = macd_raw - macd_prev

        # ATR
        trs = [max(highs[j]-lows[j],
                   abs(highs[j]-closes[j-1]),
                   abs(lows[j]-closes[j-1]))
               for j in range(max(1,i-13), i+1)]
        atr = sum(trs)/len(trs) if trs else 0.001

        # Volume spike
        avg_vol   = sum(vols[i-13:i+1])/14 \
                    if i >= 13 else 1
        vol_ratio = vols[i]/avg_vol \
                    if avg_vol > 0 else 1
        vol_spike = 1 if vol_ratio >= 3 else 0

        # Distance to ATH (52-week high)
        lookback_52 = min(i, 252)
        ath_52  = max(highs[i-lookback_52:i+1])
        dist_ath = (cl - ath_52) / ath_52 * 100

        # Day of week (0=Mon, 6=Sun, EGX: 0=Sun)
        day_of_week = 0
        if times[i]:
            try:
                if isinstance(times[i], (int, float)):
                    dt = datetime.datetime.fromtimestamp(times[i])
                    day_of_week = dt.weekday()
                elif hasattr(times[i], 'weekday'):
                    day_of_week = times[i].weekday()
            except:
                pass

        # Day of week for EGX (Sun=0, Mon=1, ..., Thu=4, Fri=5, Sat=6)
        # Python weekday() returns 0 for Monday and 6 for Sunday.
        # Let's adjust to EGX convention:
        # Mon (0) -> 1, Tue (1) -> 2, Wed (2) -> 3, Thu (3) -> 4, Fri (4) -> 5, Sat (5) -> 6, Sun (6) -> 0.
        day_of_week = (day_of_week + 1) % 7

        # Price position in candle
        candle_range = highs[i] - lows[i]
        price_pos = (cl - lows[i]) / \
                    (candle_range + 0.001)

        # Market Regime Detection
        adx_val = adx_list[i] if (i < len(adx_list) and adx_list[i] is not None and not np.isnan(adx_list[i])) else 0.0
        pdi_val = plus_di[i] if (i < len(plus_di) and plus_di[i] is not None and not np.isnan(plus_di[i])) else 0.0
        ndi_val = minus_di[i] if (i < len(minus_di) and minus_di[i] is not None and not np.isnan(minus_di[i])) else 0.0

        ema_crossover = False
        if i >= 15:
            diffs = []
            for j in range(i-15, i+1):
                if ema50[j] is not None and ema200[j] is not None:
                    diffs.append(ema50[j] - ema200[j])
            if len(diffs) >= 2:
                signs = [np.sign(d) for d in diffs]
                if len(set(signs)) > 1 or 0 in signs:
                    ema_crossover = True
                avg_diff = sum(abs(d) for d in diffs) / len(diffs)
                if avg_diff / max(cl, 1.0) < 0.002:
                    ema_crossover = True

        if adx_val > 25:
            regime = 1.0 if pdi_val > ndi_val else -1.0
        elif adx_val <= 20 or ema_crossover:
            regime = 0.0
        else:
            regime = 0.0

        # default values
        news_sentiment = 0.0
        sector_sentiment = 0.0
        macro_fx = 0.0
        macro_rate = 0.0
        macro_geo = 0.0
        sentiment_sensitivity = 0.0
        sector_relative_volume = 1.0

        dt_c = get_cairo_datetime(times[i])
        date_str = dt_c.date().isoformat() if dt_c else ""

        if date_str:
            if company_day_sentiment and company_id in company_day_sentiment:
                news_sentiment = company_day_sentiment[company_id].get(date_str, 0.0) or 0.0
            if company_day_sensitivity and company_id in company_day_sensitivity:
                sentiment_sensitivity = company_day_sensitivity[company_id].get(date_str, 0.0) or 0.0
            if sector_day_sentiment and company_sector:
                sector_sentiment = sector_day_sentiment.get((company_sector, date_str), 0.0) or 0.0
            if macro_day_scores:
                macro_fx = macro_day_scores['macro_fx'].get(date_str, 0.0) or 0.0
                macro_rate = macro_day_scores['macro_rate'].get(date_str, 0.0) or 0.0
                macro_geo = macro_day_scores['macro_geopolitical'].get(date_str, 0.0) or 0.0
            if sector_relative_volume_lookup and company_id:
                sector_relative_volume = sector_relative_volume_lookup.get((company_id, date_str), 1.0) or 1.0

        rows.append({
            'idx': i,
            # ── الـ features الأصلية ──
            'rsi':        rsi[i],
            'macd_hist':  macd_hist,
            'macd_raw':   macd_raw,
            'dist_ema20': (cl-ema20[i])/ema20[i]*100,
            'dist_ema50': (cl-ema50[i])/ema50[i]*100,
            'atr_pct':    atr/cl*100,
            'vol_ratio':  min(vol_ratio, 5),
            'price_pos':  price_pos,
            # ── الـ features الجديدة ──
            'bb_width':   bb_width[i],
            'bb_pos':     bb_pos[i],
            'stoch_rsi':  stoch_rsi[i],
            'vol_spike':  vol_spike,
            'dist_ath':   dist_ath,
            'day_of_week': day_of_week,
            'market_regime': regime,
            'news_sentiment_score': news_sentiment,
            'sector_sentiment_score': sector_sentiment,
            'macro_fx_score': macro_fx,
            'macro_rate_score': macro_rate,
            'macro_geo_score': macro_geo,
            'stock_sentiment_sensitivity': sentiment_sensitivity,
            'sector_relative_volume': sector_relative_volume,
        })
    return rows

# ── بناء Dataset ────────────────────────

def build_dataset(timeframe='1d',
                  tp_pct=0.035, lookahead=30):
    print(f"جلب بيانات {timeframe}...", flush=True)
    companies = sb.table('companies')\
                   .select('id,symbol,sector').execute().data or []

    fundamentals_lookup = {}
    if timeframe == '1d':
        try:
            fund_data = sb.table('company_fundamentals').select('*').execute().data or []
            for f_item in fund_data:
                fundamentals_lookup[f_item['company_id']] = f_item
            print(f"Loaded {len(fundamentals_lookup)} fundamentals records from database.", flush=True)
        except Exception as e:
            print(f"Error loading company fundamentals: {e}", flush=True)

    # First Pass: Load all candles for all companies and store them in memory
    all_candles_by_co = {}
    for co in companies:
        cid, sym = co['id'], co['symbol']
        candles = []

        if timeframe == '1d':
            rows = sb.table('market_prices')\
                .select('open_price,high_price,'
                        'low_price,close_price,volume,price_date')\
                .eq('company_id', cid)\
                .order('price_date').execute().data or []
            candles = [{
                'open':  r['open_price']  or r['close_price'],
                'high':  r['high_price']  or r['close_price'],
                'low':   r['low_price']   or r['close_price'],
                'close': r['close_price'],
                'volume':r['volume'] or 0,
                'time':  r['price_date']
            } for r in rows if r['close_price']]
        else:
            src = f'tradingview_{timeframe}'
            parquet_path = Path('data/historical_exports') / f"export_{src}.parquet"
            if parquet_path.exists():
                try:
                    df_local = pd.read_parquet(parquet_path)
                    company_rows = df_local[df_local['company_id'] == cid].sort_values('snapshot_time')
                    candles = [{
                        'open':  float(r['open_price']) if r['open_price'] is not None else float(r['price']),
                        'high':  float(r['high_price']) if r['high_price'] is not None else float(r['price']),
                        'low':   float(r['low_price']) if r['low_price'] is not None else float(r['price']),
                        'close': float(r['price']),
                        'volume':int(r['volume']) if r['volume'] is not None else 0,
                        'time':  r['snapshot_time']
                    } for _, r in company_rows.iterrows()]
                except Exception as e:
                    print(f"Error reading local parquet for {sym}: {e}", flush=True)
            
            if not candles:
                rows = sb.table('intraday_snapshots')\
                    .select('open_price,high_price,'
                            'low_price,price,volume,snapshot_time')\
                    .eq('company_id', cid)\
                    .eq('source', src)\
                    .order('snapshot_time').execute().data or []
                candles = [{
                    'open':  r['open_price']  or r['price'],
                    'high':  r['high_price']  or r['price'],
                    'low':   r['low_price']   or r['price'],
                    'close': r['price'],
                    'volume':r.get('volume') or 0,
                    'time':  r['snapshot_time']
                } for r in rows if r['price']]

        if len(candles) >= 60:
            all_candles_by_co[cid] = candles

    # Fetch all news
    print("جلب أخبار الشركات والاقتصاد الكلي من قاعدة البيانات...", flush=True)
    news_list = []
    try:
        news_list = sb.table("company_news").select("*").execute().data or []
        cairo_tz = pytz.timezone('Africa/Cairo')
        for n in news_list:
            n['dt'] = datetime.datetime.fromisoformat(n['published_at']).astimezone(cairo_tz)
    except Exception as e:
        print(f"Error fetching news: {e}", flush=True)

    print("حساب مؤشرات المشاعر المتقدمة وتجنب Look-ahead Bias...", flush=True)
    company_day_sentiment, company_day_sensitivity, sector_day_sentiment, macro_day_scores = \
        precompute_sentiment_features(companies, all_candles_by_co, news_list)

    print("حساب حجم التداول النسبي لكل قطاع (Sector-Relative Volume)...", flush=True)
    sector_relative_volume_lookup = precompute_sector_relative_volumes(companies, all_candles_by_co)

    X_rows, y_rows = [], []

    for co in companies:
        cid, sym = co['id'], co['symbol']
        candles = all_candles_by_co.get(cid, [])
        if len(candles) < 60:
            continue

        features = calc_features(
            candles, 
            company_id=cid, 
            company_sector=co.get('sector'),
            company_day_sentiment=company_day_sentiment,
            company_day_sensitivity=company_day_sensitivity,
            sector_day_sentiment=sector_day_sentiment,
            macro_day_scores=macro_day_scores,
            sector_relative_volume_lookup=sector_relative_volume_lookup
        )
        closes   = [c['close'] for c in candles]
        highs    = [c['high']  for c in candles]
        lows     = [c['low']   for c in candles]

        for f in features:
            i = f['idx']
            if i + lookahead >= len(candles):
                continue

            entry = closes[i]
            tp    = entry * (1 + tp_pct)
            sl    = entry * (1 - tp_pct)

            future_h = highs[i+1:i+lookahead+1]
            future_l = lows[i+1:i+lookahead+1]

            hit_tp = any(h >= tp for h in future_h)
            hit_sl = any(l <= sl for l in future_l)

            if not hit_tp and not hit_sl:
                continue

            label = 1 if hit_tp else 0

            feat_row = [
                f['rsi'], f['macd_hist'], f['macd_raw'],
                f['dist_ema20'], f['dist_ema50'],
                f['atr_pct'], f['vol_ratio'], f['price_pos'],
                f['bb_width'], f['bb_pos'],
                f['stoch_rsi'], f['vol_spike'],
                f['dist_ath'], f['day_of_week'],
                f['market_regime'],
                f['news_sentiment_score'],
                f['sector_sentiment_score'],
                f['macro_fx_score'],
                f['macro_rate_score'],
                f['macro_geo_score'],
                f['stock_sentiment_sensitivity'],
                f['sector_relative_volume'],
            ]
            if timeframe == '1d':
                fund = fundamentals_lookup.get(cid, {})
                pe = float(fund.get('pe_ratio') or 0.0)
                eps = float(fund.get('eps') or 0.0)
                de = float(fund.get('debt_equity') or 0.0)
                pm = float(fund.get('profit_margin') or 0.0)
                rev_g = float(fund.get('revenue_growth') or 0.0)
                earn_g = float(fund.get('earnings_growth') or 0.0)
                div_y = float(fund.get('dividend_yield') or 0.0)
                fv = float(fund.get('fair_value') or 0.0)
                fv_ratio = closes[i] / fv if fv > 0 else 1.0
                
                feat_row.extend([pe, eps, de, pm, rev_g, earn_g, div_y, fv_ratio])
                
            X_rows.append(feat_row)
            y_rows.append(label)

    return np.array(X_rows), np.array(y_rows)

# ── التدريب ─────────────────────────────

CONFIGS = {
    '1d':  {'tp': 0.035, 'look': 30},
    '15m': {'tp': 0.015, 'look': 20},
    '1h':  {'tp': 0.020, 'look': 20},
    '4h':  {'tp': 0.025, 'look': 20},
}

if __name__ == '__main__':
    os.makedirs('models', exist_ok=True)

    for tf, cfg in CONFIGS.items():
        print(f"\n══ تدريب نموذج {tf} ══", flush=True)
        X, y = build_dataset(tf, cfg['tp'], cfg['look'])

        if len(X) < 100:
            print(f"  بيانات غير كافية ({len(X)}), تخطي", flush=True)
            continue

        print(f"  Dataset: {len(X)} إشارة "
              f"| إيجابية: {y.sum()} "
              f"| سلبية: {len(y)-y.sum()}", flush=True)

        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        model = XGBClassifier(
            n_estimators=200,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            eval_metric='logloss',
            random_state=42
        )

        scores = cross_val_score(
            model, X_scaled, y,
            cv=5, scoring='roc_auc'
        )
        auc_a = scores.mean()
        print(f"  Cross-val AUC: {auc_a:.3f} (±{scores.std():.3f})", flush=True)

        # ── مقارنة الخيار أ والخيار ب (A/B testing mode) ──
        print("  --- مقارنة أداء نموذج شامل (الخيار أ) ونموذجين منفصلين (الخيار ب) ---", flush=True)
        regimes = X[:, 14]
        trend_idx = np.where((regimes == 1.0) | (regimes == -1.0))[0]
        range_idx = np.where(regimes == 0.0)[0]

        X_trend, y_trend = X[trend_idx], y[trend_idx]
        X_range, y_range = X[range_idx], y[range_idx]

        def eval_submodel(X_sub, y_sub):
            if len(X_sub) < 50 or len(np.unique(y_sub)) < 2:
                return None
            scaler_sub = StandardScaler()
            X_sub_scaled = scaler_sub.fit_transform(X_sub)
            model_sub = XGBClassifier(
                n_estimators=200,
                max_depth=4,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                eval_metric='logloss',
                random_state=42
            )
            try:
                sub_scores = cross_val_score(model_sub, X_sub_scaled, y_sub, cv=5, scoring='roc_auc')
                return sub_scores.mean()
            except:
                return None

        auc_trend = eval_submodel(X_trend, y_trend)
        auc_range = eval_submodel(X_range, y_range)
        weight_trend, weight_range = len(X_trend), len(X_range)

        if auc_trend is not None and auc_range is not None:
            auc_b = (auc_trend * weight_trend + auc_range * weight_range) / (weight_trend + weight_range)
            print(f"  [الخيار أ] Cross-val AUC (شامل - 21 ميزة): {auc_a:.3f}", flush=True)
            print(f"  [الخيار ب] Cross-val AUC (منفصلين): {auc_b:.3f} (Trending AUC: {auc_trend:.3f}, Range AUC: {auc_range:.3f})", flush=True)
            if auc_a >= auc_b:
                print(f"  🏆 النتيجة: الخيار أ أفضل بفرق {auc_a - auc_b:.4f}", flush=True)
            else:
                print(f"  🏆 النتيجة: الخيار ب أفضل بفرق {auc_b - auc_a:.4f}", flush=True)
        else:
            print("  ⚠️ عينات غير كافية لتدريب الخيار ب بالكامل للمقارنة المعيارية.", flush=True)

        model.fit(X_scaled, y)

        joblib.dump(model,  f'models/model_{tf}.pkl')
        joblib.dump(scaler, f'models/scaler_{tf}.pkl')
        print(f"  ✅ تم الحفظ: models/model_{tf}.pkl", flush=True)

    print("\n✅ كل النماذج اتدربت!", flush=True)
