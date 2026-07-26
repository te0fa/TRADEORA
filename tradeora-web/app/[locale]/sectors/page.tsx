'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell, CartesianGrid
} from 'recharts';
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
  Filter, 
  Sparkles,
  ArrowUpDown
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
        setSectors(Array.isArray(d) ? d : []);
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
      list.sort((a, b) => (b.avgChange ?? b.avg_change ?? 0) - (a.avgChange ?? a.avg_change ?? 0));
    } else if (sectorSort === 'losers') {
      list.sort((a, b) => (a.avgChange ?? a.avg_change ?? 0) - (b.avgChange ?? b.avg_change ?? 0));
    } else if (sectorSort === 'count') {
      list.sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
    }
    return list;
  }, [sectors, sectorSort]);

  // Chart data covering ALL sectors
  const chartData = useMemo(() => {
    return sortedSectors.map(s => {
      const avgChg = Number(s.avgChange ?? s.avg_change ?? 0);
      const netStr = Number(s.strength ?? s.net_strength ?? (s.rising - s.falling));
      const val = chartMetric === 'avg_change' ? avgChg : chartMetric === 'net_strength' ? netStr : s.total;

      return {
        name: s.sector || s.name,
        value: val,
        avgChange: avgChg,
        netStrength: netStr,
        rising: s.rising,
        falling: s.falling,
        total: s.total,
        winRate: s.win_rate || s.avgWinRate || 68.5,
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

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-surface-dark/95 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-sans text-white flex flex-col gap-2 min-w-[200px]">
          <span className="font-bold text-sm text-cyan-400 border-b border-white/10 pb-1.5">{d.name}</span>
          <div className="flex justify-between items-center font-mono">
            <span className="text-zinc-400">{isAr ? 'متوسط أداء القطاع:' : 'Avg Return:'}</span>
            <span className={`font-bold ${d.avgChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {d.avgChange >= 0 ? `+${d.avgChange.toFixed(2)}%` : `${d.avgChange.toFixed(2)}%`}
            </span>
          </div>
          <div className="flex justify-between items-center font-mono">
            <span className="text-zinc-400">{isAr ? 'حركة الأسهم:' : 'Rising / Falling:'}</span>
            <span><span className="text-emerald-400">{d.rising} 🟢</span> / <span className="text-rose-400">{d.falling} 🔴</span></span>
          </div>
          <div className="flex justify-between items-center font-mono">
            <span className="text-zinc-400">{isAr ? 'إجمالي الأسهم:' : 'Total Stocks:'}</span>
            <span className="font-bold text-white">{d.total} {isAr ? 'سهم' : 'stocks'}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      className="min-h-screen pb-20 font-sans text-text-primary max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" 
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pt-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">🏭</span>
            <span>{isAr ? 'مصفوفة وتحليل قطاعات البورصة المصرية' : 'EGX Sector Intelligence Matrix'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {isAr ? 'متابعة شاملة لكافة قطاعات السوق البالغ عددها 20+ قطاعاً وتقييم قوتها النسبية' : 'Real-time performance tracking and comparative analytics across all 20+ EGX sectors'}
          </p>
        </div>

        <Badge className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono font-bold text-xs px-3 py-1.5 self-start md:self-auto">
          {sectors.length} {isAr ? 'قطاعاً رئيساً متتبعاً' : 'Sectors Tracked'}
        </Badge>
      </div>

      {/* Professional Sector Performance Chart Card */}
      <Card hoverEffect={false} className="p-6 mb-10 glass-panel border border-cyan-500/20 bg-surface-dark/90 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-white font-black text-base flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <BarChart3 className="w-5 h-5" />
            </span>
            <span>{isAr ? 'مخطط مقارنة أداء كافة القطاعات (جميع القطاعات)' : 'All Sectors Comparative Analysis'}</span>
          </h3>

          {/* Metric Toggle & Sorting Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Toggle */}
            <div className="flex p-1 bg-black/40 border border-white/10 rounded-xl">
              <button
                onClick={() => setChartMetric('avg_change')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartMetric === 'avg_change' ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/30' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {isAr ? 'نسبة التغير %' : 'Avg Return %'}
              </button>
              <button
                onClick={() => setChartMetric('net_strength')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartMetric === 'net_strength' ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/30' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {isAr ? 'صافي القوة (صاعد-هابط)' : 'Net Strength'}
              </button>
            </div>

            {/* Sorting Filter */}
            <div className="flex p-1 bg-black/40 border border-white/10 rounded-xl">
              <button
                onClick={() => setSectorSort('gainers')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sectorSort === 'gainers' ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {isAr ? 'الأعلى أداءً' : 'Top Gainers'}
              </button>
              <button
                onClick={() => setSectorSort('losers')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sectorSort === 'losers' ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {isAr ? 'الأكثر تراجعاً' : 'Top Losers'}
              </button>
              <button
                onClick={() => setSectorSort('count')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sectorSort === 'count' ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {isAr ? 'حسب الأسهم' : 'Stock Count'}
              </button>
            </div>
          </div>
        </div>

        {/* Chart View */}
        <div className="w-full h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ bottom: 90, top: 10, left: 0, right: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8" 
                fontSize={10} 
                interval={0} 
                angle={-35} 
                textAnchor="end" 
                tickLine={false}
              />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} cursor="pointer">
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.value >= 0 ? '#10b981' : '#f43f5e'} 
                    onClick={() => setSelectedSector(entry.raw)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Sectors Grid Cards (All 20+ Sectors) */}
      <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <span>🏬</span>
          <span>{isAr ? 'كافة قطاعات البورصة (انقر للتفاصيل المباشرة)' : 'All Sector Cards (Click for details)'}</span>
        </h2>
        <span className="text-xs text-zinc-400 font-mono font-bold">
          {sectors.length} {isAr ? 'قطاعاً' : 'Sectors'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
        {sortedSectors.map((s) => {
          const regime = getSectorRegime(s);
          const avgChange = s.avgChange ?? s.avg_change ?? 0;
          const formattedAvgChange = avgChange >= 0 ? `+${avgChange.toFixed(2)}%` : `${avgChange.toFixed(2)}%`;
          
          return (
            <Card 
              key={s.sector || s.name} 
              onClick={() => setSelectedSector(s)}
              className="p-5 glass-card cursor-pointer hover:border-cyan-500/50 hover:bg-white/[0.03] transition-all flex flex-col justify-between gap-4 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2 border-b border-white/5 pb-2">
                  <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg border ${avgChange >= 0 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'}`}>
                    {formattedAvgChange}
                  </span>
                  <Badge variant={regime.variant}>{regime.text}</Badge>
                </div>
                <h3 className="text-base font-black text-white group-hover:text-cyan-300 transition-colors flex items-center justify-between">
                  <span>{s.sector || s.name}</span>
                  <span className="text-xs text-zinc-500 group-hover:text-cyan-400 transition-colors">➔</span>
                </h3>
              </div>

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
