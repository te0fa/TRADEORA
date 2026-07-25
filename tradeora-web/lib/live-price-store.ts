// Live Price Store & Broadcast Manager (In-Memory Process Cache)
// Provides 1ms ultra-low latency price reading and SSE streaming for Tradeora

export interface LivePriceTick {
  symbol: string;
  price: number;
  changePct: number;
  high: number;
  low: number;
  volume: number;
  timestamp: number;
}

type Listener = (tick: LivePriceTick) => void;

class LivePriceStore {
  private cache: Map<string, LivePriceTick> = new Map();
  private listeners: Set<Listener> = new Set();

  public updateTick(symbol: string, tick: Partial<LivePriceTick> & { price: number }) {
    const sym = symbol.toUpperCase();
    const existing = this.cache.get(sym);

    const updated: LivePriceTick = {
      symbol: sym,
      price: tick.price,
      changePct: tick.changePct ?? existing?.changePct ?? 0.0,
      high: tick.high ?? existing?.high ?? tick.price,
      low: tick.low ?? existing?.low ?? tick.price,
      volume: tick.volume ?? existing?.volume ?? 0,
      timestamp: Date.now()
    };

    this.cache.set(sym, updated);
    this.notify(updated);
  }

  public getTick(symbol: string): LivePriceTick | undefined {
    return this.cache.get(symbol.toUpperCase());
  }

  public getAllTicks(): LivePriceTick[] {
    return Array.from(this.cache.values());
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(tick: LivePriceTick) {
    this.listeners.forEach((listener) => {
      try {
        listener(tick);
      } catch (err) {
        console.error('Error notifying live price listener:', err);
      }
    });
  }
}

// Global Singleton to ensure memory persistence across server requests
const globalForLivePrice = globalThis as unknown as { livePriceStore?: LivePriceStore };

export const livePriceStore = globalForLivePrice.livePriceStore ?? new LivePriceStore();

if (process.env.NODE_ENV !== 'production') {
  globalForLivePrice.livePriceStore = livePriceStore;
}
