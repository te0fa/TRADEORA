export interface PivotPoints {
    pivot: string;
    r1: string;
    r2: string;
    r3: string;
    s1: string;
    s2: string;
    s3: string;
}
export interface TradeRiskRewardPlan {
    currentPrice: string;
    stopLoss: string;
    stopLossPercent: string;
    takeProfit1: string;
    takeProfit1Percent: string;
    takeProfit2: string;
    takeProfit2Percent: string;
    riskRewardRatio: string;
    isFavorable: boolean;
    pivotPoints: PivotPoints;
    disclaimer: string;
}
export declare class TradeRiskLevelsEvaluator {
    private static readonly FRA_DISCLAIMER;
    /**
     * Calculates Classical Pivot Points (PP, R1, R2, R3, S1, S2, S3) using Decimal.js
     */
    static calculatePivotPoints(highStr: string, lowStr: string, closeStr: string): PivotPoints;
    /**
     * Calculates Take Profit targets (TP1, TP2), Stop Loss (SL), and Risk/Reward Ratio (RRR)
     */
    static calculateRiskRewardPlan(currentPriceStr: string, highStr: string, lowStr: string, closeStr: string): TradeRiskRewardPlan;
}
