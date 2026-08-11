'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SectorDetailModal } from '@/components/sectors/SectorDetailModal';
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Layers, 
  Sparkles,
  ArrowUpDown,
  Zap,
  Activity,
  Maximize2
} from 'lucide-react';

export default function SectorsPage() {
  const { locale } = useParams();
  const isAr = locale === 'ar';

  const [sectors, setSectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState<any | null>(null);
  const [chartMetric, setChartMetric] = useState<'avg_change' | 'net_strength' | 'total'>('avg_change');
  const [sectorSort, setSectorSort] = useState<'gainers' | 'losers' | 'count'>('gainers');

  useEffect(() => {
    fetch('/api/sectors')
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : (d?.sectors || []);
        setSectors(list);
        setLoading(false);
      })
      .catch(e => {
        console.error('Error fetching sectors:', e);
        setLoading(false);
      });
  }, []);

  const getSectorRegime = (s: any) => {
    const rising = s.rising || 0;
    const falling = s.falling || 0;
    const total = s.total || 1;
    const risingPct = rising / total;
    const fallingPct = falling / total;
    
    if (risingPct >= 0.55) {
      return {
        text: isAr ? 'اتجاه صاعد 🟢' : 'Bullish',
        variant: 'success' as const
      };
    } else if (fallingPct >= 0.55) {
      return {
        text: isAr ? 'اتجاه هابط 🔴' : 'Bearish',
        variant: 'danger' as const
      };
    } else {
      return {
        text: isAr ? 'حركة عرضية 🟡' : 'Mixed',
        variant: 'warning' as const
      };
    }
  };

  // Sorted and prepared sectors list
  const sortedSectors = useMemo(() => {
    const list = [...sectors];
    if (sectorSort === 'gainers') {
      list.sort((a, b) => (b.avgChangePct ?? b.avgChange ?? b.avg_change ?? 0) - (a.avgChangePct ?? a.avgChange ?? a.avg_change ?? 0));
    } else if (sectorSort === 'losers') {
      list.sort((a, b) => (a.avgChangePct ?? a.avgChange ?? a.avg_change ?? 0) - (b.avgChangePct ?? b.avgChange ?? b.avg_change ?? 0));
    } else if (sectorSort === 'count') {
      list.sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
    }
    return list;
  }, [sectors, sectorSort]);

  // Prepared metric data for visualizer
  const chartData = useMemo(() => {
    const maxVal = Math.max(...sortedSectors.map(s => Math.abs(Number(s.avgChangePct ?? s.avgChange ?? s.avg_change ?? 0))), 0.1);

    return sortedSectors.map(s => {
      const avgChg = Number(s.avgChangePct ?? s.avgChange ?? s.avg_change ?? 0);
      const netStr = Number(s.strength ?? s.net_strength ?? ((s.rising ?? 0) - (s.falling ?? 0)));
      const val = chartMetric === 'avg_change' ? avgChg : chartMetric === 'net_strength' ? netStr : (s.total || 0);
      const barWidthPct = Math.min(100, Math.max(8, Math.round((Math.abs(avgChg) / maxVal) * 100)));

      return {
        name: s.sector_name || s.sector || s.name || 'قطاع',
        value: val,
        avgChange: avgChg,
        netStrength: netStr,
        rising: s.rising || 0,
        falling: s.falling || 0,
        unchanged: s.unchanged || 0,
        total: s.total || 0,
        barWidthPct,
        topGainer: s.topGainer,
        topLoser: s.topLoser,
        raw: s
      };
    });
  }, [sortedSectors, chartMetric]);

  if (loading) {
    return (
      <div className="w-full py-28 flex flex-col items-center justify-center gap-4 font-sans">
        <div className="w-12 h-12 border-4 border-white/10 border-t-cyan-400 rounded-full animate-spin"></div>
        <span className="text-sm text-zinc-400 font-bold">{isAr ? 'جاري تحليل كافة القطاعات بالبورصة المصرية...' : 'Analyzing all EGX sectors...'}</span>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen pb-20 font-sans text-text-primary max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" 
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pt-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10">🏭</span>
            <span>{isAr ? 'مصفوفة وتحليل قطاعات البورصة المصرية' : 'EGX Sector Intelligence Matrix'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {isAr ? 'متابعة لحظية شاملة لكافة قطاعات السوق الـ 16 وتقييم أداء الأسهم والأوزان النسبية' : 'Real-time performance tracking and comparative analytics across all 16 EGX sectors'}
          </p>
        </div>

        <Badge className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono font-bold text-xs px-3.5 py-1.5 self-start md:self-auto shadow-sm">
          {sectors.length} {isAr ? 'قطاعاً متتبعاً بالكامل' : 'Sectors Tracked'}
        </Badge>
      </div>

      {/* Professional Horizontal Sector Performance Visualizer Card */}
      <Card hoverEffect={false} className="p-5 sm:p-6 mb-10 glass-panel border border-cyan-500/20 bg-surface-dark/95 shadow-2xl rounded-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
          <h3 className="text-white font-black text-base flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <BarChart3 className="w-5 h-5" />
            </span>
            <span>{isAr ? 'مخطط مقارنة أداء قطاعات السوق (الترتيب بالسيولة والتغير %)' : 'All Sectors Comparative Performance Matrix'}</span>
          </h3>

          {/* Metric Toggle & Sorting Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sorting Filter */}
            <div className="flex p-1 bg-black/50 border border-white/10 rounded-xl">
              <button
                onClick={() => setSectorSort('gainers')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sectorSort === 'gainers' ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 font-black shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {isAr ? '🟢 الأعلى أداءً' : 'Top Gainers'}
              </button>
              <button
                onClick={() => setSectorSort('losers')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sectorSort === 'losers' ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 font-black shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {isAr ? '🔴 الأكثر تراجعاً' : 'Top Losers'}
              </button>
              <button
                onClick={() => setSectorSort('count')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sectorSort === 'count' ? 'bg-white/15 text-white shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {isAr ? 'حسب عدد الأسهم' : 'Stock Count'}
              </button>
            </div>
          </div>
        </div>

        {/* Sleek Horizontal Bar Visualizer */}
        <div className="space-y-3 font-sans">
          {chartData.map((d, idx) => {
            const isPositive = d.avgChange >= 0;

            return (
              <div
                key={d.name + idx}
                onClick={() => setSelectedSector(d.raw)}
                className="p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 group"
              >
                {/* Sector Title & Stats */}
                <div className="flex items-center gap-3 min-w-[240px] sm:w-[320px]">
                  <span className="text-xs font-mono font-bold text-zinc-500 w-5">
                    {idx + 1}.
                  </span>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                      <span>{d.name}</span>
                      <Maximize2 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity" />
                    </h4>
                    <span className="text-[11px] text-zinc-400 flex items-center gap-2 font-mono mt-0.5">
                      <span><strong className="text-emerald-400">{d.rising}</strong> 🟢</span>
                      <span>·</span>
                      <span><strong className="text-rose-400">{d.falling}</strong> 🔴</span>
                      <span>·</span>
                      <span>إجمالي {d.total} سهم</span>
                    </span>
                  </div>
                </div>

                {/* Progress Fill Bar */}
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 h-3.5 bg-black/60 rounded-full overflow-hidden border border-white/5 relative p-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${d.barWidthPct}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.02 }}
                      className={`h-full rounded-full shadow-lg ${
                        isPositive 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-emerald-500/20' 
                          : 'bg-gradient-to-r from-rose-500 to-red-600 shadow-rose-500/20'
                      }`}
                    />
                  </div>

                  {/* Percentage Badge */}
                  <span className={`text-xs font-mono font-black px-3 py-1 rounded-xl border min-w-[75px] text-center shadow-sm ${
                    isPositive
                      ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
                      : 'text-rose-400 bg-rose-500/15 border-rose-500/30'
                  }`}>
                    {isPositive ? `+${d.avgChange.toFixed(2)}%` : `${d.avgChange.toFixed(2)}%`}
                  </span>
                </div>

                {/* Top Gainer Pill */}
                {d.topGainer && (
                  <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 font-mono">
                    <span>🚀 {d.topGainer.symbol}</span>
                    <span className="font-bold">+{d.topGainer.change}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Sectors Grid Cards (All 16 Sectors) */}
      <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <span>🏬</span>
          <span>{isAr ? 'بطاقات تفاصيل قطاعات السوق المباشرة (انقر للتحليل التفصيلي)' : 'Live Sector Cards Matrix'}</span>
        </h2>
        <span className="text-xs text-zinc-400 font-mono font-bold">
          {sectors.length} {isAr ? 'قطاعاً' : 'Sectors'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
        {sortedSectors.map((s) => {
          const regime = getSectorRegime(s);
          const sectorTitle = s.sector_name || s.sector || s.name || 'قطاع رئيسي';
          const avgChange = Number(s.avgChangePct ?? s.avgChange ?? s.avg_change ?? 0);
          const formattedAvgChange = avgChange >= 0 ? `+${avgChange.toFixed(2)}%` : `${avgChange.toFixed(2)}%`;
          
          return (
            <Card 
              key={sectorTitle} 
              onClick={() => setSelectedSector(s)}
              className="p-5 glass-card cursor-pointer hover:border-cyan-500/50 hover:bg-white/[0.03] transition-all flex flex-col justify-between gap-4 group rounded-2xl border border-white/10"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3 border-b border-white/5 pb-2.5">
                  <Badge variant={regime.variant}>{regime.text}</Badge>
                  <span className={`text-xs font-mono font-black px-3 py-1 rounded-xl border shadow-sm ${
                    avgChange >= 0 
                      ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' 
                      : 'text-rose-400 bg-rose-500/15 border-rose-500/30'
                  }`}>
                    {formattedAvgChange}
                  </span>
                </div>

                <h3 className="text-base font-black text-white group-hover:text-cyan-300 transition-colors flex items-center justify-between">
                  <span>{sectorTitle}</span>
                  <span className="text-xs text-zinc-500 group-hover:text-cyan-400 transition-colors">➔</span>
                </h3>
              </div>

              {/* Top Gainer and Top Loser Badges */}
              {(s.topGainer || s.topLoser) && (
                <div className="space-y-1.5 text-xs font-mono border-t border-white/5 pt-3">
                  {s.topGainer && (
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                      <span className="text-[11px] font-sans font-bold flex items-center gap-1">🚀 الأعلى صعوداً:</span>
                      <span className="font-bold">{s.topGainer.symbol} ({s.topGainer.change > 0 ? '+' : ''}{s.topGainer.change}%)</span>
                    </div>
                  )}
                  {s.topLoser && (
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
                      <span className="text-[11px] font-sans font-bold flex items-center gap-1">🔻 الأكثر تراجعاً:</span>
                      <span className="font-bold">{s.topLoser.symbol} ({s.topLoser.change > 0 ? '+' : ''}{s.topLoser.change}%)</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono border-t border-white/5 pt-3">
                <div className="flex flex-col bg-black/40 p-2 rounded-xl border border-white/5">
                  <span className="text-[10px] text-zinc-400 font-bold font-sans">{isAr ? 'صاعد' : 'Rising'}</span>
                  <span className="text-emerald-400 font-bold mt-0.5">{s.rising || 0} 🟢</span>
                </div>
                <div className="flex flex-col bg-black/40 p-2 rounded-xl border border-white/5">
                  <span className="text-[10px] text-zinc-400 font-bold font-sans">{isAr ? 'هابط' : 'Falling'}</span>
                  <span className="text-rose-400 font-bold mt-0.5">{s.falling || 0} 🔴</span>
                </div>
                <div className="flex flex-col bg-black/40 p-2 rounded-xl border border-white/5">
                  <span className="text-[10px] text-zinc-400 font-bold font-sans">{isAr ? 'الأسهم' : 'Total'}</span>
                  <span className="text-white font-bold mt-0.5">{s.total || 0}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Sector Detail Intelligence Modal */}
      <SectorDetailModal 
        sector={selectedSector}
        isOpen={Boolean(selectedSector)}
        onClose={() => setSelectedSector(null)}
        locale={locale as string}
      />
    </div>
  );
}
