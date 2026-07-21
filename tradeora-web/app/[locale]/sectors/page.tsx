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

export default function SectorsPage() {
  const { locale } = useParams();
  const router = useRouter();
  const [sectors, setSectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="min-h-screen pb-20 font-sans text-text-primary" 
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <motion.h1 variants={itemVariants} className="text-3xl font-black text-white mb-8 flex items-center gap-3">
        <span className="text-accent-blue">🏭</span>
        <span>{locale === 'ar' ? 'تحليل القطاعات المصرية' : 'Egypt EGX Sector Analysis'}</span>
      </motion.h1>

      {/* Bar Chart */}
      <motion.div variants={itemVariants}>
        <Card hoverEffect={false} className="p-6 mb-8">
          <h3 className="text-white font-bold text-base mb-6 flex items-center gap-2">
            <span className="text-accent-gold">📊</span>
            {locale === 'ar' ? 'قوة كل قطاع (شراء - بيع)' : 'Sector Strength (Buy - Sell)'}
          </h3>
          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectors.slice(0, 10)} margin={{ bottom: 60 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#71717a', fontSize: 11, fontWeight: 500 }}
                  angle={-35}
                  textAnchor="end"
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#71717a', fontSize: 11 }} 
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{
                    background: 'rgba(11, 15, 25, 0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    color: 'white',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <Bar dataKey="strength" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  {sectors.slice(0, 10).map((s, i) => (
                    <Cell
                      key={i}
                      fill={s.strength > 0 ? '#10B981' : s.strength < 0 ? '#EF4444' : '#71717A'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <MacroNewsPanel />
      </motion.div>

      {/* Sector Cards */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sectors.map(s => {
          const regime = getSectorRegime(s);
          return (
            <motion.div variants={itemVariants} key={s.name}>
              <Card hoverEffect={true} className="p-5 h-full flex flex-col cursor-default">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-white font-extrabold text-base leading-tight">
                      {s.name}
                    </h3>
                    <Badge variant={regime.variant} className="w-max">
                      {regime.text}
                    </Badge>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                    s.avgChange > 0
                      ? 'bg-up-green-bg text-up-green border border-up-green/20'
                      : s.avgChange < 0
                        ? 'bg-down-red-bg text-down-red border border-down-red/20'
                        : 'bg-white/5 text-zinc-400 border border-white/10'
                  }`}>
                    {s.avgChange > 0 ? '+' : ''}
                    {s.avgChange?.toFixed(2)}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center mb-4 mt-auto">
                  <div className="glass-input rounded-xl p-3 flex flex-col justify-center items-center">
                    <p className="text-zinc-500 text-[10px] font-bold mb-1 uppercase tracking-wider">
                      {locale === 'ar' ? 'الأسهم' : 'Stocks'}
                    </p>
                    <p className="text-white font-black text-lg">
                      {s.total}
                    </p>
                  </div>
                  <div className="bg-up-green-bg/50 border border-up-green/10 rounded-xl p-3 flex flex-col justify-center items-center">
                    <p className="text-up-green/80 text-[10px] font-bold mb-1 uppercase tracking-wider">
                      {locale === 'ar' ? 'شراء' : 'Buy'}
                    </p>
                    <p className="text-up-green font-black text-lg">
                      {s.buySignals}
                    </p>
                  </div>
                  <div className="bg-down-red-bg/50 border border-down-red/10 rounded-xl p-3 flex flex-col justify-center items-center">
                    <p className="text-down-red/80 text-[10px] font-bold mb-1 uppercase tracking-wider">
                      {locale === 'ar' ? 'بيع' : 'Sell'}
                    </p>
                    <p className="text-down-red font-black text-lg">
                      {s.sellSignals}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between text-xs items-center font-mono mt-2">
                  <div className="flex items-center gap-3">
                    <span className="text-up-green/70 text-[11px] font-bold bg-up-green/5 px-2 py-0.5 rounded">
                      ▲ {s.rising}
                    </span>
                    <span className="text-down-red/70 text-[11px] font-bold bg-down-red/5 px-2 py-0.5 rounded">
                      ▼ {s.falling}
                    </span>
                  </div>
                  {s.avgWinRate > 0 && (
                    <span className={`font-bold text-[11px] px-2 py-0.5 rounded ${
                      s.avgWinRate >= 60 ? 'bg-accent-gold/10 text-accent-gold' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      WR: {s.avgWinRate.toFixed(0)}%
                    </span>
                  )}
                </div>

                {/* Progress Bar for Strength */}
                <div className="mt-4 h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                  <div
                    className={`absolute top-0 bottom-0 rounded-full transition-all duration-1000 ${s.strength > 0 ? 'bg-up-green shadow-[0_0_10px_#10B981]' : 'bg-down-red shadow-[0_0_10px_#EF4444]'}`}
                    style={{
                      width: `${s.total > 0 ? Math.min(Math.abs(s.strength) / s.total * 100, 100) : 0}%`,
                      [locale === 'ar' ? 'right' : 'left']: 0
                    }}
                  />
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
