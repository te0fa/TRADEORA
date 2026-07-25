import { Decimal } from 'decimal.js';
import { Money } from './money';

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
  lastPrice: string;
  changeAmount: string;
  changePercent: string;
  dayHigh: string;
  dayLow: string;
  volume: string;
  updatedAt: string;
  circuitBreakerStatus?: CircuitBreakerHaltStatus;
}

export class MarketDataEvaluator {
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

  public static calculateSpread(ask: string | number | Decimal, bid: string | number | Decimal): Decimal {
    const askDec = new Decimal(ask);
    const bidDec = new Decimal(bid);
    if (bidDec.gt(askDec)) {
      throw new Error(`Invalid quote: Bid price (${bidDec}) cannot be greater than Ask price (${askDec})`);
    }
    return askDec.minus(bidDec);
  }

  public static formatPrice(price: string | number | Decimal, precision: number): string {
    const priceDec = new Decimal(price);
    return priceDec.toFixed(precision);
  }

  public static validateTickPrice(price: string | number | Decimal): boolean {
    try {
      const priceDec = new Decimal(price);
      return priceDec.gt(0);
    } catch {
      return false;
    }
  }

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

  public static isEGXSessionActive(date: Date = new Date()): boolean {
    const utcHours = date.getUTCHours();
    const cairoHours = (utcHours + 3) % 24;
    const utcDay = date.getUTCDay();

    const isTradingDay = utcDay >= 0 && utcDay <= 4;
    const cairoMinutes = date.getUTCMinutes();
    const cairoTimeInHours = cairoHours + cairoMinutes / 60;

    const isTradingHours = cairoTimeInHours >= 10.0 && cairoTimeInHours < 14.5;
    return isTradingDay && isTradingHours;
  }

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
