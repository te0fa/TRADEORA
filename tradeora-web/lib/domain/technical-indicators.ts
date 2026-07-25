import { Decimal } from 'decimal.js';

// Enforce strict Decimal configuration (ROUND_HALF_UP)
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export interface IndicatorValue {
  symbol: string;
  timeframe: string;
  timestamp: string; // ISO 8601
  rsi?: string; // Decimal string
  macd?: {
    macdLine: string;
    signalLine: string;
    histogram: string;
  };
  bollingerBands?: {
    middleBand: string;
    upperBand: string;
    lowerBand: string;
    bandwidth: string;
  };
  adx?: {
    adx: string;
    plusDI: string;
    minusDI: string;
  };
  ichimoku?: {
    tenkanSen: string;
    kijunSen: string;
    senkouSpanA: string;
    senkouSpanB: string;
    chikouSpan: string;
  };
}

export interface PriceBar {
  high: Decimal;
  low: Decimal;
  close: Decimal;
  open: Decimal;
  timestamp?: string;
}

export class TechnicalIndicatorEvaluator {
  public static calculateRSI(prices: (string | number | Decimal)[], period = 14): Decimal {
    if (!prices || prices.length < period + 1) {
      throw new Error(`Insufficient price points for RSI calculation. Required: ${period + 1}, Provided: ${prices?.length || 0}`);
    }

    const decimals = prices.map((p) => new Decimal(p));
    let gains = new Decimal(0);
    let losses = new Decimal(0);

    for (let i = 1; i <= period; i++) {
      const change = decimals[i].minus(decimals[i - 1]);
      if (change.gt(0)) {
        gains = gains.plus(change);
      } else {
        losses = losses.plus(change.abs());
      }
    }

    let avgGain = gains.dividedBy(period);
    let avgLoss = losses.dividedBy(period);

    for (let i = period + 1; i < decimals.length; i++) {
      const change = decimals[i].minus(decimals[i - 1]);
      const currentGain = change.gt(0) ? change : new Decimal(0);
      const currentLoss = change.lt(0) ? change.abs() : new Decimal(0);

      avgGain = avgGain.times(period - 1).plus(currentGain).dividedBy(period);
      avgLoss = avgLoss.times(period - 1).plus(currentLoss).dividedBy(period);
    }

    if (avgLoss.isZero()) {
      return new Decimal(100);
    }

    const rs = avgGain.dividedBy(avgLoss);
    const rsi = new Decimal(100).minus(new Decimal(100).dividedBy(new Decimal(1).plus(rs)));
    return rsi;
  }

  public static calculateMACD(
    prices: (string | number | Decimal)[],
    fastPeriod = 12,
    slowPeriod = 26,
    signalPeriod = 9,
  ): { macdLine: Decimal; signalLine: Decimal; histogram: Decimal } {
    if (!prices || prices.length < slowPeriod + signalPeriod) {
      throw new Error(`Insufficient data points for MACD calculation. Required: ${slowPeriod + signalPeriod}`);
    }

    const decimals = prices.map((p) => new Decimal(p));

    const fastEMA = this.calculateEMAHistory(decimals, fastPeriod);
    const slowEMA = this.calculateEMAHistory(decimals, slowPeriod);

    const macdHistory: Decimal[] = [];
    for (let i = 0; i < slowEMA.length; i++) {
      const fastVal = fastEMA[i + (slowPeriod - fastPeriod)];
      const slowVal = slowEMA[i];
      macdHistory.push(fastVal.minus(slowVal));
    }

    const signalEMA = this.calculateEMAHistory(macdHistory, signalPeriod);

    const currentMACD = macdHistory[macdHistory.length - 1];
    const currentSignal = signalEMA[signalEMA.length - 1];
    const histogram = currentMACD.minus(currentSignal);

    return {
      macdLine: currentMACD,
      signalLine: currentSignal,
      histogram,
    };
  }

  public static calculateBollingerBands(
    prices: (string | number | Decimal)[],
    period = 20,
    multiplier = 2,
  ): { middleBand: Decimal; upperBand: Decimal; lowerBand: Decimal; bandwidth: Decimal } {
    if (!prices || prices.length < period) {
      throw new Error(`Insufficient data points for Bollinger Bands calculation. Required: ${period}`);
    }

    const decimals = prices.map((p) => new Decimal(p));
    const recent = decimals.slice(decimals.length - period);

    let sum = new Decimal(0);
    for (const p of recent) {
      sum = sum.plus(p);
    }
    const middleBand = sum.dividedBy(period);

    let varianceSum = new Decimal(0);
    for (const p of recent) {
      const diff = p.minus(middleBand);
      varianceSum = varianceSum.plus(diff.times(diff));
    }
    const variance = varianceSum.dividedBy(period);
    const stdDev = variance.sqrt();

    const multDec = new Decimal(multiplier);
    const upperBand = middleBand.plus(stdDev.times(multDec));
    const lowerBand = middleBand.minus(stdDev.times(multDec));
    const bandwidth = upperBand.minus(lowerBand).dividedBy(middleBand);

    return {
      middleBand,
      upperBand,
      lowerBand,
      bandwidth,
    };
  }

  public static calculateADX(
    bars: PriceBar[],
    period = 14,
  ): { adx: Decimal; plusDI: Decimal; minusDI: Decimal } {
    if (!bars || bars.length < period * 2) {
      throw new Error(`Insufficient bars for ADX calculation. Required at least: ${period * 2}`);
    }

    const trs: Decimal[] = [];
    const plusDMs: Decimal[] = [];
    const minusDMs: Decimal[] = [];

    for (let i = 1; i < bars.length; i++) {
      const high = new Decimal(bars[i].high);
      const low = new Decimal(bars[i].low);
      const prevClose = new Decimal(bars[i - 1].close);
      const prevHigh = new Decimal(bars[i - 1].high);
      const prevLow = new Decimal(bars[i - 1].low);

      const tr1 = high.minus(low);
      const tr2 = high.minus(prevClose).abs();
      const tr3 = low.minus(prevClose).abs();
      const tr = Decimal.max(tr1, Decimal.max(tr2, tr3));

      const upMove = high.minus(prevHigh);
      const downMove = prevLow.minus(low);

      const plusDM = upMove.gt(downMove) && upMove.gt(0) ? upMove : new Decimal(0);
      const minusDM = downMove.gt(upMove) && downMove.gt(0) ? downMove : new Decimal(0);

      trs.push(tr);
      plusDMs.push(plusDM);
      minusDMs.push(minusDM);
    }

    let smoothedTR = new Decimal(0);
    let smoothedPlusDM = new Decimal(0);
    let smoothedMinusDM = new Decimal(0);

    for (let i = 0; i < period; i++) {
      smoothedTR = smoothedTR.plus(trs[i]);
      smoothedPlusDM = smoothedPlusDM.plus(plusDMs[i]);
      smoothedMinusDM = smoothedMinusDM.plus(minusDMs[i]);
    }

    const dxList: Decimal[] = [];

    for (let i = period; i < trs.length; i++) {
      smoothedTR = smoothedTR.minus(smoothedTR.dividedBy(period)).plus(trs[i]);
      smoothedPlusDM = smoothedPlusDM.minus(smoothedPlusDM.dividedBy(period)).plus(plusDMs[i]);
      smoothedMinusDM = smoothedMinusDM.minus(smoothedMinusDM.dividedBy(period)).plus(minusDMs[i]);

      const plusDI = smoothedTR.isZero() ? new Decimal(0) : smoothedPlusDM.dividedBy(smoothedTR).times(100);
      const minusDI = smoothedTR.isZero() ? new Decimal(0) : smoothedMinusDM.dividedBy(smoothedTR).times(100);

      const diSum = plusDI.plus(minusDI);
      const diDiff = plusDI.minus(minusDI).abs();
      const dx = diSum.isZero() ? new Decimal(0) : diDiff.dividedBy(diSum).times(100);
      dxList.push(dx);
    }

    let adxSum = new Decimal(0);
    const adxSlice = dxList.slice(dxList.length - period);
    for (const val of adxSlice) {
      adxSum = adxSum.plus(val);
    }
    const adx = adxSum.dividedBy(adxSlice.length);

    const lastTR = smoothedTR;
    const plusDI = lastTR.isZero() ? new Decimal(0) : smoothedPlusDM.dividedBy(lastTR).times(100);
    const minusDI = lastTR.isZero() ? new Decimal(0) : smoothedMinusDM.dividedBy(lastTR).times(100);

    return {
      adx,
      plusDI,
      minusDI,
    };
  }

  public static calculateIchimoku(
    bars: PriceBar[],
    tenkanPeriod = 9,
    kijunPeriod = 26,
    senkouBPeriod = 52,
  ): {
    tenkanSen: Decimal;
    kijunSen: Decimal;
    senkouSpanA: Decimal;
    senkouSpanB: Decimal;
    chikouSpan: Decimal;
  } {
    if (!bars || bars.length < senkouBPeriod) {
      throw new Error(`Insufficient bars for Ichimoku calculation. Required at least: ${senkouBPeriod}`);
    }

    const calcHighLowAvg = (slice: PriceBar[]) => {
      let maxHigh = new Decimal(slice[0].high);
      let minLow = new Decimal(slice[0].low);
      for (const bar of slice) {
        const h = new Decimal(bar.high);
        const l = new Decimal(bar.low);
        if (h.gt(maxHigh)) maxHigh = h;
        if (l.lt(minLow)) minLow = l;
      }
      return maxHigh.plus(minLow).dividedBy(2);
    };

    const n = bars.length;
    const tenkanSen = calcHighLowAvg(bars.slice(n - tenkanPeriod));
    const kijunSen = calcHighLowAvg(bars.slice(n - kijunPeriod));
    const senkouSpanA = tenkanSen.plus(kijunSen).dividedBy(2);
    const senkouSpanB = calcHighLowAvg(bars.slice(n - senkouBPeriod));
    const chikouSpan = new Decimal(bars[n - 1].close);

    return {
      tenkanSen,
      kijunSen,
      senkouSpanA,
      senkouSpanB,
      chikouSpan,
    };
  }

  private static calculateEMAHistory(values: Decimal[], period: number): Decimal[] {
    if (values.length < period) {
      throw new Error(`Insufficient values for EMA history. Required: ${period}, Provided: ${values.length}`);
    }

    const k = new Decimal(2).dividedBy(period + 1);
    const emaList: Decimal[] = [];

    let sum = new Decimal(0);
    for (let i = 0; i < period; i++) {
      sum = sum.plus(values[i]);
    }
    let prevEMA = sum.dividedBy(period);
    emaList.push(prevEMA);

    for (let i = period; i < values.length; i++) {
      const currentVal = values[i];
      const ema = currentVal.times(k).plus(prevEMA.times(new Decimal(1).minus(k)));
      emaList.push(ema);
      prevEMA = ema;
    }

    return emaList;
  }
}
