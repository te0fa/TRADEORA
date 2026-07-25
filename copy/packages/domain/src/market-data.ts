import { Decimal } from 'decimal.js';
import { Money } from './money';

// Enforce strict Decimal configuration (ROUND_HALF_UP)
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export enum MarketType {
  EGX = 'EGX',
  FOREX = 'FOREX',
}

export enum MarketTickSource {
  EGX_DIRECT = 'EGX_DIRECT',
  OANDA = 'OANDA',
  FXCM = 'FXCM',
  SIMULATED = 'SIMULATED',
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
  timestamp: string; // ISO 8601
}

export interface ForexTick extends PriceTick {
  marketType: MarketType.FOREX;
  pipPrecision: number; // 5 for EUR/USD, 3 for USD/JPY, 4 for USD/EGP
  spread: Decimal;
}

export interface EGXPriceTick extends PriceTick {
  marketType: MarketType.EGX;
  isin: string;
  circuitBreakerHalt: CircuitBreakerHaltStatus;
  sessionStatus: EGXSessionStatus;
}

export type TimeFrame = '1m' | '5m' | '1d';

export enum CircuitBreakerHaltStatus {
  NORMAL = 'NORMAL',
  HALTED_5_PERCENT = 'HALTED_5_PERCENT',
  HALTED_10_PERCENT = 'HALTED_10_PERCENT',
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
  lastPrice: string; // Decimal string representation
  changeAmount: string;
  changePercent: string;
  dayHigh: string;
  dayLow: string;
  volume: string;
  updatedAt: string;
  circuitBreakerStatus?: CircuitBreakerHaltStatus;
}

export class MarketDataEvaluator {
  /**
   * Calculate Pip precision requirement based on Forex currency pair
   * Standard FX: 5 decimal places (e.g. 1.08542 EUR/USD)
   * JPY pairs: 3 decimal places (e.g. 155.432 USD/JPY)
   * EGP pairs: 4 decimal places (e.g. 48.5025 USD/EGP)
   */
  public static getForexPipPrecision(symbol: string): number {
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
  public static calculateSpread(ask: string | number | Decimal, bid: string | number | Decimal): Decimal {
    const askDec = new Decimal(ask);
    const bidDec = new Decimal(bid);
    if (bidDec.gt(askDec)) {
      throw new Error(`Invalid quote: Bid price (${bidDec}) cannot be greater than Ask price (${askDec})`);
    }
    return askDec.minus(bidDec);
  }

  /**
   * Format price to strict string decimal with appropriate precision
   */
  public static formatPrice(price: string | number | Decimal, precision: number): string {
    const priceDec = new Decimal(price);
    return priceDec.toFixed(precision);
  }

  /**
   * Validates tick price integrity (ensures non-negative and non-zero)
   */
  public static validateTickPrice(price: string | number | Decimal): boolean {
    try {
      const priceDec = new Decimal(price);
      return priceDec.gt(0);
    } catch {
      return false;
    }
  }

  /**
   * Evaluates EGX Circuit Breaker limits (5% and 10% movement against reference baseline price)
   * EGX Rules:
   * ±5% intraday change: Temporary 10-minute trading suspension for security
   * ±10% intraday change: Suspension for rest of trading session
   */
  public static calculateCircuitBreakerStatus(
    currentPrice: string | number | Decimal,
    referencePrice: string | number | Decimal,
  ): CircuitBreakerHaltStatus {
    const current = new Decimal(currentPrice);
    const reference = new Decimal(referencePrice);

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
  public static isEGXSessionActive(date: Date = new Date()): boolean {
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
  public static aggregateOHLCVBar(
    symbol: string,
    timeframe: TimeFrame,
    bucketISO: string,
    ticks: PriceTick[],
  ): OHLCVBar {
    if (!ticks || ticks.length === 0) {
      throw new Error(`Cannot aggregate OHLCV bar for ${symbol} with zero ticks.`);
    }

    const sortedTicks = [...ticks].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    let open = sortedTicks[0].price;
    let high = sortedTicks[0].price;
    let low = sortedTicks[0].price;
    let close = sortedTicks[sortedTicks.length - 1].price;
    let volume = new Decimal(0);

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

