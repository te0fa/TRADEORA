import { Decimal } from 'decimal.js';
export declare enum MarketType {
    EGX = "EGX",
    FOREX = "FOREX"
}
export declare enum MarketTickSource {
    EGX_DIRECT = "EGX_DIRECT",
    OANDA = "OANDA",
    FXCM = "FXCM",
    SIMULATED = "SIMULATED"
}
export interface PriceTick {
    tickId: string;
    symbol: string;
    marketType: MarketType;
    price: Decimal;
    bid?: Decimal;
    ask?: Decimal;
    volume: Decimal;
    source: MarketTickSource;
    timestamp: string;
}
export interface ForexTick extends PriceTick {
    marketType: MarketType.FOREX;
    pipPrecision: number;
    spread: Decimal;
}
export interface EGXPriceTick extends PriceTick {
    marketType: MarketType.EGX;
    isin: string;
    circuitBreakerHalt: CircuitBreakerHaltStatus;
    sessionStatus: EGXSessionStatus;
}
export type TimeFrame = '1m' | '5m' | '1d';
export declare enum CircuitBreakerHaltStatus {
    NORMAL = "NORMAL",
    HALTED_5_PERCENT = "HALTED_5_PERCENT",
    HALTED_10_PERCENT = "HALTED_10_PERCENT"
}
import { EGXSessionStatus } from './market-calendar';
export { EGXSessionStatus };
export interface OHLCVBar {
    symbol: string;
    timeframe: TimeFrame;
    bucket: string;
    open: Decimal;
    high: Decimal;
    low: Decimal;
    close: Decimal;
    volume: Decimal;
    tickCount: number;
}
export interface MarketQuote {
    symbol: string;
    nameEn: string;
    nameAr: string;
    marketType: MarketType;
    lastPrice: string;
    changeAmount: string;
    changePercent: string;
    dayHigh: string;
    dayLow: string;
    volume: string;
    updatedAt: string;
    circuitBreakerStatus?: CircuitBreakerHaltStatus;
}
export declare class MarketDataEvaluator {
    /**
     * Calculate Pip precision requirement based on Forex currency pair
     * Standard FX: 5 decimal places (e.g. 1.08542 EUR/USD)
     * JPY pairs: 3 decimal places (e.g. 155.432 USD/JPY)
     * EGP pairs: 4 decimal places (e.g. 48.5025 USD/EGP)
     */
    static getForexPipPrecision(symbol: string): number;
    /**
     * Compute spread between ask and bid prices using Decimal
     */
    static calculateSpread(ask: string | number | Decimal, bid: string | number | Decimal): Decimal;
    /**
     * Format price to strict string decimal with appropriate precision
     */
    static formatPrice(price: string | number | Decimal, precision: number): string;
    /**
     * Validates tick price integrity (ensures non-negative and non-zero)
     */
    static validateTickPrice(price: string | number | Decimal): boolean;
    /**
     * Evaluates EGX Circuit Breaker limits (5% and 10% movement against reference baseline price)
     * EGX Rules:
     * ±5% intraday change: Temporary 10-minute trading suspension for security
     * ±10% intraday change: Suspension for rest of trading session
     */
    static calculateCircuitBreakerStatus(currentPrice: string | number | Decimal, referencePrice: string | number | Decimal): CircuitBreakerHaltStatus;
    /**
     * Check if current Cairo time falls within official EGX Trading Session:
     * EGX Session: Sunday - Thursday, 10:00 AM - 02:30 PM Cairo Time (Africa/Cairo)
     */
    static isEGXSessionActive(date?: Date): boolean;
    /**
     * Aggregate list of price ticks into an OHLCV Bar representation using strict Decimal math
     */
    static aggregateOHLCVBar(symbol: string, timeframe: TimeFrame, bucketISO: string, ticks: PriceTick[]): OHLCVBar;
}
