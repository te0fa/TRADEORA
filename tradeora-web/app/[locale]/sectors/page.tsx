'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';

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
      <div className="w-full py-20 flex flex-col items-center justify-center gap-3 font-sans">
        <div className="w-8 h-8 border-3 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin"></div>
        <span className="text-xs text-slate-400">{locale === 'ar' ? 'جاري تحليل القطاعات...' : 'Analyzing sectors...'}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 font-sans text-text-primary" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <span>🏭</span>
        <span>{locale === 'ar' ? 'تحليل القطاعات المصرية' : 'Egypt EGX Sector Analysis'}</span>
      </h1>

      {/* Bar Chart */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
        <h3 className="text-white font-bold text-sm mb-4">
          {locale === 'ar' ? 'قوة كل قطاع (شراء - بيع)' : 'Sector Strength (Buy - Sell)'}
        </h3>
        <div className="w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sectors.slice(0, 10)} margin={{ bottom: 60 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                angle={-35}
                textAnchor="end"
              />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '11px',
                }}
              />
              <Bar dataKey="strength" radius={[6, 6, 0, 0]}>
                {sectors.slice(0, 10).map((s, i) => (
                  <Cell
                    key={i}
                    fill={s.strength > 0 ? '#22c55e' : s.strength < 0 ? '#ef4444' : '#64748b'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectors.map(s => (
          <div
            key={s.name}
            className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/[0.08] hover:border-white/15 transition-all duration-200"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-white font-extrabold text-sm">
                {s.name}
              </h3>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                s.avgChange > 0
                  ? 'bg-green-500/20 text-green-400'
                  : s.avgChange < 0
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-slate-500/20 text-slate-400'
              }`}>
                {s.avgChange > 0 ? '+' : ''}
                {s.avgChange?.toFixed(2)}%
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="bg-white/5 rounded-lg p-2">
                <p className="text-slate-400 text-[10px]">
                  {locale === 'ar' ? 'الأسهم' : 'Stocks'}
                </p>
                <p className="text-white font-bold text-sm">
                  {s.total}
                </p>
              </div>
              <div className="bg-green-500/10 rounded-lg p-2">
                <p className="text-green-400 text-[10px]">
                  {locale === 'ar' ? 'شراء' : 'Buy'}
                </p>
                <p className="text-green-400 font-bold text-sm">
                  {s.buySignals}
                </p>
              </div>
              <div className="bg-red-500/10 rounded-lg p-2">
                <p className="text-red-400 text-[10px]">
                  {locale === 'ar' ? 'بيع' : 'Sell'}
                </p>
                <p className="text-red-400 font-bold text-sm">
                  {s.sellSignals}
                </p>
              </div>
            </div>

            <div className="flex justify-between text-xs items-center font-mono">
              <span className="text-slate-400 text-[10px]">
                ▲ {s.rising} | ▼ {s.falling}
              </span>
              {s.avgWinRate > 0 && (
                <span className={`font-bold text-[10px] ${
                  s.avgWinRate >= 60 ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  WR: {s.avgWinRate.toFixed(0)}%
                </span>
              )}
            </div>

            {/* Progress Bar للقوة */}
            <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${s.strength > 0 ? 'bg-green-400' : 'bg-red-400'}`}
                style={{
                  width: `${s.total > 0 ? Math.min(Math.abs(s.strength) / s.total * 100, 100) : 0}%`
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
