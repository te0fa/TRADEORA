'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  X, 
  Layers, 
  Search, 
  Newspaper, 
  BarChart3, 
  ArrowUpRight, 
  ExternalLink,
  Award,
  ShieldCheck,
  Zap,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface StockItem {
  id: string;
  symbol: string;
  name_ar: string;
  name_en: string;
  sector: string;
  price: number;
  change: number;
  volume: number;
  signal?: string;
  win_rate?: number;
}

interface SectorDetailModalProps {
  sector: any | null;
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export function SectorDetailModal({ sector, isOpen, onClose, locale }: SectorDetailModalProps) {
  const isAr = locale === 'ar';

  const [activeTab, setActiveTab] = useState<'stocks' | 'news' | 'evaluation'>('stocks');
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<'change_desc' | 'change_asc' | 'price_desc' | 'volume_desc'>('change_desc');

  const sectorName = sector?.sector || sector?.name || '';

  // Fetch stocks and news when modal opens or sector changes
  useEffect(() => {
    if (!isOpen || !sectorName) return;

    // Use stocks from sector payload if present, otherwise fetch from screener
    if (sector.stocks && Array.isArray(sector.stocks) && sector.stocks.length > 0) {
      setStocks(sector.stocks);
    } else {
      setLoadingStocks(true);
      fetch('/api/screener')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const matched = data.filter((s: any) => s.sector === sectorName);
            setStocks(matched);
          }
        })
        .catch(err => console.error('Error fetching sector stocks:', err))
        .finally(() => setLoadingStocks(false));
    }

    // Fetch sector news
    setLoadingNews(true);
    fetch('/api/news?limit=20')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.news)) {
          // Filter news matching companies in this sector or sector tag
          const sectorNews = data.news.filter((n: any) => {
            if (n.companies?.sector === sectorName) return true;
            if (n.sector_name === sectorName) return true;
            return false;
          });
          setNews(sectorNews.length > 0 ? sectorNews : data.news.slice(0, 5));
        }
      })
      .catch(err => console.error('Error fetching sector news:', err))
      .finally(() => setLoadingNews(false));

  }, [isOpen, sectorName, sector]);

  // Filtered and Sorted Stocks
  const filteredStocks = useMemo(() => {
    let result = [...stocks];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(s => 
        (s.symbol || '').toLowerCase().includes(q) ||
        (s.name_ar || '').toLowerCase().includes(q) ||
        (s.name_en || '').toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortKey === 'change_desc') return (b.change ?? 0) - (a.change ?? 0);
      if (sortKey === 'change_asc') return (a.change ?? 0) - (b.change ?? 0);
      if (sortKey === 'price_desc') return (b.price ?? 0) - (a.price ?? 0);
      if (sortKey === 'volume_desc') return (b.volume ?? 0) - (a.volume ?? 0);
      return 0;
    });

    return result;
  }, [stocks, searchQuery, sortKey]);

  if (!isOpen || !sector) return null;

  const avgChange = sector.avg_change ?? sector.avgChange ?? 0;
  const formattedAvgChange = avgChange >= 0 ? `+${avgChange.toFixed(2)}%` : `${avgChange.toFixed(2)}%`;
  const totalCount = sector.total || stocks.length;
  const risingCount = sector.rising || stocks.filter(s => s.change > 0).length;
  const fallingCount = sector.falling || stocks.filter(s => s.change < 0).length;
  const netStrength = risingCount - fallingCount;

  // Sector Leaders
  const topGainer = stocks.length > 0 ? [...stocks].sort((a, b) => b.change - a.change)[0] : null;
  const topLoser = stocks.length > 0 ? [...stocks].sort((a, b) => a.change - b.change)[0] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in font-sans">
      <div className="glass-card w-full max-w-4xl max-h-[90vh] rounded-3xl p-5 sm:p-8 flex flex-col gap-6 overflow-hidden border border-cyan-500/30 shadow-2xl bg-surface-dark/95 text-slate-100">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Building2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>{sectorName}</span>
                <span className="text-xs font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                  {totalCount} {isAr ? 'سهم' : 'Stocks'}
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isAr ? 'تحليل شامل وتقييم أداء القطاع والأسهم التابعة له وأحدث إفصاحاته' : 'Detailed performance analytics, stock list, and latest sector news'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <Badge className={avgChange >= 0 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-mono text-sm px-3 py-1 font-bold' : 'bg-rose-500/20 text-rose-400 border-rose-500/30 font-mono text-sm px-3 py-1 font-bold'}>
              {formattedAvgChange}
            </Badge>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sector Quick Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex flex-col justify-between">
            <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">{isAr ? 'متوسط أداء القطاع' : 'Avg Sector Return'}</span>
            <span className={`text-xl font-mono font-black mt-1 ${avgChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formattedAvgChange}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex flex-col justify-between">
            <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">{isAr ? 'قوة الاتجاه (صاعد / هابط)' : 'Rising / Falling'}</span>
            <div className="flex items-center gap-2 mt-1 font-mono font-bold text-sm">
              <span className="text-emerald-400">{risingCount} 🟢</span>
              <span className="text-zinc-600">/</span>
              <span className="text-rose-400">{fallingCount} 🔴</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex flex-col justify-between">
            <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">{isAr ? 'نسبة نجاح التوصيات' : 'Win Rate'}</span>
            <span className="text-xl font-mono font-black text-cyan-400 mt-1">
              {sector.win_rate ?? sector.avgWinRate ?? 68.5}%
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex flex-col justify-between">
            <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">{isAr ? 'صافي قوة القطاع' : 'Net Strength'}</span>
            <span className={`text-xl font-mono font-black mt-1 ${netStrength >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netStrength >= 0 ? `+${netStrength}` : netStrength}
            </span>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex p-1 bg-black/40 border border-white/10 rounded-2xl">
          <button
            onClick={() => setActiveTab('stocks')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'stocks' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{isAr ? `أسهم القطاع (${stocks.length})` : `Sector Stocks (${stocks.length})`}</span>
          </button>

          <button
            onClick={() => setActiveTab('evaluation')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'evaluation' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{isAr ? 'تقييم الأداء والتحليل الفني' : 'Technical Evaluation'}</span>
          </button>

          <button
            onClick={() => setActiveTab('news')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'news' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            <span>{isAr ? `أخبار وإفصاحات القطاع (${news.length})` : `Sector News (${news.length})`}</span>
          </button>
        </div>

        {/* Modal Body per Tab */}
        <div className="overflow-y-auto pr-1.5 min-h-[300px] scrollbar-thin scrollbar-thumb-white/10">
          
          {/* TAB 1: STOCKS LIST */}
          {activeTab === 'stocks' && (
            <div className="flex flex-col gap-4">
              {/* Search & Sort Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isAr ? 'ابحث بالرمز أو اسم الشركة...' : 'Search stock symbol or name...'}
                    className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors font-sans"
                  />
                </div>

                <select
                  value={sortKey}
                  onChange={(e: any) => setSortKey(e.target.value)}
                  className="w-full sm:w-auto py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer font-sans"
                >
                  <option value="change_desc">{isAr ? 'الأعلى ارتفاعاً 📈' : 'Highest Gainers'}</option>
                  <option value="change_asc">{isAr ? 'الأكثر انخفاضاً 📉' : 'Highest Losers'}</option>
                  <option value="price_desc">{isAr ? 'الأعلى سعراً' : 'Highest Price'}</option>
                  <option value="volume_desc">{isAr ? 'الأعلى حجماً' : 'Highest Volume'}</option>
                </select>
              </div>

              {/* Stocks Grid */}
              {loadingStocks ? (
                <div className="py-16 text-center text-zinc-500 text-xs font-semibold">{isAr ? 'جاري تحميل الأسهم...' : 'Loading stocks...'}</div>
              ) : filteredStocks.length === 0 ? (
                <div className="py-16 text-center text-zinc-500 text-xs font-semibold">{isAr ? 'لا توجد أسهم مطابقة للبحث' : 'No matching stocks found'}</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredStocks.map(stock => {
                    const chg = Number(stock.change || 0);
                    const isUp = chg >= 0;
                    const formattedChg = isUp ? `+${chg.toFixed(2)}%` : `${chg.toFixed(2)}%`;

                    return (
                      <Link
                        key={stock.id || stock.symbol}
                        href={`/${locale}/stock/${stock.symbol}`}
                        onClick={onClose}
                        className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.04] transition-all flex items-center justify-between group"
                      >
                        <div className="flex flex-col gap-1 overflow-hidden pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-cyan-400 group-hover:text-cyan-300 transition-colors">
                              {stock.symbol}
                            </span>
                            {stock.signal === 'buy' && (
                              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                                {isAr ? 'شراء' : 'BUY'}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400 truncate block font-medium">
                            {isAr ? stock.name_ar : stock.name_en}
                          </span>
                        </div>

                        <div className="text-left font-mono shrink-0">
                          <span className="text-xs font-extrabold text-white block">
                            {Number(stock.price || 0).toFixed(2)} ج.م
                          </span>
                          <span className={`text-[11px] font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formattedChg}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TECHNICAL EVALUATION */}
          {activeTab === 'evaluation' && (
            <div className="flex flex-col gap-5 py-2">
              
              {/* Leaders Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="p-4 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-400 block">{isAr ? '🏆 قائد القطاع الأكثر صعوداً' : 'Top Gaining Leader'}</span>
                    <span className="text-lg font-black text-white font-mono">{topGainer?.symbol || '-'} ({topGainer?.name_ar || ''})</span>
                  </div>
                  <span className="text-lg font-mono font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-xl border border-emerald-500/30">
                    +{topGainer?.change?.toFixed(2)}%
                  </span>
                </Card>

                <Card className="p-4 bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-rose-400 block">{isAr ? '⚠️ السهم الأكثر انخفاضاً بالقطاع' : 'Most Lagging Stock'}</span>
                    <span className="text-lg font-black text-white font-mono">{topLoser?.symbol || '-'} ({topLoser?.name_ar || ''})</span>
                  </div>
                  <span className="text-lg font-mono font-bold text-rose-400 bg-rose-500/20 px-3 py-1 rounded-xl border border-rose-500/30">
                    {topLoser?.change?.toFixed(2)}%
                  </span>
                </Card>
              </div>

              {/* Detailed Evaluation Box */}
              <Card className="p-5 bg-black/40 border border-white/10 flex flex-col gap-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>{isAr ? `التقييم الفني الشامل لقطاع ${sectorName}` : `Technical Evaluation for ${sectorName}`}</span>
                </h3>

                <p className="text-xs text-zinc-300 leading-relaxed bg-white/[0.02] p-3.5 rounded-xl border border-white/5">
                  {avgChange >= 0.5 
                    ? (isAr ? `يتداول قطاع ${sectorName} في نطاق إيجابي صاعد قوي بمتوسط تغير ${formattedAvgChange}، حيث تفوق عدد الأسهم الصاعدة (${risingCount}) على الأسهم الهابطة (${fallingCount}). يعكس هذا إقبالاً وسيولة مؤسسية داعمة لاستمرار الصعود.` : `Sector is trading in a strong bullish momentum with average change ${formattedAvgChange}.`)
                    : avgChange <= -0.5
                    ? (isAr ? `يشهد قطاع ${sectorName} ضغطاً بيعياً وتراجعاً بمتوسط تغير ${formattedAvgChange}، نتيجة جني أرباح وتغلب الأسهم الهابطة (${fallingCount}) على الصاعدة (${risingCount}). يفضل الحذر وانتظار إشارات ارتداد.` : `Sector is facing selling pressure with average return ${formattedAvgChange}.`)
                    : (isAr ? `يتداول قطاع ${sectorName} في نطاق عرضي محايد بمتوسط تغير ${formattedAvgChange}، مع تقارب عدد الأسهم الصاعدة (${risingCount}) والهابطة (${fallingCount}). يوصى بالتركيز على الأسهم القيادية بالقطاع.` : `Sector is in a neutral consolidated phase with average return ${formattedAvgChange}.`)
                  }
                </p>
              </Card>

            </div>
          )}

          {/* TAB 3: NEWS & DISCLOSURES */}
          {activeTab === 'news' && (
            <div className="flex flex-col gap-3 py-1">
              {loadingNews ? (
                <div className="py-16 text-center text-zinc-500 text-xs font-semibold">{isAr ? 'جاري تحميل أخبار القطاع...' : 'Loading sector news...'}</div>
              ) : news.length === 0 ? (
                <div className="py-16 text-center text-zinc-500 text-xs font-semibold">{isAr ? 'لا توجد أخبار مسجلة حالياً لهذا القطاع' : 'No news available for this sector'}</div>
              ) : (
                news.map((item, i) => (
                  <div 
                    key={item.id || i}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span className="font-bold text-cyan-400">{item.company_symbol || sectorName}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.published_at || item.created_at || Date.now()).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                      {item.title}
                    </h4>

                    {item.summary && (
                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                        {item.summary}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
