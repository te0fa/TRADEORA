'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchCompaniesWithPrices, CompanyWithPrice } from '@/lib/queries';

export function useStocks() {
  const [stocks, setStocks] = useState<CompanyWithPrice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const loadStocks = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const data = await fetchCompaniesWithPrices();
      setStocks(data);
      setLastFetched(new Date());
      setError(null);
    } catch (err: any) {
      console.error('Failed to load stocks:', err);
      setError(err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStocks();

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      loadStocks(true); // silent refresh
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadStocks]);

  return { 
    stocks, 
    loading, 
    error, 
    lastFetched,
    refetch: () => loadStocks(false) 
  };
}
