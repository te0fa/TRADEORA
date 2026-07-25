"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeRiskLevelsEvaluator = void 0;
const decimal_js_1 = require("decimal.js");
decimal_js_1.Decimal.set({ precision: 28, rounding: decimal_js_1.Decimal.ROUND_HALF_UP });
class TradeRiskLevelsEvaluator {
    /**
     * Calculates Classical Pivot Points (PP, R1, R2, R3, S1, S2, S3) using Decimal.js
     */
    static calculatePivotPoints(highStr, lowStr, closeStr) {
        const high = new decimal_js_1.Decimal(highStr);
        const low = new decimal_js_1.Decimal(lowStr);
        const close = new decimal_js_1.Decimal(closeStr);
        // PP = (High + Low + Close) / 3
        const pp = high.plus(low).plus(close).dividedBy(3);
        // R1 = 2 * PP - Low
        const r1 = pp.times(2).minus(low);
        // S1 = 2 * PP - High
        const s1 = pp.times(2).minus(high);
        // R2 = PP + (High - Low)
        const r2 = pp.plus(high.minus(low));
        // S2 = PP - (High - Low)
        const s2 = pp.minus(high.minus(low));
        // R3 = High + 2 * (PP - Low)
        const r3 = high.plus(pp.minus(low).times(2));
        // S3 = Low - 2 * (High - PP)
        const s3 = low.minus(high.minus(pp).times(2));
        return {
            pivot: pp.toFixed(2),
            r1: r1.toFixed(2),
            r2: r2.toFixed(2),
            r3: r3.toFixed(2),
            s1: s1.toFixed(2),
            s2: s2.toFixed(2),
            s3: s3.toFixed(2),
        };
    }
    /**
     * Calculates Take Profit targets (TP1, TP2), Stop Loss (SL), and Risk/Reward Ratio (RRR)
     */
    static calculateRiskRewardPlan(currentPriceStr, highStr, lowStr, closeStr) {
        const currentPrice = new decimal_js_1.Decimal(currentPriceStr);
        const pivots = this.calculatePivotPoints(highStr, lowStr, closeStr);
        const s1 = new decimal_js_1.Decimal(pivots.s1);
        const r1 = new decimal_js_1.Decimal(pivots.r1);
        const r2 = new decimal_js_1.Decimal(pivots.r2);
        // Stop Loss: Set slightly below S1 (e.g., S1 * 0.995 or S1)
        let stopLoss = s1.times(0.995);
        if (stopLoss.gte(currentPrice)) {
            // Fallback if current price is already below S1: 2.5% below current price
            stopLoss = currentPrice.times(0.975);
        }
        // Risk Amount = Current Price - Stop Loss
        const riskAmount = currentPrice.minus(stopLoss);
        const stopLossPercent = riskAmount.dividedBy(currentPrice).times(100);
        // Take Profit 1 = R1, Take Profit 2 = R2
        let tp1 = r1;
        if (tp1.lte(currentPrice)) {
            // Fallback if current price is above R1: 4% above current price
            tp1 = currentPrice.times(1.04);
        }
        let tp2 = r2;
        if (tp2.lte(tp1)) {
            // Fallback: 8% above current price
            tp2 = currentPrice.times(1.08);
        }
        const reward1Amount = tp1.minus(currentPrice);
        const tp1Percent = reward1Amount.dividedBy(currentPrice).times(100);
        const tp2Percent = tp2.minus(currentPrice).dividedBy(currentPrice).times(100);
        // RRR = Reward1 / Risk
        let rrrNum = new decimal_js_1.Decimal(0);
        if (riskAmount.gt(0)) {
            rrrNum = reward1Amount.dividedBy(riskAmount);
        }
        const isFavorable = rrrNum.gte(2.0); // Favorable trade if RRR >= 1:2
        return {
            currentPrice: currentPrice.toFixed(2),
            stopLoss: stopLoss.toFixed(2),
            stopLossPercent: `-${stopLossPercent.toFixed(2)}%`,
            takeProfit1: tp1.toFixed(2),
            takeProfit1Percent: `+${tp1Percent.toFixed(2)}%`,
            takeProfit2: tp2.toFixed(2),
            takeProfit2Percent: `+${tp2Percent.toFixed(2)}%`,
            riskRewardRatio: `1 : ${rrrNum.toFixed(1)}`,
            isFavorable: isFavorable,
            pivotPoints: pivots,
            disclaimer: this.FRA_DISCLAIMER,
        };
    }
}
exports.TradeRiskLevelsEvaluator = TradeRiskLevelsEvaluator;
TradeRiskLevelsEvaluator.FRA_DISCLAIMER = "تنويه الهيئة العامة للرقابة المالية: مستويات الدعم والمقاومة وأهداف الصفقة هي لأغراض الدراسة والتعليم فقط وليست توصية بالبيع أو الشراء.";
