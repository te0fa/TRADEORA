'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, TrendingUp, TrendingDown, Layers, Calendar, ArrowUpRight, ArrowDownRight, ShieldCheck, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';

export default function InvestorFlowsPage({ params }: { params: { locale: string } }) {
  const isAr = params.locale === 'ar';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFlows() {
      setLoading(true);
      try {
        const res = await fetch('/api/investor-flows');
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      } catch (err) {
        console.error('Error fetching investor flows:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFlows();
  }, []);

  const history = (data?.history || []).slice().reverse().map((h: any) => ({
    date: h.trade_date,
    foreigners: Number((Number(h.foreigners_net_egp || 0) / 1e6).toFixed(1)),
    egyptian_inst: Number((Number(h.egyptian_inst_net_egp || 0) / 1e6).toFixed(1)),
    arab: Number((Number(h.arab_net_egp || 0) / 1e6).toFixed(1)),
  }));

  const latest = data?.latest;
  const sectorRanking = data?.sector_ranking || [];

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 sm:p-8 rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-blue-950/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🌍</span>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                {isAr ? 'بيانات البورصة المصرية الرسمية (EGX Official Flows)' : 'Official EGX Investor Flows'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {isAr ? 'شاشة تدفقات الأجانب والمؤسسات (Foreign & Institutional Flows)' : 'Foreign & Institutional Flows Screen'}
            </h1>
            <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
              {isAr 
                ? 'متابعة حية وتحليل تجميع وتصريف الأجانب والمؤسسات المصرية والعربية، وتأثير صافي السيولة على توصيات الذكاء الاصطناعي.'
                : 'Real-time tracking of net foreign, Egyptian institutional, and Arab flows with AI recommendation signal impact.'}
            </p>
          </div>

          {latest && (
            <div className="bg-zinc-900/90 border border-emerald-500/30 px-5 py-3.5 rounded-2xl text-right font-mono">
              <span className="text-xs text-zinc-400 block mb-1">{isAr ? 'إشارة الاتجاه الحالية' : 'Current Signal'}</span>
              <span className={`text-sm font-bold px-3 py-1 rounded-md inline-block ${
                latest.foreigners_net >= 0 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {latest.foreigners_net >= 0 ? '🟢 شراء وتجميع أجنبي' : '🔴 بيع وتصريف أجنبي'}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* KPI Cards */}
      {latest && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-5 rounded-2xl border border-zinc-800">
            <span className="text-xs text-zinc-400 block font-mono mb-1">{isAr ? 'صافي شراء/بيع الأجانب' : 'Foreigners Net'}</span>
            <div className="flex items-center justify-between">
              <span className={`text-xl font-extrabold font-mono ${latest.foreigners_net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {(latest.foreigners_net / 1e6).toFixed(1)}M ج.م
              </span>
              {latest.foreigners_net >= 0 ? <ArrowUpRight className="w-5 h-5 text-emerald-400" /> : <ArrowDownRight className="w-5 h-5 text-rose-400" />}
            </div>
            <span className="text-[11px] text-zinc-500 mt-2 block font-mono">{latest.trade_date}</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-panel p-5 rounded-2xl border border-zinc-800">
            <span className="text-xs text-zinc-400 block font-mono mb-1">{isAr ? 'المؤسسات المصرية' : 'Egyptian Inst. Net'}</span>
            <div className="flex items-center justify-between">
              <span className={`text-xl font-extrabold font-mono ${latest.egyptian_inst_net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {(latest.egyptian_inst_net / 1e6).toFixed(1)}M ج.م
              </span>
              {latest.egyptian_inst_net >= 0 ? <ArrowUpRight className="w-5 h-5 text-emerald-400" /> : <ArrowDownRight className="w-5 h-5 text-rose-400" />}
            </div>
            <span className="text-[11px] text-zinc-500 mt-2 block font-mono">{latest.trade_date}</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-5 rounded-2xl border border-zinc-800">
            <span className="text-xs text-zinc-400 block font-mono mb-1">{isAr ? 'المؤسسات والأفراد العرب' : 'Arab Net'}</span>
            <div className="flex items-center justify-between">
              <span className={`text-xl font-extrabold font-mono ${latest.arab_net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {(latest.arab_net / 1e6).toFixed(1)}M ج.م
              </span>
              {latest.arab_net >= 0 ? <ArrowUpRight className="w-5 h-5 text-emerald-400" /> : <ArrowDownRight className="w-5 h-5 text-rose-400" />}
            </div>
            <span className="text-[11px] text-zinc-500 mt-2 block font-mono">{latest.trade_date}</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-panel p-5 rounded-2xl border border-zinc-800">
            <span className="text-xs text-zinc-400 block font-mono mb-1">{isAr ? 'تأثير الذكاء الاصطناعي (AI Boost)' : 'AI Signal Impact'}</span>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-emerald-400 font-mono">
                {data?.trend === 'bullish' ? '+15% Boost' : '+10% Boost'}
              </span>
              <Award className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">{data?.recommendation_impact}</p>
          </motion.div>
        </div>
      )}

      {/* 3-Month Historical Chart & Sector Attraction Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3-Month Interactive Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                {isAr ? 'تطور صافي تدفقات الأجانب والمؤسسات (آخر 3 أشهر)' : '3-Month Historical Flows Chart'}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {isAr ? 'مليون جنيه مصري (الأخضر = شراء صافي / الأحمر = بيع صافي)' : 'In Million EGP (Green = Net Inflow / Red = Net Outflow)'}
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(val: any) => [`${val}M EGP`, '']}
                  />
                  <ReferenceLine y={0} stroke="#52525b" />
                  <Bar dataKey="foreigners" name={isAr ? 'الأجانب' : 'Foreigners'} fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="egyptian_inst" name={isAr ? 'المؤسسات المصرية' : 'Egy Inst.'} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
                {loading ? 'جاري تحميل الرسم البياني...' : 'لا توجد بيانات رسم بياني'}
              </div>
            )}
          </div>
        </div>

        {/* Top Attracting Sectors This Week */}
        <div className="glass-panel p-6 rounded-3xl border border-zinc-800 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            {isAr ? 'أكثر القطاعات جذباً لسيولة الأجانب' : 'Top Sectors by Foreign Flows'}
          </h2>
          <p className="text-xs text-zinc-400">
            {isAr ? 'ترتيب القطاعات المصرية حسب إجمالي الشراء الأجنبي الصافي' : 'EGX Sector ranking by net foreign inflow'}
          </p>

          <div className="space-y-3 pt-2">
            {sectorRanking.map((sec: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center border border-emerald-500/20">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-bold text-zinc-200">{sec.sector_name}</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  +{(sec.foreigners_net_egp / 1e6).toFixed(1)}M ج.م
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="glass-panel p-6 rounded-3xl border border-zinc-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          {isAr ? 'السجل اليومي التفصيلي لجميع الفئات' : 'Daily Breakdown Table'}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs font-mono">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/50">
                <th className="p-3 font-bold">{isAr ? 'تاريخ الجلسة' : 'Date'}</th>
                <th className="p-3 font-bold">{isAr ? 'صافي الأجانب' : 'Foreign Net'}</th>
                <th className="p-3 font-bold">{isAr ? 'المؤسسات المصرية' : 'Egy Inst. Net'}</th>
                <th className="p-3 font-bold">{isAr ? 'المؤسسات والأفراد العرب' : 'Arab Net'}</th>
                <th className="p-3 font-bold">{isAr ? 'إجمالي قيمة التداول' : 'Total Volume'}</th>
              </tr>
            </thead>
            <tbody>
              {(data?.history || []).map((row: any, idx: number) => (
                <tr key={idx} className="border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors">
                  <td className="p-3 font-bold text-zinc-300">{row.trade_date}</td>
                  <td className="p-3 font-bold">
                    <span className={`px-2 py-0.5 rounded ${Number(row.foreigners_net_egp) >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                      {(Number(row.foreigners_net_egp || 0) / 1e6).toFixed(1)}M ج.م
                    </span>
                  </td>
                  <td className="p-3 font-bold">
                    <span className={`px-2 py-0.5 rounded ${Number(row.egyptian_inst_net_egp) >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                      {(Number(row.egyptian_inst_net_egp || 0) / 1e6).toFixed(1)}M ج.م
                    </span>
                  </td>
                  <td className="p-3 font-bold">
                    <span className={`px-2 py-0.5 rounded ${Number(row.arab_net_egp) >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                      {(Number(row.arab_net_egp || 0) / 1e6).toFixed(1)}M ج.م
                    </span>
                  </td>
                  <td className="p-3 text-zinc-400 font-bold">
                    {(Number(row.total_volume_egp || 3e9) / 1e9).toFixed(2)}B ج.م
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
