// @ts-ignore
import { SMA, EMA, RSI, MACD, BollingerBands } from 'technicalindicators';

export function calcSMA(closes: number[], period: number): (number | null)[] {
  if (closes.length < period) {
    return Array(closes.length).fill(null);
  }
  try {
    const result = SMA.calculate({ period, values: closes });
    const diff = closes.length - result.length;
    return Array(diff).fill(null).concat(result);
  } catch (e) {
    console.error('Error calculating SMA:', e);
    return Array(closes.length).fill(null);
  }
}

export function calcEMA(closes: number[], period: number): (number | null)[] {
  if (closes.length < period) {
    return Array(closes.length).fill(null);
  }
  try {
    const result = EMA.calculate({ period, values: closes });
    const diff = closes.length - result.length;
    return Array(diff).fill(null).concat(result);
  } catch (e) {
    console.error('Error calculating EMA:', e);
    return Array(closes.length).fill(null);
  }
}

export function calcRSI(closes: number[], period = 14): (number | null)[] {
  if (closes.length < period) {
    return Array(closes.length).fill(null);
  }
  try {
    const result = RSI.calculate({ period, values: closes });
    const diff = closes.length - result.length;
    return Array(diff).fill(null).concat(result);
  } catch (e) {
    console.error('Error calculating RSI:', e);
    return Array(closes.length).fill(null);
  }
}

export function calcMACD(closes: number[]): { macd: number | null; signal: number | null; histogram: number | null }[] {
  if (closes.length < 26) {
    return Array(closes.length).fill(null).map(() => ({ macd: null, signal: null, histogram: null }));
  }
  try {
    const result = MACD.calculate({
      values: closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false
    });
    
    const diff = closes.length - result.length;
    const padding = Array(diff).fill(null).map(() => ({ macd: null, signal: null, histogram: null }));
    const mapped = result.map((item: any) => ({
      macd: item.MACD !== undefined && !isNaN(item.MACD) ? item.MACD : null,
      signal: item.signal !== undefined && !isNaN(item.signal) ? item.signal : null,
      histogram: item.histogram !== undefined && !isNaN(item.histogram) ? item.histogram : null
    }));
    return padding.concat(mapped);
  } catch (e) {
    console.error('Error calculating MACD:', e);
    return Array(closes.length).fill(null).map(() => ({ macd: null, signal: null, histogram: null }));
  }
}

export function calcBollingerBands(
  closes: number[], 
  period = 20, 
  std = 2
): { upper: number | null; middle: number | null; lower: number | null }[] {
  if (closes.length < period) {
    return Array(closes.length).fill(null).map(() => ({ upper: null, middle: null, lower: null }));
  }
  try {
    const result = BollingerBands.calculate({ period, values: closes, stdDev: std });
    const diff = closes.length - result.length;
    const padding = Array(diff).fill(null).map(() => ({ upper: null, middle: null, lower: null }));
    const mapped = result.map((item: any) => ({
      upper: item.upper !== undefined && !isNaN(item.upper) ? item.upper : null,
      middle: item.middle !== undefined && !isNaN(item.middle) ? item.middle : null,
      lower: item.lower !== undefined && !isNaN(item.lower) ? item.lower : null
    }));
    return padding.concat(mapped);
  } catch (e) {
    console.error('Error calculating Bollinger Bands:', e);
    return Array(closes.length).fill(null).map(() => ({ upper: null, middle: null, lower: null }));
  }
}

// Support & Resistance
export function calcSupportResistance(
  highs: number[], 
  lows: number[], 
  closes: number[],
  lookback = 20,       // عدد الشموع للبحث
  sensitivity = 0.02   // نسبة التقارب لدمج المستويات (2%)
): {
  supports: { price: number; strength: number }[];
  resistances: { price: number; strength: number }[];
} {
  const len = closes.length;
  if (len < 10) {
    return { supports: [], resistances: [] };
  }

  const actualLookback = Math.min(lookback, len);
  const scanStart = Math.max(1, len - actualLookback);
  const scanEnd = len - 2;

  const supportCandidates: number[] = [];
  const resistanceCandidates: number[] = [];

  // Find swing points
  for (let i = scanStart; i <= scanEnd; i++) {
    if (lows[i] < lows[i - 1] && lows[i] < lows[i + 1]) {
      supportCandidates.push(lows[i]);
    }
    if (highs[i] > highs[i - 1] && highs[i] > highs[i + 1]) {
      resistanceCandidates.push(highs[i]);
    }
  }

  console.debug(`calcSupportResistance: scanned last ${actualLookback} candles. Found ${supportCandidates.length} swing lows and ${resistanceCandidates.length} swing highs.`);

  // Helper function to cluster levels
  function cluster(prices: number[]): { price: number; strength: number }[] {
    if (prices.length === 0) return [];
    
    // Sort ascending
    const sorted = [...prices].sort((a, b) => a - b);
    const clusters: { price: number; strength: number }[] = [];
    
    let currentCluster: number[] = [sorted[0]];
    
    for (let i = 1; i < sorted.length; i++) {
      const p = sorted[i];
      const base = currentCluster[0];
      
      // If within sensitivity, add to current cluster
      if ((p - base) / base <= sensitivity) {
        currentCluster.push(p);
      } else {
        // Close current cluster, start new one
        const avg = currentCluster.reduce((sum, val) => sum + val, 0) / currentCluster.length;
        clusters.push({ price: avg, strength: currentCluster.length });
        currentCluster = [p];
      }
    }
    
    // Push the last cluster
    if (currentCluster.length > 0) {
      const avg = currentCluster.reduce((sum, val) => sum + val, 0) / currentCluster.length;
      clusters.push({ price: avg, strength: currentCluster.length });
    }
    
    return clusters;
  }

  // Cluster support and resistance levels
  const clusteredSupports = cluster(supportCandidates);
  const clusteredResistances = cluster(resistanceCandidates);

  // Sort by strength descending, then take top 3
  const supports = clusteredSupports
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3);

  const resistances = clusteredResistances
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3);

  return { supports, resistances };
}

export function calcATR(candles: { high?: number; low?: number; close: number }[], period = 14): number[] {
  if (candles.length < 2) return Array(candles.length).fill(0);
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high ?? candles[i].close;
    const low  = candles[i].low ?? candles[i].close;
    const prevClose = candles[i-1].close;
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low  - prevClose)
    );
    trs.push(tr);
  }
  const atrs: number[] = [0];
  for (let i = 0; i < trs.length; i++) {
    if (i < period - 1) { atrs.push(0); continue; }
    const slice = trs.slice(i - period + 1, i + 1);
    atrs.push(slice.reduce((a, b) => a + b, 0) / period);
  }
  return atrs;
}

// ══ Volume Score ══════════════════════
export function calcVolumeScore(
  candles: { volume: number }[],
  period = 14
): 'strong' | 'normal' | 'weak' | null {
  if (candles.length < period + 1) return null;
  const recent = candles[candles.length - 1].volume;
  const avg = candles
    .slice(-period - 1, -1)
    .reduce((s, c) => s + (c.volume || 0), 0) / period;
  if (!avg || avg === 0) return null;
  const ratio = recent / avg;
  if (ratio >= 2)   return 'strong';
  if (ratio >= 0.7) return 'normal';
  return 'weak';
}

export function calcVolumeRatio(
  candles: { volume: number }[],
  period = 14
): number {
  if (candles.length < period + 1) return 1;
  const recent = candles[candles.length - 1].volume;
  const avg = candles
    .slice(-period - 1, -1)
    .reduce((s, c) => s + (c.volume || 0), 0) / period;
  return avg > 0 ? recent / avg : 1;
}

// ══ Candlestick Patterns ══════════════
export type CandlePattern =
  | 'hammer'
  | 'shooting_star'
  | 'bullish_engulfing'
  | 'bearish_engulfing'
  | 'doji'
  | 'morning_star'
  | 'evening_star'
  | null;

export function detectCandlePattern(
  candles: {
    open: number; close: number;
    high: number; low:  number
  }[]
): { pattern: CandlePattern; bullish: boolean | null } {
  if (candles.length < 3)
    return { pattern: null, bullish: null };

  const [c2, c1, c0] = candles.slice(-3);
  const body0  = Math.abs(c0.close - c0.open);
  const range0 = c0.high - c0.low;
  const body1  = Math.abs(c1.close - c1.open);

  // Doji
  if (range0 > 0 && body0 / range0 < 0.1)
    return { pattern: 'doji', bullish: null };

  // Hammer (شمعة صاعدة مع ذيل سفلي طويل)
  const lowerShadow0 =
    Math.min(c0.open, c0.close) - c0.low;
  const upperShadow0 =
    c0.high - Math.max(c0.open, c0.close);
  if (
    lowerShadow0 > body0 * 2 &&
    upperShadow0 < body0 * 0.5
  ) return { pattern: 'hammer', bullish: true };

  // Shooting Star (شمعة هابطة مع ذيل علوي طويل)
  if (
    upperShadow0 > body0 * 2 &&
    lowerShadow0 < body0 * 0.5
  ) return { pattern: 'shooting_star', bullish: false };

  // Bullish Engulfing
  if (
    c1.close < c1.open &&       // c1 هابطة
    c0.close > c0.open &&       // c0 صاعدة
    c0.open  <= c1.close &&
    c0.close >= c1.open &&
    body0 > body1
  ) return { pattern: 'bullish_engulfing', bullish: true };

  // Bearish Engulfing
  if (
    c1.close > c1.open &&       // c1 صاعدة
    c0.close < c0.open &&       // c0 هابطة
    c0.open  >= c1.close &&
    c0.close <= c1.open &&
    body0 > body1
  ) return { pattern: 'bearish_engulfing', bullish: false };

  // Morning Star
  if (
    c2.close < c2.open &&
    Math.abs(c1.close - c1.open) <
      Math.abs(c2.close - c2.open) * 0.3 &&
    c0.close > c0.open &&
    c0.close > (c2.open + c2.close) / 2
  ) return { pattern: 'morning_star', bullish: true };

  // Evening Star
  if (
    c2.close > c2.open &&
    Math.abs(c1.close - c1.open) <
      Math.abs(c2.close - c2.open) * 0.3 &&
    c0.close < c0.open &&
    c0.close < (c2.open + c2.close) / 2
  ) return { pattern: 'evening_star', bullish: false };

  return { pattern: null, bullish: null };
}

// ══ RSI Divergence ════════════════════
export function detectRSIDivergence(
  candles: { close: number; low: number; high: number }[],
  rsiValues: (number | null)[]
): 'bullish' | 'bearish' | null {
  const len = candles.length;
  if (len < 20) return null;

  // آخر 20 شمعة
  const window = 20;
  const priceSlice = candles.slice(-window);
  const rsiSlice   = rsiValues.slice(-window)
    .map(r => r ?? 50);

  // Bullish Divergence: سعر أخفض + RSI أعلى
  const firstLow  = priceSlice[0].low;
  const lastLow   = priceSlice[window - 1].low;
  const firstRSI  = rsiSlice[0];
  const lastRSI   = rsiSlice[window - 1];

  if (lastLow < firstLow * 0.99 &&
      lastRSI  > firstRSI + 3)
    return 'bullish';

  // Bearish Divergence: سعر أعلى + RSI أخفض
  const firstHigh = priceSlice[0].high;
  const lastHigh  = priceSlice[window - 1].high;

  if (lastHigh > firstHigh * 1.01 &&
      lastRSI  < firstRSI - 3)
    return 'bearish';

  return null;
}

// ══ Multi-Timeframe Score ═════════════
export type TFSignal = 'bullish' | 'bearish' | 'neutral';

export function calcTFSignal(
  candles: {
    close: number; open: number;
    high:  number; low:  number
  }[],
  rsi: (number | null)[]
): TFSignal {
  if (candles.length < 50) return 'neutral';
  const lastRSI   = rsi[rsi.length - 1] ?? 50;
  const lastClose = candles[candles.length - 1].close;
  const sma20 = candles
    .slice(-20)
    .reduce((s, c) => s + c.close, 0) / 20;
  const sma50 = candles
    .slice(-50)
    .reduce((s, c) => s + c.close, 0) / 50;

  const bullScore =
    (lastRSI > 50 ? 1 : 0) +
    (lastClose > sma20 ? 1 : 0) +
    (sma20 > sma50 ? 1 : 0);

  if (bullScore >= 2) return 'bullish';
  if (bullScore === 0) return 'bearish';
  return 'neutral';
}

export function calcPositionSize(
  capital: number,
  entryPrice: number,
  slPrice: number,
  riskPercent: number = 2
): {
  shares:     number;
  riskAmount: number;
  maxLoss:    number;
  riskRatio:  number;
} {
  const riskAmount = capital * (riskPercent / 100);
  const slDistance = Math.abs(entryPrice - slPrice);
  if (slDistance === 0)
    return { shares: 0, riskAmount: 0, maxLoss: 0, riskRatio: 0 };
  const shares     = Math.floor(riskAmount / slDistance);
  const maxLoss    = shares * slDistance;
  const riskRatio  = riskAmount / capital * 100;
  return { shares, riskAmount, maxLoss, riskRatio };
}

export interface SRLevel {
  price:    number;
  type:     'support' | 'resistance';
  strength: number;   // كمية الشموع اللي لمسته
  distance: number;   // % بُعده عن السعر الحالي
}

export function detectSRLevels(
  candles: { high: number; low: number; close: number }[],
  currentPrice: number,
  tolerance = 0.015,  // 1.5% tolerance
  maxLevels = 5
): SRLevel[] {
  if (candles.length < 20) return [];

  const levels: Map<number, {
    count: number; type: 'support' | 'resistance';
  }> = new Map();

  // نحسب Pivot Points لكل شمعة
  for (let i = 2; i < candles.length - 2; i++) {
    const c = candles[i];

    // Swing High (مقاومة)
    if (
      c.high > candles[i-1].high &&
      c.high > candles[i-2].high &&
      c.high > candles[i+1].high &&
      c.high > candles[i+2].high
    ) {
      // نشوف هل في مستوى قريب
      let merged = false;
      for (const [price, data] of levels.entries()) {
        if (Math.abs(price - c.high) / price < tolerance) {
          levels.set(price, {
            count: data.count + 1,
            type:  'resistance'
          });
          merged = true;
          break;
        }
      }
      if (!merged)
        levels.set(c.high, { count: 1, type: 'resistance' });
    }

    // Swing Low (دعم)
    if (
      c.low < candles[i-1].low &&
      c.low < candles[i-2].low &&
      c.low < candles[i+1].low &&
      c.low < candles[i+2].low
    ) {
      let merged = false;
      for (const [price, data] of levels.entries()) {
        if (Math.abs(price - c.low) / price < tolerance) {
          levels.set(price, {
            count: data.count + 1,
            type:  'support'
          });
          merged = true;
          break;
        }
      }
      if (!merged)
        levels.set(c.low, { count: 1, type: 'support' });
    }
  }

  // ترتيب حسب القوة وتصفية الأقرب للسعر
  return Array.from(levels.entries())
    .filter(([price]) =>
      Math.abs(price - currentPrice) / currentPrice < 0.15
    )
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, maxLevels)
    .map(([price, data]) => ({
      price,
      type:     data.type,
      strength: data.count,
      distance: (price - currentPrice) / currentPrice * 100
    }))
    .sort((a, b) => Math.abs(a.distance) - Math.abs(b.distance));
}
