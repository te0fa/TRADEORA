'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  fetchStockDetail, 
  fetchIntradayPrices, 
  fetchHistoricalPrices, 
  fetchLatestPricesBySource,
  CompanyWithPrice 
} from '@/lib/queries';
import { PriceRecord } from '@/lib/market-utils';

export function useStockDetail(symbol: string) {
  const [company, setCompany] = useState<CompanyWithPrice | null>(null);
  const [intradayData, setIntradayData] = useState<{
    date: string;
    points: {
      time: string;
      consensus: number | null;
      tradingview: number | null;
      mubasher: number | null;
      investing: number | null;
    }[];
  } | null>(null);
  const [historicalPrices, setHistoricalPrices] = useState<PriceRecord[]>([]);
  const [latestSourcePrices, setLatestSourcePrices] = useState<Record<string, PriceRecord>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const detail = await fetchStockDetail(symbol);
      if (!detail) {
        throw new Error(`Stock not found: ${symbol}`);
      }
      setCompany(detail);

      // Fetch intraday, historical, and latest by source concurrently
      const [intraday, historical, sourcePrices] = await Promise.all([
        fetchIntradayPrices(detail.id),
        fetchHistoricalPrices(detail.id, 500),
        fetchLatestPricesBySource(detail.id)
      ]);

      setIntradayData(intraday);
      setHistoricalPrices(historical);
      setLatestSourcePrices(sourcePrices);
      setError(null);
    } catch (err: any) {
      console.error(`Failed to load stock detail for ${symbol}:`, err);
      setError(err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    if (symbol) {
      loadData(false);

      // Auto refresh every 15 seconds during Egyptian trading session
      const interval = setInterval(() => {
        loadData(true);
      }, 15 * 1000);

      return () => clearInterval(interval);
    }
  }, [symbol, loadData]);

  return {
    company,
    intradayData,
    historicalPrices,
    latestSourcePrices,
    loading,
    error,
    refetch: () => loadData(false)
  };
}
