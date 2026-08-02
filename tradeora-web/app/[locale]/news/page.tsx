'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  Newspaper, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Sparkles, 
  ExternalLink,
  Calendar,
  Search,
  ChevronDown,
  Layers
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface NewsItem {
  id: string;
  title: string;
  content: string | null;
  published_at: string;
  source: string;
  source_url?: string;
  url: string;
  category: string;
  sentiment: string;
  confidence: number;
  expected_impact_ar: string | null;
  impact_score: number | null;
  sector_name: string | null;
  symbol?: string | null;
  companies?: {
    id: string;
    symbol: string;
    name_ar: string;
    sector: string;
  } | null;
}

export default function NewsHubPage({ params }: { params: { locale: string } }) {
  const isAr = params.locale === 'ar';
  const [activeTab, setActiveTab] = useState<string>('all');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchSymbol, setSearchSymbol] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const sectorOptions = [
    { id: 'banking', label: '🏦 قطاع البنوك والخدمات المالية' },
    { id: 'real_estate', label: '🏗️ قطاع العقارات والإنشاءات' },
    { id: 'pharma', label: '💊 قطاع الأدوية والصحة' },
    { id: 'food', label: '🌾 قطاع الأغذية والمشروبات' },
    { id: 'telecom', label: '📱 قطاع الاتصالات والتكنولوجيا' },
    { id: 'energy', label: '⚡ قطاع الطاقة والبترول' },
    { id: 'industrial', label: '🏗️ قطاع المقاولات ومواد البناء' },
    { id: 'textile', label: '🧵 قطاع المنسوجات والسلع المعمرة' },
  ];

  useEffect(() => {
    setLoading(true);
    let url = `/api/news?category=${activeTab}&limit=100`;
    if (searchSymbol) {
      url += `&symbol=${searchSymbol.toUpperCase()}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNews(data.news || []);
        }
      })
      .catch(err => console.error('Error fetching news hub:', err))
      .finally(() => setLoading(false));
  }, [activeTab, searchSymbol]);

  // Client-side date filtering
  const filteredNews = useMemo(() => {
    if (!selectedDate) return news;
    return news.filter(item => {
      if (!item.published_at) return false;
      const itemDate = item.published_at.split('T')[0];
      return itemDate === selectedDate;
    });
  }, [news, selectedDate]);

  const formatDateWithTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const dateFormatted = d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const timeFormatted = d.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${dateFormatted} - ⏰ ${timeFormatted}`;
  };

  const getSourceBadge = (sourceStr: string) => {
    const src = (sourceStr || '').toLowerCase();
    let label = '🏛️ البورصة المصرية (رسمي)';
    let colorClass = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';

    if (src.includes('المال') || src.includes('almal')) {
      label = '📰 جريدة المال الاقتصادية';
      colorClass = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    } else if (src.includes('مباشر') || src.includes('mubasher')) {
      label = '📊 مباشر مصر';
      colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    } else if (src.includes('إنتربرايز') || src.includes('enterprise')) {
      label = '⚡ إنتربرايز الاقتصادية';
      colorClass = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    }

    return (
      <Badge className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${colorClass}`}>
        {label}
      </Badge>
    );
  };

  const getSectorBadge = (item: NewsItem) => {
    const sector = item.sector_name || item.companies?.sector || 'عام';
    let icon = '🏷️';
    if (sector.includes('بنك') || sector.includes('مالي')) icon = '🏦';
    else if (sector.includes('عقار') || sector.includes('إنشاء')) icon = '🏗️';
    else if (sector.includes('دواء') || sector.includes('صحة')) icon = '💊';
    else if (sector.includes('غذائ') || sector.includes('مشروب')) icon = '🌾';
    else if (sector.includes('اتصالات') || sector.includes('تكنولوجي')) icon = '📱';
    else if (sector.includes('طاقة') || sector.includes('بترول')) icon = '⚡';
    else if (sector.includes('منسوج') || sector.includes('سلع')) icon = '🧵';

    return (
      <Badge className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-zinc-800 text-amber-400 border border-amber-500/30">
        {icon} {sector}
      </Badge>
    );
  };

  const getImpactBadge = (item: NewsItem) => {
    const score = item.impact_score || 0;
    if (score >= 0.25 || item.sentiment === 'positive') {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-bold">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>تأثير إيجابي 🟩</span>
        </Badge>
      );
    } else if (score <= -0.25 || item.sentiment === 'negative') {
      return (
        <Badge className="bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1 font-bold">
          <TrendingDown className="w-3.5 h-3.5" />
          <span>تأثير سلبي 🔴</span>
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-bold">
        <Minus className="w-3.5 h-3.5" />
        <span>تأثير محايد 🟡</span>
      </Badge>
    );
  };

  const isSectorActive = sectorOptions.some(s => s.id === activeTab);

  return (
    <div className="w-full font-sans text-slate-100 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Top Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 pt-4 space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3 mb-2">
              <span className="p-2 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                <Newspaper className="w-7 h-7" />
              </span>
              <span>مركز الأخبار والإفصاحات والتحليل الذكي</span>
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              متابعة حية وشاملة لإفصاحات البورصة المصرية ومصادر الأخبار المالية الموثوقة مصنفة حسَب القطاع مع التوقيت المباشر وشرح الذكاء الاصطناعي.
            </p>
          </div>

          {/* Search & Date Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Symbol Quick Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="text"
                placeholder="تصفية حسب الرمز (مثال: COMI)"
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value)}
                className="w-full pl-3 pr-10 py-2 rounded-2xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2 bg-slate-900 border border-white/10 px-3 py-2 rounded-2xl text-xs">
              <Calendar className="w-4 h-4 text-amber-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer font-mono text-xs"
              />
              {selectedDate && (
                <button 
                  onClick={() => setSelectedDate('')}
                  className="text-[10px] text-slate-400 hover:text-white bg-slate-800 px-1.5 py-0.5 rounded cursor-pointer"
                >
                  إلغاء
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Clean Filter Tabs + Sector Dropdown */}
        <div className="flex flex-wrap items-center gap-3 p-2 bg-slate-900/90 border border-white/10 rounded-2xl backdrop-blur-md">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'all' ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25' : 'text-slate-400 hover:text-white'
            }`}
          >
            🌐 جميع الأخبار والإفصاحات
          </button>

          <button
            onClick={() => setActiveTab('egx_bulletin')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'egx_bulletin' ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25' : 'text-slate-400 hover:text-white'
            }`}
          >
            🏛️ أخبار وإفصاحات البورصة الرسمية
          </button>

          <button
            onClick={() => setActiveTab('corporate')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'corporate' ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25' : 'text-slate-400 hover:text-white'
            }`}
          >
            🏢 إفصاحات وقوائم الشركات
          </button>

          {/* Sector Dropdown Select */}
          <div className="relative">
            <select
              value={isSectorActive ? activeTab : ''}
              onChange={(e) => {
                if (e.target.value) setActiveTab(e.target.value);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer focus:outline-none transition-all appearance-none pr-8 ${
                isSectorActive 
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 border border-amber-400' 
                  : 'bg-slate-800 text-slate-300 border border-white/10 hover:border-amber-400/50'
              }`}
            >
              <option value="" disabled>📂 اختر القطاع للفلترة...</option>
              {sectorOptions.map(sec => (
                <option key={sec.id} value={sec.id} className="bg-slate-900 text-white py-1">
                  {sec.label}
                </option>
              ))}
            </select>
            <ChevronDown className={`w-4 h-4 absolute left-2.5 top-2.5 pointer-events-none ${isSectorActive ? 'text-slate-950' : 'text-slate-400'}`} />
          </div>
        </div>
      </motion.div>

      {/* Main News List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 w-full bg-white/5 rounded-2xl" />
          <Skeleton className="h-48 w-full bg-white/5 rounded-2xl" />
        </div>
      ) : filteredNews.length === 0 ? (
        <Card className="p-12 text-center glass-panel">
          <Newspaper className="w-16 h-16 text-slate-500 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-white mb-2">لا توجد أخبار مسجلة لعملية الفرز المحددة</h3>
          <p className="text-xs text-slate-400">جرب اختيار قطاع آخر أو مسح فلتر التاريخ لمشاهدة جميع إفصاحات البورصة المصرية.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredNews.map((item) => {
            const newsUrl = item.url || item.source_url || '#';
            const sym = item.symbol || item.companies?.symbol;

            return (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-6 glass-card h-full flex flex-col justify-between gap-4 group hover:border-cyan-500/40 transition-colors">
                  <div className="flex flex-col gap-3">
                    {/* Top Bar: Source, Sector Badge, Stock Tag & Impact */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {getSourceBadge(item.source)}
                        {getSectorBadge(item)}
                        {sym && (
                          <Link href={`/${params.locale}/stock/${sym}`} className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20">
                            ${sym}
                          </Link>
                        )}
                      </div>
                      <div>{getImpactBadge(item)}</div>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-black text-white group-hover:text-cyan-300 transition-colors leading-snug">
                      {item.title}
                    </h3>

                    {/* Content snippet */}
                    {item.content && (
                      <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                        {item.content}
                      </p>
                    )}

                    {/* AI Impact Explanation */}
                    {item.expected_impact_ar && (
                      <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 leading-normal flex items-start gap-3 mt-1">
                        <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-black text-white block mb-1">💡 شرح التأثير للمستثمر:</span>
                          <span>{item.expected_impact_ar}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer: Date & Time & Source Link */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-white/5 font-mono">
                    <span className="flex items-center gap-1.5 text-cyan-300">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      {formatDateWithTime(item.published_at)}
                    </span>
                    {newsUrl !== '#' && (
                      <a
                        href={newsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
                      >
                        <span>قراءة الإفصاح الأصلي</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
