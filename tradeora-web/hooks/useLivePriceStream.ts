'use client';

import { useState, useEffect } from 'react';

export interface LivePriceTickData {
  symbol: string;
  price: number;
  changePct: number;
  high: number;
  low: number;
  volume: number;
  timestamp: number;
}

export function useLivePriceStream(symbol?: string) {
  const [liveTick, setLiveTick] = useState<LivePriceTickData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const url = symbol 
      ? `/api/stream-prices?symbol=${encodeURIComponent(symbol)}`
      : '/api/stream-prices';

    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.addEventListener('tick', (e: MessageEvent) => {
      try {
        const data: LivePriceTickData = JSON.parse(e.data);
        setLiveTick(data);
      } catch (err) {
        console.error('Error parsing live price tick SSE:', err);
      }
    });

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [symbol]);

  return { liveTick, isConnected };
}
