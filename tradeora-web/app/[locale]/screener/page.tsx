'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Search, SlidersHorizontal, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useUserRole } from '@/lib/useUserRole';
import Link from 'next/link';
import { ScreenerRowSkeleton } from '@/components/ui/ScreenerRowSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

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
  const [filterShariah, setFilterShariah] = useState(false);
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
    if (filterShariah) {
      list = list.filter(s => Boolean(s.is_shariah_compliant));
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
  }, [stocks, search, filterSignal, filterSector, filterChange, filterShariah, sortBy, sortDir]);

  const toggleSort = (key: typeof sortBy) => {
    if (sortBy === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="w-full text-text-primary pb-20">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
            <span className="text-accent-blue">🔍</span>
            {isAr ? 'فرز وفلترة الأسهم الذكي' : 'Smart Stock Screener'}
          </h1>
          <p className="text-zinc-400 text-sm">
            {isAr 
              ? `تم العثور على ${filtered.length} سهم من أصل ${stocks.length}`
              : `Found ${filtered.length} of ${stocks.length} stocks`}
          </p>
        </div>

        <Button variant="glass" size="sm" onClick={fetchStocks}>
          <RefreshCw className="w-4 h-4" />
          {isAr ? 'تحديث البيانات' : 'Refresh Data'}
        </Button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: isAr ? 'إشارات الشراء' : 'Buy Signals',
            value: stocks.filter(s => s.signal === 'buy').length,
            color: 'text-up-green',
            bgClass: 'bg-up-green-bg border-up-green/20',
            icon: <TrendingUp className="w-5 h-5" />
          },
          {
            label: isAr ? 'إشارات البيع' : 'Sell Signals',
            value: stocks.filter(s => s.signal === 'sell').length,
            color: 'text-down-red',
            bgClass: 'bg-down-red-bg border-down-red/20',
            icon: <TrendingDown className="w-5 h-5" />
          },
          {
            label: isAr ? 'الأسهم الصاعدة' : 'Rising Stocks',
            value: stocks.filter(s => s.change > 0).length,
            color: 'text-emerald-400',
            bgClass: 'glass-panel',
            icon: <span>▲</span>
          },
          {
            label: isAr ? 'الأسهم الهابطة' : 'Falling Stocks',
            value: stocks.filter(s => s.change < 0).length,
            color: 'text-red-400',
            bgClass: 'glass-panel',
            icon: <span>▼</span>
          }
        ].map(card => (
          <Card key={card.label} hoverEffect={false} className={`p-5 flex justify-between items-center ${card.bgClass}`}>
            <div>
              <p className="text-zinc-400 text-xs mb-1.5 font-semibold">{card.label}</p>
              <p className={`text-3xl font-black font-mono ${card.color}`}>{card.value}</p>
            </div>
            <div className={`p-3 rounded-xl bg-white/5 ${card.color}`}>{card.icon}</div>
          </Card>
        ))}
      </div>

      {/* Filters Control Panel */}
      <Card hoverEffect={false} className="p-5 mb-8 flex flex-col gap-5">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <SlidersHorizontal className="w-4 h-4 text-accent-blue" />
          <span>{isAr ? 'لوحة التحكم بالتصفية والبحث' : 'Filter Control Panel'}</span>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-3.5" />
            <input
              placeholder={isAr ? 'ابحث برمز السهم أو الاسم...' : 'Search stock symbol or name...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full glass-input rounded-xl pl-11 pr-4 py-3 text-sm focus:border-accent-blue"
            />
          </div>

          <select
            value={filterChange}
            onChange={e => setFilterChange(e.target.value as any)}
            className="glass-input rounded-xl px-4 py-3 text-sm cursor-pointer appearance-none min-w-[150px]"
          >
            <option value="all" className="bg-surface-dark">{isAr ? '📊 كل اتجاهات السعر' : 'All Changes'}</option>
            <option value="up" className="bg-surface-dark">{isAr ? '▲ الأسهم الصاعدة' : '▲ Rising'}</option>
            <option value="down" className="bg-surface-dark">{isAr ? '▼ الأسهم الهابطة' : '▼ Falling'}</option>
          </select>

          <select
            value={filterSector}
            onChange={e => setFilterSector(e.target.value)}
            className="glass-input rounded-xl px-4 py-3 text-sm cursor-pointer appearance-none min-w-[180px]"
          >
            {sectors.map(s => (
              <option key={s} value={s} className="bg-surface-dark">
                {s === 'all' ? (isAr ? '🏢 كل القطاعات' : 'All Sectors') : s}
              </option>
            ))}
          </select>

          <button
            onClick={() => setFilterShariah(v => !v)}
            className={`px-5 py-3 rounded-xl text-sm font-bold transition-all border flex items-center gap-2 cursor-pointer ${
              filterShariah
                ? 'bg-up-green-bg border-up-green/50 text-up-green shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]'
                : 'glass-input'
            }`}
          >
            <span>☪️</span>
            <span>{isAr ? 'متوافق مع الشريعة فقط' : 'Shariah Only'}</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
          <span className="text-xs text-zinc-500 font-bold self-center mr-2">
            {isAr ? 'فلترة الإشارة خوارزمياً:' : 'Filter Signal:'}
          </span>
          {(['all', 'buy', 'sell', 'neutral'] as const).map(sig => (
            <button
              key={sig}
              onClick={() => setFilterSignal(sig)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                filterSignal === sig
                  ? sig === 'buy'
                    ? 'bg-up-green-bg border-up-green/50 text-up-green'
                    : sig === 'sell'
                    ? 'bg-down-red-bg border-down-red/50 text-down-red'
                    : 'bg-accent-blue/20 border-accent-blue/50 text-accent-blue'
                  : 'glass-input'
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
      </Card>

      {/* Main Table View */}
      {loading ? (
        <Card hoverEffect={false} className="p-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <ScreenerRowSkeleton key={i} />
          ))}
        </Card>
      ) : (
        <Card hoverEffect={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm select-none">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-zinc-400">
                  <th className="py-5 px-5 font-semibold text-start">
                    <button onClick={() => toggleSort('symbol')} className="hover:text-white transition flex items-center gap-1">
                      <span>{isAr ? 'السهم' : 'Stock'}</span>
                      {sortBy === 'symbol' && (sortDir === 'desc' ? '▼' : '▲')}
                    </button>
                  </th>
                  <th className="py-5 px-4 font-semibold">
                    <button onClick={() => toggleSort('price')} className="hover:text-white transition flex items-center gap-1 justify-end w-full">
                      <span>{isAr ? 'السعر' : 'Price'}</span>
                      {sortBy === 'price' && (sortDir === 'desc' ? '▼' : '▲')}
                    </button>
                  </th>
                  <th className="py-5 px-4 font-semibold">
                    <button onClick={() => toggleSort('change')} className="hover:text-white transition flex items-center gap-1 justify-end w-full">
                      <span>{isAr ? 'التغير%' : 'Change%'}</span>
                      {sortBy === 'change' && (sortDir === 'desc' ? '▼' : '▲')}
                    </button>
                  </th>
                  <th className="py-5 px-4 font-semibold hidden md:table-cell">
                    <button onClick={() => toggleSort('volume')} className="hover:text-white transition flex items-center gap-1 justify-end w-full">
                      <span>{isAr ? 'الحجم' : 'Volume'}</span>
                      {sortBy === 'volume' && (sortDir === 'desc' ? '▼' : '▲')}
                    </button>
                  </th>
                  <th className="py-5 px-4 font-semibold text-center">{isAr ? 'القطاع' : 'Sector'}</th>
                  <th className="py-5 px-4 font-semibold text-center">{isAr ? 'الإشارة خوارزمياً' : 'Signal'}</th>
                  <th className="py-5 px-5 font-semibold text-center hidden md:table-cell">
                    <button onClick={() => toggleSort('win_rate')} className="hover:text-white transition flex items-center gap-1 justify-center w-full">
                      <span>{isAr ? 'نسبة النجاح' : 'Win Rate'}</span>
                      {sortBy === 'win_rate' && (sortDir === 'desc' ? '▼' : '▲')}
                    </button>
                  </th>
                </tr>
              </thead>
              <motion.tbody 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="divide-y divide-white/5"
              >
                <AnimatePresence>
                  {filtered.map((stock, idx) => {
                    const isLocked = !isPremium && idx >= 5;
                    const isUp = stock.change > 0;
                    const isDown = stock.change < 0;

                    return (
                      <motion.tr 
                        variants={rowVariants}
                        layout
                        key={stock.id}
                        onClick={() => {
                          if (isLocked) {
                            router.push(`/${locale}/pricing`);
                          } else {
                            router.push(`/${locale}/stock/${stock.symbol}`);
                          }
                        }}
                        className={`hover:bg-white/5 transition-colors cursor-pointer group ${isLocked ? 'blur-[4px] select-none pointer-events-none opacity-40' : ''}`}
                      >
                        <td className="py-4 px-5 text-start">
                          <div className="font-bold text-white group-hover:text-accent-blue transition flex items-center gap-2">
                            <span className="font-mono text-base">{stock.symbol}</span>
                            {stock.is_shariah_compliant && (
                              <Badge variant="success" className="scale-75 origin-left">☪️ {isAr ? 'شرعي' : 'Halal'}</Badge>
                            )}
                          </div>
                          <div className="text-xs text-zinc-500 max-w-[160px] truncate">
                            {isAr ? stock.name_ar : stock.name_en}
                          </div>
                        </td>

                        <td className="py-4 px-4 font-mono font-bold text-white text-end text-base">
                          {stock.price ? stock.price.toFixed(2) : '-'}
                          <span className="text-[10px] text-zinc-600 font-sans font-normal ml-1">EGP</span>
                        </td>

                        <td className="py-4 px-4 font-mono font-bold text-end">
                          <span className={isUp ? 'text-up-green' : isDown ? 'text-down-red' : 'text-zinc-400'}>
                            {isUp ? '+' : ''}
                            {stock.change ? stock.change.toFixed(2) : '0.00'}%
                          </span>
                        </td>

                        <td className="py-4 px-4 font-mono text-zinc-400 text-end hidden md:table-cell">
                          {stock.volume 
                            ? (stock.volume >= 1000000 
                              ? `${(stock.volume / 1000000).toFixed(1)}M` 
                              : stock.volume.toLocaleString()) 
                            : '-'}
                        </td>

                        <td className="py-4 px-4 text-center text-xs text-zinc-400">
                          {stock.sector || '-'}
                        </td>

                        <td className="py-4 px-4 text-center">
                          {stock.signal ? (
                            <Badge 
                              variant={stock.signal === 'buy' ? 'success' : stock.signal === 'sell' ? 'danger' : 'glass'}
                              pulsing={stock.signal === 'buy' || stock.signal === 'sell'}
                            >
                              {stock.signal === 'buy' ? 'شراء' : stock.signal === 'sell' ? 'بيع' : 'محايد'}
                            </Badge>
                          ) : (
                            <span className="text-zinc-600 font-mono">—</span>
                          )}
                        </td>

                        <td className="py-4 px-5 text-center hidden md:table-cell">
                          {stock.win_rate ? (
                            <div className={`font-mono font-bold text-sm ${
                              stock.win_rate >= 60 
                                ? 'text-accent-gold' 
                                : stock.win_rate >= 45 
                                ? 'text-zinc-300' 
                                : 'text-zinc-500'
                            }`}>
                              {stock.win_rate.toFixed(0)}%
                            </div>
                          ) : (
                            <span className="text-zinc-600 font-mono">-</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </motion.tbody>
            </table>
          </div>

          {!isPremium && filtered.length > 5 && (
            <div className="text-center py-12 border-t border-white/5 bg-surface-dark/80 flex flex-col items-center justify-center">
              <p className="text-accent-gold font-bold text-sm mb-4 flex items-center gap-2">
                <span>🔒</span>
                <span>{isAr ? 'اشترك للوصول للنسخة الكاملة (314 سهم)' : 'Upgrade to unlock all 314 EGX stocks'}</span>
              </p>
              <Button variant="gold" onClick={() => router.push(`/${locale}/pricing`)}>
                ⭐ {isAr ? 'اشترك Premium' : 'Upgrade Premium'}
              </Button>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-20 text-zinc-500">
              <span className="text-5xl block mb-4">🔍</span>
              <p className="text-sm">{isAr ? 'عذراً، لم نعثر على أي أسهم تطابق شروط الفرز الحالية.' : 'No stocks match your search criteria.'}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
