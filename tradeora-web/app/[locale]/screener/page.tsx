'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Search, SlidersHorizontal, TrendingUp, TrendingDown, RefreshCw, BarChart3, Star, Percent } from 'lucide-react';
import { useUserRole } from '@/lib/useUserRole';
import Link from 'next/link';
import { ScreenerRowSkeleton } from '@/components/ui/ScreenerRowSkeleton';

export default function ScreenerPage() {
  const params = useParams();
  const locale = params?.locale as string || 'ar';
  const router = useRouter();
  const isAr = locale === 'ar';

  const { isPremium, loading: roleLoading } = useUserRole();

  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSignal, setFilterSignal] = useState<'all' | 'buy' | 'sell' | 'neutral'>('all');
  const [filterSector, setFilterSector] = useState('all');
  const [filterChange, setFilterChange] = useState<'all' | 'up' | 'down'>('all');
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'change' | 'win_rate' | 'volume'>('change');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchStocks = () => {
    setLoading(true);
    fetch('/api/screener')
      .then(r => r.json())
      .then(d => {
        setStocks(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching screener stocks:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const sectors = useMemo(() => {
    const sList = stocks.map(s => s.sector).filter(Boolean);
    return ['all', ...Array.from(new Set(sList))];
  }, [stocks]);

  const filtered = useMemo(() => {
    let list = [...stocks];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.symbol.toLowerCase().includes(q) ||
        s.name_ar?.includes(search) ||
        s.name_en?.toLowerCase().includes(q)
      );
    }
    if (filterSignal !== 'all') {
      list = list.filter(s => s.signal === filterSignal);
    }
    if (filterSector !== 'all') {
      list = list.filter(s => s.sector === filterSector);
    }
    if (filterChange === 'up') {
      list = list.filter(s => s.change > 0);
    }
    if (filterChange === 'down') {
      list = list.filter(s => s.change < 0);
    }

    list.sort((a, b) => {
      const va = a[sortBy] ?? 0;
      const vb = b[sortBy] ?? 0;

      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDir === 'desc' 
          ? vb.localeCompare(va) 
          : va.localeCompare(vb);
      }

      return sortDir === 'desc' 
        ? (vb as number) - (va as number) 
        : (va as number) - (vb as number);
    });
    return list;
  }, [stocks, search, filterSignal, filterSector, filterChange, sortBy, sortDir]);

  const signalColor = (sig: string) => {
    const colors: Record<string, string> = {
      buy: 'text-green-400 bg-green-400/10 border-green-500/20',
      sell: 'text-red-400 bg-red-400/10 border-red-500/20',
      neutral: 'text-slate-400 bg-slate-400/10 border-slate-500/20'
    };
    return colors[sig] || colors.neutral;
  };

  const signalLabel = (sig: string) => {
    const ar: Record<string, string> = { buy: 'شراء', sell: 'بيع', neutral: 'محايد' };
    const en: Record<string, string> = { buy: 'Buy', sell: 'Sell', neutral: 'Neutral' };
    return isAr ? ar[sig] || sig : en[sig] || sig;
  };

  const toggleSort = (key: typeof sortBy) => {
    if (sortBy === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  return (
    <div className="w-full font-sans text-text-primary">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white mb-1 flex items-center gap-2">
            <span>🔍</span>
            <span>{isAr ? 'فرز وفلترة الأسهم الذكي (Screener)' : 'Stock Screener'}</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            {isAr 
              ? `تم العثور على ${filtered.length} سهم من أصل ${stocks.length}`
              : `Found ${filtered.length} of ${stocks.length} stocks`}
          </p>
        </div>

        <button 
          onClick={fetchStocks}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg text-xs font-semibold border border-white/5 transition self-start cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{isAr ? 'تحديث البيانات' : 'Refresh'}</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: isAr ? 'إشارات الشراء (Buy)' : 'Buy Signals',
            value: stocks.filter(s => s.signal === 'buy').length,
            color: 'text-green-400 bg-green-500/5 border-green-500/10',
            icon: <TrendingUp className="w-4 h-4 text-green-400" />
          },
          {
            label: isAr ? 'إشارات البيع (Sell)' : 'Sell Signals',
            value: stocks.filter(s => s.signal === 'sell').length,
            color: 'text-red-400 bg-red-500/5 border-red-500/10',
            icon: <TrendingDown className="w-4 h-4 text-red-400" />
          },
          {
            label: isAr ? 'الأسهم الصاعدة اليوم' : 'Rising Stocks',
            value: stocks.filter(s => s.change > 0).length,
            color: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10',
            icon: <span>▲</span>
          },
          {
            label: isAr ? 'الأسهم الهابطة اليوم' : 'Falling Stocks',
            value: stocks.filter(s => s.change < 0).length,
            color: 'text-rose-400 bg-rose-500/5 border-rose-500/10',
            icon: <span>▼</span>
          }
        ].map(card => (
          <div key={card.label} className={`glass-card p-4 rounded-xl border flex justify-between items-center ${card.color}`}>
            <div>
              <p className="text-slate-400 text-[10px] sm:text-xs mb-1 font-semibold">{card.label}</p>
              <p className="text-xl sm:text-2xl font-black font-sans">{card.value}</p>
            </div>
            <div className="p-2 rounded-lg bg-white/5">{card.icon}</div>
          </div>
        ))}
      </div>

      {/* Filters Control Panel */}
      <div className="glass-card p-4 rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.01] to-white/[0.002] mb-6 flex flex-col gap-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
          <SlidersHorizontal className="w-3.5 h-3.5 text-accent-blue" />
          <span>{isAr ? 'لوحة التحكم بالتصفية والبحث' : 'Filter Control Panel'}</span>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Search bar */}
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              placeholder={isAr ? 'ابحث برمز السهم أو الاسم...' : 'Search stock symbol or name...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-xs placeholder:text-slate-500 focus:border-accent-blue outline-none"
            />
          </div>

          {/* Change Filter Dropdown */}
          <select
            value={filterChange}
            onChange={e => setFilterChange(e.target.value as any)}
            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:border-accent-blue outline-none cursor-pointer"
          >
            <option value="all">{isAr ? '📊 كل اتجاهات السعر' : 'All Changes'}</option>
            <option value="up">{isAr ? '▲ الأسهم الصاعدة' : '▲ Rising'}</option>
            <option value="down">{isAr ? '▼ الأسهم الهابطة' : '▼ Falling'}</option>
          </select>

          {/* Sector Filter Dropdown */}
          <select
            value={filterSector}
            onChange={e => setFilterSector(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:border-accent-blue outline-none cursor-pointer"
          >
            {sectors.map(s => (
              <option key={s} value={s}>
                {s === 'all' 
                  ? (isAr ? '🏢 كل القطاعات الاقتصادية' : 'All Sectors') 
                  : s}
              </option>
            ))}
          </select>
        </div>

        {/* Signals quick-filters pill bar */}
        <div className="flex flex-wrap gap-2 pt-1.5 border-t border-white/5">
          <span className="text-[10px] text-slate-500 font-bold self-center mr-1">
            {isAr ? 'فلترة الإشارة خوارزمياً:' : 'Filter Signal:'}
          </span>
          {(['all', 'buy', 'sell', 'neutral'] as const).map(sig => (
            <button
              key={sig}
              onClick={() => setFilterSignal(sig)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                filterSignal === sig
                  ? sig === 'buy'
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : sig === 'sell'
                    ? 'bg-red-500/20 border-red-500/50 text-red-400'
                    : 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              {sig === 'all'
                ? (isAr ? 'الكل' : 'All')
                : sig === 'buy'
                ? (isAr ? '🟢 شراء' : '🟢 Buy')
                : sig === 'sell'
                ? (isAr ? '🔴 بيع' : '🔴 Sell')
                : (isAr ? '🟡 محايد' : '🟡 Neutral')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table View */}
      {loading ? (
        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden p-2">
          {Array.from({ length: 15 }).map((_, i) => (
            <ScreenerRowSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs select-none">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5 text-slate-400/80">
                  <th className="py-4 px-4 font-semibold text-start">
                    <button onClick={() => toggleSort('symbol')} className="hover:text-white transition flex items-center gap-1">
                      <span>{isAr ? 'السهم' : 'Stock'}</span>
                      {sortBy === 'symbol' && (sortDir === 'desc' ? '▼' : '▲')}
                    </button>
                  </th>
                  <th className="py-4 px-3 font-semibold">
                    <button onClick={() => toggleSort('price')} className="hover:text-white transition flex items-center gap-1 justify-end w-full">
                      <span>{isAr ? 'السعر' : 'Price'}</span>
                      {sortBy === 'price' && (sortDir === 'desc' ? '▼' : '▲')}
                    </button>
                  </th>
                  <th className="py-4 px-3 font-semibold">
                    <button onClick={() => toggleSort('change')} className="hover:text-white transition flex items-center gap-1 justify-end w-full">
                      <span>{isAr ? 'التغير%' : 'Change%'}</span>
                      {sortBy === 'change' && (sortDir === 'desc' ? '▼' : '▲')}
                    </button>
                  </th>
                  <th className="py-4 px-3 font-semibold hidden md:table-cell">
                    <button onClick={() => toggleSort('volume')} className="hover:text-white transition flex items-center gap-1 justify-end w-full">
                      <span>{isAr ? 'الحجم' : 'Volume'}</span>
                      {sortBy === 'volume' && (sortDir === 'desc' ? '▼' : '▲')}
                    </button>
                  </th>
                  <th className="py-4 px-3 font-semibold text-center">{isAr ? 'القطاع' : 'Sector'}</th>
                  <th className="py-4 px-3 font-semibold text-center">{isAr ? 'الإشارة خوارزمياً' : 'Signal'}</th>
                  <th className="py-4 px-4 font-semibold text-center hidden md:table-cell">
                    <button onClick={() => toggleSort('win_rate')} className="hover:text-white transition flex items-center gap-1 justify-center w-full">
                      <span>{isAr ? 'معدل النجاح' : 'Win Rate'}</span>
                      {sortBy === 'win_rate' && (sortDir === 'desc' ? '▼' : '▲')}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((stock, idx) => {
                  const isLocked = !isPremium && idx >= 5;
                  const isUp = stock.change > 0;
                  const isDown = stock.change < 0;

                  return (
                    <tr 
                      key={stock.id}
                      onClick={() => {
                        if (isLocked) {
                          router.push(`/${locale}/pricing`);
                        } else {
                          router.push(`/${locale}/stock/${stock.symbol}`);
                        }
                      }}
                      className={`hover:bg-white/[0.01] transition-colors cursor-pointer group ${isLocked ? 'blur-[3px] select-none pointer-events-none opacity-40' : ''}`}
                    >
                      {/* Symbol + Name */}
                      <td className="py-3.5 px-4 text-start">
                        <div className="font-bold text-white group-hover:text-accent-blue transition">
                          {stock.symbol}
                        </div>
                        <div className="text-[10px] text-slate-500 max-w-[120px] truncate">
                          {isAr ? stock.name_ar : stock.name_en}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-3 font-mono font-bold text-white text-end">
                        {stock.price ? stock.price.toFixed(2) : '-'}
                        <span className="text-[9px] text-slate-500 font-sans font-normal ml-0.5">EGP</span>
                      </td>

                      {/* Change */}
                      <td className="py-3.5 px-3 font-mono font-bold text-end">
                        <span className={isUp ? 'text-green-400' : isDown ? 'text-red-400' : 'text-slate-400'}>
                          {isUp ? '+' : ''}
                          {stock.change ? stock.change.toFixed(2) : '0.00'}%
                        </span>
                      </td>

                      {/* Volume */}
                      <td className="py-3.5 px-3 font-mono text-slate-400 text-end hidden md:table-cell">
                        {stock.volume 
                          ? (stock.volume >= 1000000 
                            ? `${(stock.volume / 1000000).toFixed(1)}M` 
                            : stock.volume.toLocaleString()) 
                          : '-'}
                      </td>

                      {/* Sector */}
                      <td className="py-3.5 px-3 text-center text-[10px] text-slate-400">
                        {stock.sector || '-'}
                      </td>

                      {/* Signal */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${signalColor(stock.signal)}`}>
                          {stock.signal === 'buy' ? '▲ ' : stock.signal === 'sell' ? '▼ ' : '• '}
                          {signalLabel(stock.signal)}
                        </span>
                      </td>

                      {/* Win Rate */}
                      <td className="py-3.5 px-4 text-center hidden md:table-cell">
                        {stock.win_rate ? (
                          <div className={`font-mono font-bold ${
                            stock.win_rate >= 60 
                              ? 'text-green-400' 
                              : stock.win_rate >= 45 
                              ? 'text-yellow-400' 
                              : 'text-red-400'
                          }`}>
                            {stock.win_rate.toFixed(0)}%
                          </div>
                        ) : (
                          <span className="text-slate-600 font-mono">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!isPremium && filtered.length > 5 && (
            <div className="text-center py-8 border-t border-white/5 bg-[#111E2E]/60 flex flex-col items-center justify-center">
              <p className="text-[#C9A84C] font-bold text-xs mb-3 flex items-center gap-1.5">
                <span>🔒</span>
                <span>{isAr ? 'للوصول لكامل الأسهم (314 سهم)' : 'Unlock all 314 EGX stocks'}</span>
              </p>
              <Link
                href={`/${locale}/pricing`}
                className="px-6 py-2 rounded-xl text-xs font-bold btn-gold transition-all shadow-md shadow-[#C9A84C]/10 cursor-pointer"
              >
                ⭐ {isAr ? 'اشترك Premium' : 'Upgrade Premium'}
              </Link>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-20 text-slate-500">
              <span className="text-4xl block mb-2">🔍</span>
              <p className="text-xs">{isAr ? 'عذراً، لم نعثر على أي أسهم تطابق شروط الفرز الحالية.' : 'No stocks match your search criteria.'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
