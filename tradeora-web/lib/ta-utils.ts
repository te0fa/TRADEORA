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

  console.log(`calcSupportResistance: scanned last ${actualLookback} candles. Found ${supportCandidates.length} swing lows and ${resistanceCandidates.length} swing highs.`);

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
