"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TechnicalIndicatorEvaluator = void 0;
const decimal_js_1 = require("decimal.js");
// Enforce strict Decimal configuration (ROUND_HALF_UP)
decimal_js_1.Decimal.set({ precision: 28, rounding: decimal_js_1.Decimal.ROUND_HALF_UP });
class TechnicalIndicatorEvaluator {
    /**
     * Calculate Relative Strength Index (RSI) using Decimal math
     * Standard period: 14
     */
    static calculateRSI(prices, period = 14) {
        if (!prices || prices.length < period + 1) {
            throw new Error(`Insufficient price points for RSI calculation. Required: ${period + 1}, Provided: ${prices?.length || 0}`);
        }
        const decimals = prices.map((p) => new decimal_js_1.Decimal(p));
        let gains = new decimal_js_1.Decimal(0);
        let losses = new decimal_js_1.Decimal(0);
        // Initial average gain/loss
        for (let i = 1; i <= period; i++) {
            const change = decimals[i].minus(decimals[i - 1]);
            if (change.gt(0)) {
                gains = gains.plus(change);
            }
            else {
                losses = losses.plus(change.abs());
            }
        }
        let avgGain = gains.dividedBy(period);
        let avgLoss = losses.dividedBy(period);
        // Wilder's smoothing
        for (let i = period + 1; i < decimals.length; i++) {
            const change = decimals[i].minus(decimals[i - 1]);
            const currentGain = change.gt(0) ? change : new decimal_js_1.Decimal(0);
            const currentLoss = change.lt(0) ? change.abs() : new decimal_js_1.Decimal(0);
            avgGain = avgGain.times(period - 1).plus(currentGain).dividedBy(period);
            avgLoss = avgLoss.times(period - 1).plus(currentLoss).dividedBy(period);
        }
        if (avgLoss.isZero()) {
            return new decimal_js_1.Decimal(100);
        }
        const rs = avgGain.dividedBy(avgLoss);
        const rsi = new decimal_js_1.Decimal(100).minus(new decimal_js_1.Decimal(100).dividedBy(new decimal_js_1.Decimal(1).plus(rs)));
        return rsi;
    }
    /**
     * Calculate Moving Average Convergence Divergence (MACD)
     * Fast Period = 12, Slow Period = 26, Signal Period = 9
     */
    static calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        if (!prices || prices.length < slowPeriod + signalPeriod) {
            throw new Error(`Insufficient data points for MACD calculation. Required: ${slowPeriod + signalPeriod}`);
        }
        const decimals = prices.map((p) => new decimal_js_1.Decimal(p));
        const fastEMA = this.calculateEMAHistory(decimals, fastPeriod);
        const slowEMA = this.calculateEMAHistory(decimals, slowPeriod);
        const macdHistory = [];
        const offset = slowPeriod - 1;
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
    /**
     * Calculate Bollinger Bands
     * Period = 20, Multiplier = 2
     */
    static calculateBollingerBands(prices, period = 20, multiplier = 2) {
        if (!prices || prices.length < period) {
            throw new Error(`Insufficient data points for Bollinger Bands calculation. Required: ${period}`);
        }
        const decimals = prices.map((p) => new decimal_js_1.Decimal(p));
        const recent = decimals.slice(decimals.length - period);
        // Simple Moving Average
        let sum = new decimal_js_1.Decimal(0);
        for (const p of recent) {
            sum = sum.plus(p);
        }
        const middleBand = sum.dividedBy(period);
        // Standard Deviation
        let varianceSum = new decimal_js_1.Decimal(0);
        for (const p of recent) {
            const diff = p.minus(middleBand);
            varianceSum = varianceSum.plus(diff.times(diff));
        }
        const variance = varianceSum.dividedBy(period);
        const stdDev = variance.sqrt();
        const multDec = new decimal_js_1.Decimal(multiplier);
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
    /**
     * Calculate Average Directional Index (ADX)
     * Period = 14
     */
    static calculateADX(bars, period = 14) {
        if (!bars || bars.length < period * 2) {
            throw new Error(`Insufficient bars for ADX calculation. Required at least: ${period * 2}`);
        }
        const trs = [];
        const plusDMs = [];
        const minusDMs = [];
        for (let i = 1; i < bars.length; i++) {
            const high = new decimal_js_1.Decimal(bars[i].high);
            const low = new decimal_js_1.Decimal(bars[i].low);
            const prevClose = new decimal_js_1.Decimal(bars[i - 1].close);
            const prevHigh = new decimal_js_1.Decimal(bars[i - 1].high);
            const prevLow = new decimal_js_1.Decimal(bars[i - 1].low);
            const tr1 = high.minus(low);
            const tr2 = high.minus(prevClose).abs();
            const tr3 = low.minus(prevClose).abs();
            const tr = decimal_js_1.Decimal.max(tr1, decimal_js_1.Decimal.max(tr2, tr3));
            const upMove = high.minus(prevHigh);
            const downMove = prevLow.minus(low);
            const plusDM = upMove.gt(downMove) && upMove.gt(0) ? upMove : new decimal_js_1.Decimal(0);
            const minusDM = downMove.gt(upMove) && downMove.gt(0) ? downMove : new decimal_js_1.Decimal(0);
            trs.push(tr);
            plusDMs.push(plusDM);
            minusDMs.push(minusDM);
        }
        // Smoothed averages (Wilder's)
        let smoothedTR = new decimal_js_1.Decimal(0);
        let smoothedPlusDM = new decimal_js_1.Decimal(0);
        let smoothedMinusDM = new decimal_js_1.Decimal(0);
        for (let i = 0; i < period; i++) {
            smoothedTR = smoothedTR.plus(trs[i]);
            smoothedPlusDM = smoothedPlusDM.plus(plusDMs[i]);
            smoothedMinusDM = smoothedMinusDM.plus(minusDMs[i]);
        }
        const dxList = [];
        for (let i = period; i < trs.length; i++) {
            smoothedTR = smoothedTR.minus(smoothedTR.dividedBy(period)).plus(trs[i]);
            smoothedPlusDM = smoothedPlusDM.minus(smoothedPlusDM.dividedBy(period)).plus(plusDMs[i]);
            smoothedMinusDM = smoothedMinusDM.minus(smoothedMinusDM.dividedBy(period)).plus(minusDMs[i]);
            const plusDI = smoothedTR.isZero() ? new decimal_js_1.Decimal(0) : smoothedPlusDM.dividedBy(smoothedTR).times(100);
            const minusDI = smoothedTR.isZero() ? new decimal_js_1.Decimal(0) : smoothedMinusDM.dividedBy(smoothedTR).times(100);
            const diSum = plusDI.plus(minusDI);
            const diDiff = plusDI.minus(minusDI).abs();
            const dx = diSum.isZero() ? new decimal_js_1.Decimal(0) : diDiff.dividedBy(diSum).times(100);
            dxList.push(dx);
        }
        let adxSum = new decimal_js_1.Decimal(0);
        const adxSlice = dxList.slice(dxList.length - period);
        for (const val of adxSlice) {
            adxSum = adxSum.plus(val);
        }
        const adx = adxSum.dividedBy(adxSlice.length);
        const lastTR = smoothedTR;
        const plusDI = lastTR.isZero() ? new decimal_js_1.Decimal(0) : smoothedPlusDM.dividedBy(lastTR).times(100);
        const minusDI = lastTR.isZero() ? new decimal_js_1.Decimal(0) : smoothedMinusDM.dividedBy(lastTR).times(100);
        return {
            adx,
            plusDI,
            minusDI,
        };
    }
    /**
     * Calculate Ichimoku Kinko Hyo
     * Tenkan-sen (9), Kijun-sen (26), Senkou Span A (26), Senkou Span B (52), Chikou Span (26)
     */
    static calculateIchimoku(bars, tenkanPeriod = 9, kijunPeriod = 26, senkouBPeriod = 52) {
        if (!bars || bars.length < senkouBPeriod) {
            throw new Error(`Insufficient bars for Ichimoku calculation. Required at least: ${senkouBPeriod}`);
        }
        const calcHighLowAvg = (slice) => {
            let maxHigh = new decimal_js_1.Decimal(slice[0].high);
            let minLow = new decimal_js_1.Decimal(slice[0].low);
            for (const bar of slice) {
                const h = new decimal_js_1.Decimal(bar.high);
                const l = new decimal_js_1.Decimal(bar.low);
                if (h.gt(maxHigh))
                    maxHigh = h;
                if (l.lt(minLow))
                    minLow = l;
            }
            return maxHigh.plus(minLow).dividedBy(2);
        };
        const n = bars.length;
        const tenkanSen = calcHighLowAvg(bars.slice(n - tenkanPeriod));
        const kijunSen = calcHighLowAvg(bars.slice(n - kijunPeriod));
        const senkouSpanA = tenkanSen.plus(kijunSen).dividedBy(2);
        const senkouSpanB = calcHighLowAvg(bars.slice(n - senkouBPeriod));
        const chikouSpan = new decimal_js_1.Decimal(bars[n - 1].close);
        return {
            tenkanSen,
            kijunSen,
            senkouSpanA,
            senkouSpanB,
            chikouSpan,
        };
    }
    /**
     * Helper to calculate EMA history for a sequence of values
     */
    static calculateEMAHistory(values, period) {
        if (values.length < period) {
            throw new Error(`Insufficient values for EMA history. Required: ${period}, Provided: ${values.length}`);
        }
        const k = new decimal_js_1.Decimal(2).dividedBy(period + 1);
        const emaList = [];
        // First value is SMA of first 'period' values
        let sum = new decimal_js_1.Decimal(0);
        for (let i = 0; i < period; i++) {
            sum = sum.plus(values[i]);
        }
        let prevEMA = sum.dividedBy(period);
        emaList.push(prevEMA);
        for (let i = period; i < values.length; i++) {
            const currentVal = values[i];
            const ema = currentVal.times(k).plus(prevEMA.times(new decimal_js_1.Decimal(1).minus(k)));
            emaList.push(ema);
            prevEMA = ema;
        }
        return emaList;
    }
}
exports.TechnicalIndicatorEvaluator = TechnicalIndicatorEvaluator;
