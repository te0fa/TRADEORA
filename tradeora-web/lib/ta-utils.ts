// @ts-ignore
import { SMA, EMA, RSI, MACD, BollingerBands, ADX } from 'technicalindicators';

export function calcSMA(closes: number[], period: number): (number | null)[] {
  if (closes.length < period) {
    return Array(closes.length).fill(null);
  }
  try {
    const result = SMA.calculate({ period, values: closes });
    const diff = closes.length - result.length;
    const mapped = result.map((v: any) => (v !== undefined && !isNaN(v) && isFinite(v)) ? v : null);
    return Array(diff).fill(null).concat(mapped);
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
    const mapped = result.map((v: any) => (v !== undefined && !isNaN(v) && isFinite(v)) ? v : null);
    return Array(diff).fill(null).concat(mapped);
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
    const mapped = result.map((v: any) => (v !== undefined && !isNaN(v) && isFinite(v)) ? v : null);
    return Array(diff).fill(null).concat(mapped);
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

export function scoreRSI(rsi: number): number {
  if (rsi > 65)  return 2;   // overbought caution
  if (rsi > 55)  return 1;   // bullish
  if (rsi >= 45) return 0;   // neutral
  if (rsi >= 30) return -1;  // bearish
  return -2;                  // oversold (reversal potential)
}

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

  const rsiScore = scoreRSI(lastRSI);
  const bullScore =
    (rsiScore > 0 ? 1 : 0) +
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
  isStrong?: boolean;
  isWeekly?: boolean;
}

export function detectSRLevels(
  candles: { high: number; low: number; close: number }[],
  currentPrice: number,
  tolerance = 0.015,  // 1.5% tolerance
  maxLevels = 5,
  weeklyLevels?: SRLevel[]
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
  const mappedLevels = Array.from(levels.entries())
    .filter(([price]) =>
      Math.abs(price - currentPrice) / currentPrice < 0.15
    )
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, maxLevels)
    .map(([price, data]) => {
      const distance = (price - currentPrice) / currentPrice * 100;
      const baseLevel: SRLevel = {
        price,
        type:     price > currentPrice ? 'resistance' : 'support',
        strength: data.count,
        distance
      };

      if (weeklyLevels && weeklyLevels.length > 0) {
        const hasWeeklyConfluence = weeklyLevels.some(wl => Math.abs(wl.price - price) / price <= 0.02);
        if (hasWeeklyConfluence) {
          baseLevel.isStrong = true;
        }
      }

      return baseLevel;
    })
    .sort((a, b) => Math.abs(a.distance) - Math.abs(b.distance));

  return mappedLevels;
}

export function calcMarketRegime(highs: number[], lows: number[], closes: number[], period = 14): number[] {
  if (closes.length < period * 2) return Array(closes.length).fill(0);
  try {
    const adxResult = ADX.calculate({ period, close: closes, high: highs, low: lows });
    const diff = closes.length - adxResult.length;
    const padding = Array(diff).fill(0);
    const mapped = adxResult.map(item => {
      const adx = item.adx ?? 0;
      const pdi = item.pdi ?? 0;
      const mdi = item.mdi ?? 0;
      if (adx > 25) {
        return pdi > mdi ? 1 : -1;
      }
      return 0;
    });
    return padding.concat(mapped);
  } catch (e) {
    return Array(closes.length).fill(0);
  }
}

// ══════════════════════════════════════════════════════════════════
// ADVANCED ANALYSIS: SMC / ICT / Elliott / Wyckoff / Channels
// ══════════════════════════════════════════════════════════════════

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  time?: string | number;
}

// ── SMC / ICT ────────────────────────────────────────────────────

export interface OrderBlock {
  type: 'bullish' | 'bearish';
  high: number;
  low: number;
  midpoint: number;
  index: number;          // candle index in array
  time?: string | number;
  strength: 'strong' | 'weak';
  labelAr: string;
  labelEn: string;
}

export interface FairValueGap {
  type: 'bullish' | 'bearish';  // bullish FVG = gap above, price should fill from below
  gapHigh: number;
  gapLow: number;
  midpoint: number;
  index: number;
  time?: string | number;
  labelAr: string;
  labelEn: string;
}

export interface LiquidityZone {
  type: 'sellside' | 'buyside';   // sellside = below lows, buyside = above highs
  price: number;
  strength: number;               // how many times swept
  index: number;
  time?: string | number;
  labelAr: string;
  labelEn: string;
}

/**
 * Detect Order Blocks (OB) — SMC / ICT concept
 * Bullish OB: Last bearish candle before a strong bullish impulse
 * Bearish OB: Last bullish candle before a strong bearish impulse
 */
export function detectOrderBlocks(candles: Candle[], lookback = 50): OrderBlock[] {
  const n = candles.length;
  if (n < 5) return [];

  const results: OrderBlock[] = [];
  const start = Math.max(0, n - lookback);

  for (let i = start; i < n - 3; i++) {
    const c = candles[i];
    const bodySize = Math.abs(c.close - c.open);
    const range = c.high - c.low;
    if (range === 0) continue;

    // Look for impulse move after this candle
    const nextThree = candles.slice(i + 1, i + 4);
    const impulseUp   = nextThree.every(x => x.close > x.open) &&
                        nextThree.reduce((acc, x) => acc + (x.close - x.open), 0) > bodySize * 1.5;
    const impulseDown = nextThree.every(x => x.close < x.open) &&
                        nextThree.reduce((acc, x) => acc + (x.open - x.close), 0) > bodySize * 1.5;

    // Bullish OB: current candle is bearish and followed by strong bullish impulse
    if (c.close < c.open && impulseUp) {
      results.push({
        type: 'bullish',
        high: c.high,
        low: c.low,
        midpoint: (c.high + c.low) / 2,
        index: i,
        time: c.time,
        strength: bodySize / range > 0.6 ? 'strong' : 'weak',
        labelAr: 'Order Block صاعد (OB)',
        labelEn: 'Bullish Order Block (OB)',
      });
    }

    // Bearish OB: current candle is bullish and followed by strong bearish impulse
    if (c.close > c.open && impulseDown) {
      results.push({
        type: 'bearish',
        high: c.high,
        low: c.low,
        midpoint: (c.high + c.low) / 2,
        index: i,
        time: c.time,
        strength: bodySize / range > 0.6 ? 'strong' : 'weak',
        labelAr: 'Order Block هابط (OB)',
        labelEn: 'Bearish Order Block (OB)',
      });
    }
  }

  // Return last 5 order blocks (most recent)
  return results.slice(-5);
}

/**
 * Detect Fair Value Gaps (FVG) — SMC / ICT concept
 * Bullish FVG: candle[i].high < candle[i+2].low  → gap between wick[i] and wick[i+2]
 * Bearish FVG: candle[i].low  > candle[i+2].high → gap above
 */
export function detectFairValueGaps(candles: Candle[], lookback = 60): FairValueGap[] {
  const n = candles.length;
  if (n < 3) return [];

  const results: FairValueGap[] = [];
  const start = Math.max(0, n - lookback);

  for (let i = start; i < n - 2; i++) {
    const c0 = candles[i];
    const c2 = candles[i + 2];

    // Bullish FVG: gap between candle[i].high and candle[i+2].low
    if (c0.high < c2.low) {
      const gapSize = c2.low - c0.high;
      const avgRange = (c0.high - c0.low + (candles[i+1].high - candles[i+1].low) + (c2.high - c2.low)) / 3;
      if (gapSize > avgRange * 0.3) { // Minimum gap size filter
        results.push({
          type: 'bullish',
          gapHigh: c2.low,
          gapLow: c0.high,
          midpoint: (c0.high + c2.low) / 2,
          index: i + 1,
          time: candles[i + 1].time,
          labelAr: 'فجوة قيمة عادلة صاعدة (FVG)',
          labelEn: 'Bullish Fair Value Gap (FVG)',
        });
      }
    }

    // Bearish FVG: gap between candle[i].low and candle[i+2].high
    if (c0.low > c2.high) {
      const gapSize = c0.low - c2.high;
      const avgRange = (c0.high - c0.low + (candles[i+1].high - candles[i+1].low) + (c2.high - c2.low)) / 3;
      if (gapSize > avgRange * 0.3) {
        results.push({
          type: 'bearish',
          gapHigh: c0.low,
          gapLow: c2.high,
          midpoint: (c0.low + c2.high) / 2,
          index: i + 1,
          time: candles[i + 1].time,
          labelAr: 'فجوة قيمة عادلة هابطة (FVG)',
          labelEn: 'Bearish Fair Value Gap (FVG)',
        });
      }
    }
  }

  // Return last 6 FVGs
  return results.slice(-6);
}

/**
 * Detect Liquidity Zones — swing highs (buyside) and swing lows (sellside)
 * These are areas where stop losses cluster
 */
export function detectLiquidityZones(candles: Candle[], lookback = 100): LiquidityZone[] {
  const n = candles.length;
  if (n < 5) return [];

  const results: LiquidityZone[] = [];
  const start = Math.max(2, n - lookback);

  for (let i = start; i < n - 2; i++) {
    const c = candles[i];

    // Swing High (Buyside Liquidity — sell stops above)
    if (c.high > candles[i-1].high && c.high > candles[i-2].high &&
        c.high > candles[i+1].high && c.high > candles[i+2].high) {
      // Check how many times this level was approached
      const touchCount = candles.slice(i + 1).filter(x =>
        Math.abs(x.high - c.high) / c.high < 0.005
      ).length;

      results.push({
        type: 'buyside',
        price: c.high,
        strength: Math.min(touchCount + 1, 5),
        index: i,
        time: c.time,
        labelAr: `سيولة فوقية (Buyside Liq.) ${touchCount > 0 ? `— اختُرقت ${touchCount} مرة` : ''}`,
        labelEn: `Buyside Liquidity${touchCount > 0 ? ` — swept ${touchCount}x` : ''}`,
      });
    }

    // Swing Low (Sellside Liquidity — buy stops below)
    if (c.low < candles[i-1].low && c.low < candles[i-2].low &&
        c.low < candles[i+1].low && c.low < candles[i+2].low) {
      const touchCount = candles.slice(i + 1).filter(x =>
        Math.abs(x.low - c.low) / c.low < 0.005
      ).length;

      results.push({
        type: 'sellside',
        price: c.low,
        strength: Math.min(touchCount + 1, 5),
        index: i,
        time: c.time,
        labelAr: `سيولة تحتية (Sellside Liq.) ${touchCount > 0 ? `— اختُرقت ${touchCount} مرة` : ''}`,
        labelEn: `Sellside Liquidity${touchCount > 0 ? ` — swept ${touchCount}x` : ''}`,
      });
    }
  }

  // Return last 8 zones, sorted by strength
  return results
    .slice(-20)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 8);
}


// ── Elliott Wave Detection ────────────────────────────────────────

export interface ElliottWavePoint {
  index: number;
  price: number;
  label: string;    // '1', '2', '3', '4', '5', 'A', 'B', 'C'
  type: 'peak' | 'trough';
  time?: string | number;
  labelAr: string;
}

/**
 * Detect Elliott Wave structure using ZigZag pivot detection
 * Returns up to 9 wave points (5 impulse + 3 corrective minimum)
 */
export function detectElliottWaves(candles: Candle[], deviation = 0.05): ElliottWavePoint[] {
  const n = candles.length;
  if (n < 20) return [];

  // Step 1: ZigZag pivot detection
  const pivots: { index: number; price: number; type: 'peak' | 'trough' }[] = [];
  const lookback = Math.max(3, Math.floor(n / 20));

  for (let i = lookback; i < n - lookback; i++) {
    const slice = candles.slice(i - lookback, i + lookback + 1);
    const maxH = Math.max(...slice.map(c => c.high));
    const minL = Math.min(...slice.map(c => c.low));

    if (candles[i].high === maxH && (pivots.length === 0 || pivots[pivots.length - 1].type !== 'peak')) {
      pivots.push({ index: i, price: candles[i].high, type: 'peak' });
    } else if (candles[i].low === minL && (pivots.length === 0 || pivots[pivots.length - 1].type !== 'trough')) {
      pivots.push({ index: i, price: candles[i].low, type: 'trough' });
    }
  }

  // Step 2: Filter by minimum deviation
  const filtered: typeof pivots = [];
  for (const p of pivots) {
    if (filtered.length === 0) {
      filtered.push(p);
      continue;
    }
    const last = filtered[filtered.length - 1];
    const change = Math.abs(p.price - last.price) / last.price;
    if (change >= deviation && p.type !== last.type) {
      filtered.push(p);
    } else if (p.type === last.type) {
      // Replace with more extreme pivot of same type
      if (p.type === 'peak' && p.price > last.price) filtered[filtered.length - 1] = p;
      if (p.type === 'trough' && p.price < last.price) filtered[filtered.length - 1] = p;
    }
  }

  // Step 3: Label last 9 pivots as Elliott Wave structure
  const recent = filtered.slice(-9);
  const impulseLabels = ['1', '2', '3', '4', '5', 'A', 'B', 'C'];
  const impulseLabelsAr = ['موجة 1', 'موجة 2', 'موجة 3', 'موجة 4', 'موجة 5', 'موجة A', 'موجة B', 'موجة C'];

  return recent.map((p, idx) => ({
    index: p.index,
    price: p.price,
    label: impulseLabels[idx] ?? `W${idx + 1}`,
    labelAr: impulseLabelsAr[idx] ?? `موجة ${idx + 1}`,
    type: p.type,
    time: candles[p.index]?.time,
  }));
}


// ── Trend Channels ───────────────────────────────────────────────

export interface TrendChannel {
  direction: 'ascending' | 'descending' | 'sideways';
  upperLine: { startPrice: number; endPrice: number; startIndex: number; endIndex: number };
  lowerLine: { startPrice: number; endPrice: number; startIndex: number; endIndex: number };
  width: number;       // channel width as % of price
  isBreakout: boolean; // has price broken out of channel?
  breakoutDirection?: 'up' | 'down';
  labelAr: string;
  labelEn: string;
}

/**
 * Detect main trend channel using linear regression on highs and lows
 */
export function detectTrendChannel(candles: Candle[], period = 50): TrendChannel | null {
  const n = candles.length;
  if (n < 10) return null;

  const slice = candles.slice(Math.max(0, n - period));
  const len = slice.length;

  // Linear regression on highs and lows
  function linReg(values: number[]): { slope: number; intercept: number } {
    const m = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    values.forEach((y, x) => {
      sumX += x; sumY += y;
      sumXY += x * y; sumX2 += x * x;
    });
    const slope = (m * sumXY - sumX * sumY) / (m * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / m;
    return { slope, intercept };
  }

  const highs  = slice.map(c => c.high);
  const lows   = slice.map(c => c.low);
  const closes = slice.map(c => c.close);

  const highReg = linReg(highs);
  const lowReg  = linReg(lows);

  const upperStart = highReg.intercept;
  const upperEnd   = highReg.slope * (len - 1) + highReg.intercept;
  const lowerStart = lowReg.intercept;
  const lowerEnd   = lowReg.slope * (len - 1) + lowReg.intercept;

  const slopePct = Math.abs(highReg.slope) / (closes[0] || 1) * 100;
  let direction: 'ascending' | 'descending' | 'sideways';
  if (Math.abs(slopePct) < 0.05) direction = 'sideways';
  else if (highReg.slope > 0) direction = 'ascending';
  else direction = 'descending';

  // Check for breakout (last candle outside channel)
  const lastCandle = slice[len - 1];
  const currentUpper = upperEnd;
  const currentLower = lowerEnd;
  const isBreakout = lastCandle.close > currentUpper * 1.005 || lastCandle.close < currentLower * 0.995;
  const breakoutDirection = lastCandle.close > currentUpper * 1.005 ? 'up' :
                             lastCandle.close < currentLower * 0.995 ? 'down' : undefined;

  const channelWidth = ((currentUpper - currentLower) / currentLower) * 100;

  return {
    direction,
    upperLine: {
      startPrice: upperStart,
      endPrice: upperEnd,
      startIndex: Math.max(0, n - period),
      endIndex: n - 1,
    },
    lowerLine: {
      startPrice: lowerStart,
      endPrice: lowerEnd,
      startIndex: Math.max(0, n - period),
      endIndex: n - 1,
    },
    width: channelWidth,
    isBreakout,
    breakoutDirection,
    labelAr: direction === 'ascending' ? 'قناة صاعدة 📈' :
              direction === 'descending' ? 'قناة هابطة 📉' : 'قناة عرضية ↔️',
    labelEn: direction === 'ascending' ? 'Ascending Channel 📈' :
              direction === 'descending' ? 'Descending Channel 📉' : 'Sideways Channel ↔️',
  };
}


// ── Wyckoff Structure Detection ──────────────────────────────────

export interface WyckoffStructure {
  phase: 'accumulation' | 'markup' | 'distribution' | 'markdown' | 'reaccumulation' | 'unknown';
  spring?: { index: number; price: number; time?: string | number };    // Spring = false breakout below support
  upthrust?: { index: number; price: number; time?: string | number };  // Upthrust = false breakout above resistance
  supportLine: number;
  resistanceLine: number;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  descriptionEn: string;
}

/**
 * Detect Wyckoff structure phases
 * Identifies accumulation/distribution ranges and key events (Spring, Upthrust)
 */
export function detectWyckoffStructure(candles: Candle[], period = 60): WyckoffStructure {
  const n = candles.length;
  const slice = candles.slice(Math.max(0, n - period));
  const len = slice.length;

  // Find trading range (support and resistance)
  const highs  = slice.map(c => c.high);
  const lows   = slice.map(c => c.low);
  const closes = slice.map(c => c.close);

  const rangeHigh = Math.max(...highs);
  const rangeLow  = Math.min(...lows);
  const rangeWidth = (rangeHigh - rangeLow) / rangeLow;

  // Check if we're in a trading range (< 20% width)
  const isInRange = rangeWidth < 0.20;

  // Volume trend (increasing = accumulation, decreasing = distribution)
  const volumes = slice.map(c => c.volume ?? 0);
  const earlyVol = volumes.slice(0, Math.floor(len / 2)).reduce((a, b) => a + b, 0);
  const lateVol  = volumes.slice(Math.floor(len / 2)).reduce((a, b) => a + b, 0);

  // Spring detection: brief dip below support with quick recovery
  let spring: WyckoffStructure['spring'];
  let upthrust: WyckoffStructure['upthrust'];

  const support    = rangeLow * 1.005;   // 0.5% tolerance
  const resistance = rangeHigh * 0.995;  // 0.5% tolerance

  // Look for Spring (false break below support)
  for (let i = Math.floor(len * 0.5); i < len - 2; i++) {
    const c  = slice[i];
    const c1 = slice[i + 1];
    if (c.low < support * 0.99 && c1.close > support) {
      spring = { index: i, price: c.low, time: c.time };
      break;
    }
  }

  // Look for Upthrust (false break above resistance)
  for (let i = Math.floor(len * 0.5); i < len - 2; i++) {
    const c  = slice[i];
    const c1 = slice[i + 1];
    if (c.high > resistance * 1.01 && c1.close < resistance) {
      upthrust = { index: i, price: c.high, time: c.time };
      break;
    }
  }

  // Determine phase
  const currentPrice = closes[len - 1];
  const isRising = closes.slice(-5).every((v, i, arr) => i === 0 || v >= arr[i - 1]);
  const isFalling = closes.slice(-5).every((v, i, arr) => i === 0 || v <= arr[i - 1]);
  const isNearBottom = currentPrice < rangeLow + (rangeHigh - rangeLow) * 0.35;
  const isNearTop    = currentPrice > rangeLow + (rangeHigh - rangeLow) * 0.65;

  let phase: WyckoffStructure['phase'];
  if (!isInRange && isRising)  phase = 'markup';
  else if (!isInRange && isFalling) phase = 'markdown';
  else if (isInRange && isNearBottom && lateVol > earlyVol) phase = 'accumulation';
  else if (isInRange && isNearTop    && lateVol > earlyVol) phase = 'distribution';
  else if (isInRange && isRising && lateVol > earlyVol) phase = 'reaccumulation';
  else phase = 'unknown';

  const phaseLabels: Record<WyckoffStructure['phase'], { ar: string; en: string; descAr: string; descEn: string }> = {
    accumulation:   { ar: 'تجميع (Accumulation) 🟢', en: 'Accumulation 🟢', descAr: 'المؤسسات تتجمع في نطاق أفقي — الاختراق الصاعد وشيك', descEn: 'Institutions accumulating in sideways range — upward breakout imminent' },
    markup:         { ar: 'صعود (Markup) 📈', en: 'Markup 📈', descAr: 'مرحلة الصعود القوي — الترند صاعد والزخم قوي', descEn: 'Strong uptrend phase — momentum is bullish' },
    distribution:   { ar: 'توزيع (Distribution) 🔴', en: 'Distribution 🔴', descAr: 'المؤسسات تبيع في نطاق أفقي — الاختراق الهابط وشيك', descEn: 'Institutions distributing — downward breakout imminent' },
    markdown:       { ar: 'هبوط (Markdown) 📉', en: 'Markdown 📉', descAr: 'مرحلة الهبوط القوي — الضغط البيعي سائد', descEn: 'Strong downtrend phase — selling pressure dominates' },
    reaccumulation: { ar: 'إعادة تجميع (Re-accumulation) 🔄', en: 'Re-accumulation 🔄', descAr: 'استراحة في اتجاه صاعد — تجميع ثانوي قبل موجة صعود جديدة', descEn: 'Pause in uptrend — secondary accumulation before next up-leg' },
    unknown:        { ar: 'غير محدد ⚖️', en: 'Indeterminate ⚖️', descAr: 'لا هيكل وايكوف واضح في البيانات الحالية', descEn: 'No clear Wyckoff structure in current data' },
  };

  return {
    phase,
    spring,
    upthrust,
    supportLine: rangeLow,
    resistanceLine: rangeHigh,
    labelAr: phaseLabels[phase].ar,
    labelEn: phaseLabels[phase].en,
    descriptionAr: phaseLabels[phase].descAr,
    descriptionEn: phaseLabels[phase].descEn,
  };
}
