'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { CompanyWithPrice } from '@/lib/queries';
import { TableFilters } from './TableFilters';
import { StockRow } from './StockRow';
import { Skeleton } from '../ui/Skeleton';
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { toEasternArabic } from '@/lib/formatters';

interface StockTableProps {
  stocks: CompanyWithPrice[];
  loading: boolean;
  locale: string;
}

export function StockTable({ stocks, loading, locale }: StockTableProps) {
  const t = useTranslations('table');
  const tGlobal = useTranslations();

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [shariahOnly, setShariahOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'gaining' | 'losing'>('all');

  // Sorting State
  const [sortKey, setSortKey] = useState<string>('volume'); // default sort by volume desc
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Extract unique sectors
  const sectors = useMemo(() => {
    const allSectors = stocks.map((s) => s.sector).filter(Boolean) as string[];
    return Array.from(new Set(allSectors)).sort();
  }, [stocks]);

  // Handle Header click for sorting
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false); // default to descending on new key
    }
    setCurrentPage(1); // reset to page 1 on sort change
  };

  // Filter and Sort stocks
  const processedStocks = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    
    // 1. Filter
    const filtered = stocks.filter((stock) => {
      // Search matches
      const symbolMatch = stock.symbol.toLowerCase().includes(term);
      const nameArMatch = stock.name_ar?.toLowerCase().includes(term);
      const nameEnMatch = stock.name_en?.toLowerCase().includes(term);
      const searchMatches = !term || symbolMatch || nameArMatch || nameEnMatch;

      // Sector matches
      const sectorMatches = !selectedSector || stock.sector === selectedSector;

      // Shariah matches
      const shariahMatches = !shariahOnly || stock.is_shariah_compliant;

      // Status matches
      let statusMatches = true;
      const change = stock.priceRecord?.change_value ?? null;
      if (statusFilter === 'gaining') {
        statusMatches = change !== null && change > 0;
      } else if (statusFilter === 'losing') {
        statusMatches = change !== null && change < 0;
      }

      return searchMatches && sectorMatches && shariahMatches && statusMatches;
    });

    // 2. Sort
    return [...filtered].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      if (sortKey === 'symbol') {
        valA = a.symbol;
        valB = b.symbol;
      } else if (sortKey === 'name') {
        valA = locale === 'ar' ? (a.name_ar || a.name_en || '') : (a.name_en || a.name_ar || '');
        valB = locale === 'ar' ? (b.name_ar || b.name_en || '') : (b.name_en || b.name_ar || '');
      } else if (sortKey === 'price') {
        valA = a.priceRecord?.close_price ?? 0;
        valB = b.priceRecord?.close_price ?? 0;
      } else if (sortKey === 'change') {
        valA = a.priceRecord?.change_percent ?? -999999;
        valB = b.priceRecord?.change_percent ?? -999999;
      } else if (sortKey === 'volume') {
        valA = a.priceRecord?.volume ?? 0;
        valB = b.priceRecord?.volume ?? 0;
      } else if (sortKey === 'fetched_at') {
        valA = a.priceRecord?.fetched_at ? new Date(a.priceRecord.fetched_at).getTime() : 0;
        valB = b.priceRecord?.fetched_at ? new Date(b.priceRecord.fetched_at).getTime() : 0;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [stocks, searchTerm, selectedSector, shariahOnly, statusFilter, sortKey, sortAsc, locale]);

  // Paginated slice
  const paginatedStocks = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return processedStocks.slice(startIndex, startIndex + pageSize);
  }, [processedStocks, currentPage, pageSize]);

  const totalPages = Math.ceil(processedStocks.length / pageSize);

  // Render Table Header column with sorting indicator
  const renderHeader = (label: string, key: string, sortable = true) => {
    return (
      <th 
        onClick={() => sortable && handleSort(key)}
        className={`px-4 sm:px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary ${sortable ? 'cursor-pointer hover:text-text-primary transition-colors duration-150 select-none' : ''} ${locale === 'ar' ? 'text-right' : 'text-left'}`}
      >
        <div className="flex items-center gap-1.5">
          <span>{label}</span>
          {sortable && (
            <ArrowUpDown className={`w-3.5 h-3.5 ${sortKey === key ? 'text-accent-blue' : 'text-text-secondary/40'}`} />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="w-full">
      <TableFilters
        searchTerm={searchTerm}
        onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
        selectedSector={selectedSector}
        onSectorChange={(val) => { setSelectedSector(val); setCurrentPage(1); }}
        shariahOnly={shariahOnly}
        onShariahToggle={(val) => { setShariahOnly(val); setCurrentPage(1); }}
        statusFilter={statusFilter}
        onStatusChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
        sectors={sectors}
        locale={locale}
      />

      <div className="w-full overflow-x-auto rounded-2xl glass-card">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.01]">
              {renderHeader(t('symbol'), 'symbol')}
              {renderHeader(t('name'), 'name')}
              {renderHeader(t('currentPrice'), 'price')}
              {renderHeader(t('change'), 'change')}
              {renderHeader(t('changePercent'), 'change')}
              {renderHeader(t('volume'), 'volume')}
              {renderHeader(t('source'), 'source', false)}
              {renderHeader(t('dataQuality'), 'quality', false)}
              {renderHeader(t('lastFetch'), 'fetched_at')}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Loading Skeleton State (9 columns)
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-white/5 bg-white/[0.005]">
                  <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-36" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-7 w-20" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-14" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-14" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-5 w-14" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                </tr>
              ))
            ) : paginatedStocks.length > 0 ? (
              paginatedStocks.map((stock) => (
                <StockRow key={stock.id} stock={stock} />
              ))
            ) : (
              // Empty State
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-sm text-text-secondary font-medium font-sans">
                  {tGlobal('watchlist.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 px-1 font-sans">
          <span className="text-xs text-text-secondary font-medium">
            {tGlobal('pageIndicator', { 
              current: locale === 'ar' ? toEasternArabic(currentPage) : currentPage, 
              total: locale === 'ar' ? toEasternArabic(totalPages) : totalPages 
            })}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-text-primary transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer`}
            >
              {locale === 'ar' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-text-primary transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer`}
            >
              {locale === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
