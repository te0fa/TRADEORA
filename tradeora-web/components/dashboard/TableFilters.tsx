'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Search, Filter } from 'lucide-react';

interface TableFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedSector: string;
  onSectorChange: (val: string) => void;
  shariahOnly: boolean;
  onShariahToggle: (val: boolean) => void;
  statusFilter: 'all' | 'gaining' | 'losing';
  onStatusChange: (val: 'all' | 'gaining' | 'losing') => void;
  sectors: string[];
  locale: string;
}

export function TableFilters({
  searchTerm,
  onSearchChange,
  selectedSector,
  onSectorChange,
  shariahOnly,
  onShariahToggle,
  statusFilter,
  onStatusChange,
  sectors,
  locale
}: TableFiltersProps) {
  const t = useTranslations('filters');

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <span className={`absolute inset-y-0 ${locale === 'ar' ? 'right-3' : 'left-3'} flex items-center pointer-events-none text-text-secondary`}>
            <Search className="w-4 h-4" />
          </span>
          <input
            suppressHydrationWarning
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full glass-input rounded-xl py-2.5 ${locale === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm text-text-primary placeholder-text-secondary font-sans`}
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sector Selection */}
          <div className="relative min-w-[160px] flex-1 sm:flex-initial">
            <select
              suppressHydrationWarning
              value={selectedSector}
              onChange={(e) => onSectorChange(e.target.value)}
              className="w-full glass-input rounded-xl py-2.5 px-4 pr-8 text-sm text-text-primary appearance-none cursor-pointer font-sans bg-transparent"
            >
              <option value="" className="bg-surface-dark">{t('allSectors')}</option>
              {sectors.map((sector) => (
                <option key={sector} value={sector} className="bg-surface-dark">
                  {sector}
                </option>
              ))}
            </select>
            <span className={`absolute inset-y-0 ${locale === 'ar' ? 'left-3' : 'right-3'} flex items-center pointer-events-none text-text-secondary`}>
              <Filter className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Shariah Compliance toggle */}
          <button
            suppressHydrationWarning
            onClick={() => onShariahToggle(!shariahOnly)}
            className={`
              px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer font-sans flex items-center gap-1.5
              ${shariahOnly 
                ? 'bg-accent-blue/15 border-accent-blue text-accent-blue shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]' 
                : 'border-white/5 bg-white/5 text-text-secondary hover:border-white/10 hover:text-text-primary'
              }
            `}
          >
            <span>☪️</span>
            <span>{t('shariahOnly')}</span>
          </button>
        </div>
      </div>

      {/* Gaining / Losing Status Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/5 self-start">
        {(['all', 'gaining', 'losing'] as const).map((status) => (
          <button
            suppressHydrationWarning
            key={status}
            onClick={() => onStatusChange(status)}
            className={`
              px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer font-sans
              ${statusFilter === status 
                ? 'bg-surface-dark text-text-primary shadow-sm border border-white/5' 
                : 'text-text-secondary hover:text-text-primary'
              }
            `}
          >
            {status === 'all' && t('allStocks')}
            {status === 'gaining' && t('gaining')}
            {status === 'losing' && t('losing')}
          </button>
        ))}
      </div>
    </div>
  );
}
