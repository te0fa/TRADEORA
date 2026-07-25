"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketDataEvaluator = exports.EGXSessionStatus = exports.CircuitBreakerHaltStatus = exports.MarketTickSource = exports.MarketType = void 0;
const decimal_js_1 = require("decimal.js");
// Enforce strict Decimal configuration (ROUND_HALF_UP)
decimal_js_1.Decimal.set({ precision: 28, rounding: decimal_js_1.Decimal.ROUND_HALF_UP });
var MarketType;
(function (MarketType) {
    MarketType["EGX"] = "EGX";
    MarketType["FOREX"] = "FOREX";
})(MarketType || (exports.MarketType = MarketType = {}));
var MarketTickSource;
(function (MarketTickSource) {
    MarketTickSource["EGX_DIRECT"] = "EGX_DIRECT";
    MarketTickSource["OANDA"] = "OANDA";
    MarketTickSource["FXCM"] = "FXCM";
    MarketTickSource["SIMULATED"] = "SIMULATED";
})(MarketTickSource || (exports.MarketTickSource = MarketTickSource = {}));
var CircuitBreakerHaltStatus;
(function (CircuitBreakerHaltStatus) {
    CircuitBreakerHaltStatus["NORMAL"] = "NORMAL";
    CircuitBreakerHaltStatus["HALTED_5_PERCENT"] = "HALTED_5_PERCENT";
    CircuitBreakerHaltStatus["HALTED_10_PERCENT"] = "HALTED_10_PERCENT";
})(CircuitBreakerHaltStatus || (exports.CircuitBreakerHaltStatus = CircuitBreakerHaltStatus = {}));
const market_calendar_1 = require("./market-calendar");
Object.defineProperty(exports, "EGXSessionStatus", { enumerable: true, get: function () { return market_calendar_1.EGXSessionStatus; } });
class MarketDataEvaluator {
    /**
     * Calculate Pip precision requirement based on Forex currency pair
     * Standard FX: 5 decimal places (e.g. 1.08542 EUR/USD)
     * JPY pairs: 3 decimal places (e.g. 155.432 USD/JPY)
     * EGP pairs: 4 decimal places (e.g. 48.5025 USD/EGP)
     */
    static getForexPipPrecision(symbol) {
        const cleanSymbol = symbol.toUpperCase().replace('/', '').replace('-', '');
        if (cleanSymbol.includes('JPY')) {
            return 3;
        }
        if (cleanSymbol.includes('EGP')) {
            return 4;
        }
        return 5;
    }
    /**
     * Compute spread between ask and bid prices using Decimal
     */
    static calculateSpread(ask, bid) {
        const askDec = new decimal_js_1.Decimal(ask);
        const bidDec = new decimal_js_1.Decimal(bid);
        if (bidDec.gt(askDec)) {
            throw new Error(`Invalid quote: Bid price (${bidDec}) cannot be greater than Ask price (${askDec})`);
        }
        return askDec.minus(bidDec);
    }
    /**
     * Format price to strict string decimal with appropriate precision
     */
    static formatPrice(price, precision) {
        const priceDec = new decimal_js_1.Decimal(price);
        return priceDec.toFixed(precision);
    }
    /**
     * Validates tick price integrity (ensures non-negative and non-zero)
     */
    static validateTickPrice(price) {
        try {
            const priceDec = new decimal_js_1.Decimal(price);
            return priceDec.gt(0);
        }
        catch {
            return false;
        }
    }
    /**
     * Evaluates EGX Circuit Breaker limits (5% and 10% movement against reference baseline price)
     * EGX Rules:
     * ±5% intraday change: Temporary 10-minute trading suspension for security
     * ±10% intraday change: Suspension for rest of trading session
     */
    static calculateCircuitBreakerStatus(currentPrice, referencePrice) {
        const current = new decimal_js_1.Decimal(currentPrice);
        const reference = new decimal_js_1.Decimal(referencePrice);
        if (reference.isZero()) {
            return CircuitBreakerHaltStatus.NORMAL;
        }
        const priceDiff = current.minus(reference).abs();
        const percentChange = priceDiff.dividedBy(reference).times(100);
        if (percentChange.gte(10)) {
            return CircuitBreakerHaltStatus.HALTED_10_PERCENT;
        }
        if (percentChange.gte(5)) {
            return CircuitBreakerHaltStatus.HALTED_5_PERCENT;
        }
        return CircuitBreakerHaltStatus.NORMAL;
    }
    /**
     * Check if current Cairo time falls within official EGX Trading Session:
     * EGX Session: Sunday - Thursday, 10:00 AM - 02:30 PM Cairo Time (Africa/Cairo)
     */
    static isEGXSessionActive(date = new Date()) {
        // Convert to Cairo time offset (UTC+3)
        const utcHours = date.getUTCHours();
        const cairoHours = (utcHours + 3) % 24;
        const utcDay = date.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 4 = Thursday, 5 = Friday, 6 = Saturday
        // Sunday (0) to Thursday (4)
        const isTradingDay = utcDay >= 0 && utcDay <= 4;
        // Trading hours: 10:00 to 14:30 Cairo time
        const cairoMinutes = date.getUTCMinutes();
        const cairoTimeInHours = cairoHours + cairoMinutes / 60;
        const isTradingHours = cairoTimeInHours >= 10.0 && cairoTimeInHours < 14.5;
        return isTradingDay && isTradingHours;
    }
    /**
     * Aggregate list of price ticks into an OHLCV Bar representation using strict Decimal math
     */
    static aggregateOHLCVBar(symbol, timeframe, bucketISO, ticks) {
        if (!ticks || ticks.length === 0) {
            throw new Error(`Cannot aggregate OHLCV bar for ${symbol} with zero ticks.`);
        }
        const sortedTicks = [...ticks].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        let open = sortedTicks[0].price;
        let high = sortedTicks[0].price;
        let low = sortedTicks[0].price;
        let close = sortedTicks[sortedTicks.length - 1].price;
        let volume = new decimal_js_1.Decimal(0);
        for (const tick of sortedTicks) {
            if (tick.price.gt(high)) {
                high = tick.price;
            }
            if (tick.price.lt(low)) {
                low = tick.price;
            }
            volume = volume.plus(tick.volume);
        }
        return {
            symbol,
            timeframe,
            bucket: bucketISO,
            open,
            high,
            low,
            close,
            volume,
            tickCount: ticks.length,
        };
    }
}
exports.MarketDataEvaluator = MarketDataEvaluator;
