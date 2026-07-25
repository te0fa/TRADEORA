import { Decimal } from 'decimal.js';
export interface IndicatorValue {
    symbol: string;
    timeframe: string;
    timestamp: string;
    rsi?: string;
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
export declare class TechnicalIndicatorEvaluator {
    /**
     * Calculate Relative Strength Index (RSI) using Decimal math
     * Standard period: 14
     */
    static calculateRSI(prices: (string | number | Decimal)[], period?: number): Decimal;
    /**
     * Calculate Moving Average Convergence Divergence (MACD)
     * Fast Period = 12, Slow Period = 26, Signal Period = 9
     */
    static calculateMACD(prices: (string | number | Decimal)[], fastPeriod?: number, slowPeriod?: number, signalPeriod?: number): {
        macdLine: Decimal;
        signalLine: Decimal;
        histogram: Decimal;
    };
    /**
     * Calculate Bollinger Bands
     * Period = 20, Multiplier = 2
     */
    static calculateBollingerBands(prices: (string | number | Decimal)[], period?: number, multiplier?: number): {
        middleBand: Decimal;
        upperBand: Decimal;
        lowerBand: Decimal;
        bandwidth: Decimal;
    };
    /**
     * Calculate Average Directional Index (ADX)
     * Period = 14
     */
    static calculateADX(bars: PriceBar[], period?: number): {
        adx: Decimal;
        plusDI: Decimal;
        minusDI: Decimal;
    };
    /**
     * Calculate Ichimoku Kinko Hyo
     * Tenkan-sen (9), Kijun-sen (26), Senkou Span A (26), Senkou Span B (52), Chikou Span (26)
     */
    static calculateIchimoku(bars: PriceBar[], tenkanPeriod?: number, kijunPeriod?: number, senkouBPeriod?: number): {
        tenkanSen: Decimal;
        kijunSen: Decimal;
        senkouSpanA: Decimal;
        senkouSpanB: Decimal;
        chikouSpan: Decimal;
    };
    /**
     * Helper to calculate EMA history for a sequence of values
     */
    private static calculateEMAHistory;
}
