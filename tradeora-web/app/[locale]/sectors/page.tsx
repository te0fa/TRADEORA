'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MacroNewsPanel } from '@/components/dashboard/MacroNewsPanel';
import { SectorDetailModal } from '@/components/sectors/SectorDetailModal';

export default function SectorsPage() {
  const { locale } = useParams();
  const router = useRouter();
  const [sectors, setSectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState<any | null>(null);

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

  if (loading) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-white/10 border-t-accent-blue rounded-full animate-spin"></div>
        <span className="text-sm text-zinc-400 font-medium">{locale === 'ar' ? 'جاري تحليل القطاعات...' : 'Analyzing sectors...'}</span>
      </div>
    );
  }

  const getSectorRegime = (s: any) => {
    const risingPct = s.total > 0 ? (s.rising / s.total) : 0;
    const fallingPct = s.total > 0 ? (s.falling / s.total) : 0;
    
    if (risingPct >= 0.60) {
      return {
        text: locale === 'ar' ? 'صاعد' : 'Bullish',
        variant: 'success' as const
      };
    } else if (fallingPct >= 0.60) {
      return {
        text: locale === 'ar' ? 'هابط' : 'Bearish',
        variant: 'danger' as const
      };
    } else {
      return {
        text: locale === 'ar' ? 'مختلط' : 'Mixed',
        variant: 'warning' as const
      };
    }
  };

  const chartData = sectors.map(s => ({
    name: s.sector || s.name,
    strength: s.rising - s.falling,
    rising: s.rising,
    falling: s.falling,
    avg_change: s.avg_change ?? s.avgChange ?? 0
  }));

  return (
    <div 
      className="min-h-screen pb-20 font-sans text-text-primary max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" 
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <h1 className="text-3xl font-black text-white mb-8 flex items-center gap-3 pt-4">
        <span className="p-2 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">🏭</span>
        <span>{locale === 'ar' ? 'تحليل وتوزيع القطاعات المصرية' : 'Egypt EGX Sector Analysis'}</span>
      </h1>

      {/* Bar Chart */}
      <Card hoverEffect={false} className="p-6 mb-8 glass-panel border border-cyan-500/20">
        <h3 className="text-white font-bold text-base mb-6 flex items-center gap-2">
          <span className="text-cyan-400">📊</span>
          {locale === 'ar' ? 'مقياس القوة النسبية للقطاعات (الأسهم الصاعدة - الهابطة)' : 'Sector Net Strength (Rising - Falling)'}
        </h3>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.slice(0, 10)} margin={{ bottom: 40, top: 10 }}>
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8" 
                fontSize={11} 
                interval={0} 
                angle={-20} 
                textAnchor="end" 
              />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                formatter={(val: any) => [`${val} سهم`, 'صافي قوة القطاع']}
              />
              <Bar dataKey="strength" radius={[6, 6, 0, 0]}>
                {chartData.slice(0, 10).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.strength >= 0 ? '#10b981' : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Sectors Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {sectors.map((s) => {
          const regime = getSectorRegime(s);
          const avgChange = s.avg_change ?? s.avgChange ?? 0;
          const formattedAvgChange = avgChange >= 0 ? `+${avgChange.toFixed(2)}%` : `${avgChange.toFixed(2)}%`;
          return (
            <Card 
              key={s.sector || s.name} 
              onClick={() => setSelectedSector(s)}
              className="p-5 glass-card cursor-pointer hover:border-cyan-500/50 transition-all flex flex-col justify-between gap-4 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2 border-b border-white/5 pb-2">
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                    {formattedAvgChange}
                  </span>
                  <Badge variant={regime.variant}>{regime.text}</Badge>
                </div>
                <h3 className="text-base font-black text-white group-hover:text-cyan-300 transition-colors">
                  {s.sector || s.name}
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono border-t border-white/5 pt-3">
                <div className="flex flex-col bg-slate-900/60 p-2 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 font-bold">{locale === 'ar' ? 'صاعد' : 'Rising'}</span>
                  <span className="text-emerald-400 font-bold mt-0.5">{s.rising} 🟢</span>
                </div>
                <div className="flex flex-col bg-slate-900/60 p-2 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 font-bold">{locale === 'ar' ? 'هابط' : 'Falling'}</span>
                  <span className="text-rose-400 font-bold mt-0.5">{s.falling} 🔴</span>
                </div>
                <div className="flex flex-col bg-slate-900/60 p-2 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 font-bold">{locale === 'ar' ? 'الأسهم' : 'Total'}</span>
                  <span className="text-white font-bold mt-0.5">{s.total}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Sector Detail Modal */}
      <SectorDetailModal 
        sector={selectedSector}
        isOpen={Boolean(selectedSector)}
        onClose={() => setSelectedSector(null)}
        locale={locale as string}
      />
    </div>
  );
}
