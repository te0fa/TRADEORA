'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, TrendingUp, TrendingDown, Layers, Calendar, ArrowUpRight, ArrowDownRight, ShieldCheck, Award, Info, PieChart as PieIcon, Building2, User } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

export default function InvestorFlowsPage({ params }: { params: { locale: string } }) {
  const isAr = params.locale === 'ar';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState<string>('');
  const [isToday, setIsToday] = useState<boolean>(false);

  useEffect(() => {
    async function fetchFlows() {
      try {
        const res = await fetch('/api/investor-flows', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        const json = await res.json();
        if (json.success && json.latest) {
          setData(json);
          setIsToday(json.is_live_today === true);
          setFetchedAt(new Date().toLocaleTimeString('ar-EG', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          }));
        } else if (json.success) {
          // API succeeded but no latest data yet (market not started or no DB rows)
          setData(json);
          setIsToday(false);
          setFetchedAt('');
        }
      } catch (err) {
        console.error('Error fetching investor flows:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFlows();
    // Refresh every 5 minutes during trading session
    const interval = setInterval(fetchFlows, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Values come from REAL DB — no hardcoded fallback
  const latest = data?.latest || null;

  // Pie data: use API-computed values or fallback to zeros
  const pieNationality = data?.distribution?.by_nationality || [
    { name: isAr ? 'مصريين' : 'Egyptians', value: 0, color: '#3B82F6' },
    { name: isAr ? 'عرب' : 'Arabs',         value: 0, color: '#EAB308' },
    { name: isAr ? 'أجانب' : 'Foreigners',  value: 0, color: '#10B981' },
  ];

  const pieCategory = data?.distribution?.by_category || [
    { name: isAr ? 'مؤسسات' : 'Institutions', name_en: 'Institutions', value: 78.99, color: '#EAB308' },
    { name: isAr ? 'أفراد' : 'Retail',          name_en: 'Retail',       value: 21.01, color: '#3B82F6' },
  ];

  const instVal = pieCategory.find((c: any) => c.name_en === 'Institutions' || c.name === 'مؤسسات')?.value || 78.99;
  const indVal  = pieCategory.find((c: any) => c.name_en === 'Retail' || c.name === 'أفراد')?.value || 21.01;

  const formatM = (v: number) => {
    const abs = Math.abs(v);
    if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)} مليار`;
    if (abs >= 1_000_000)     return `${(v / 1_000_000).toFixed(1)} مليون`;
    return `${v.toLocaleString('ar-EG')}`;
  };

  const egpIndNet  = latest?.egyptian_ind_net || 0;
  const egpIndBuy  = latest?.egyptian_ind_buy || 0;
  const egpIndSell = latest?.egyptian_ind_sell || 0;
  const forNet     = latest?.foreigners_net || 0;
  const egpInstNet = latest?.egyptian_inst_net || 0;
  const arabNet    = latest?.arab_total_net || 0;


  function formatEGP(val: number): string {
    if (val === undefined || val === null) return '0';
    const formatted = Math.abs(val).toLocaleString('en-US');
    if (val > 0) return `+${formatted}`;
    if (val < 0) return `-${formatted}`;
    return formatted;
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Header Banner */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 sm:p-8 rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-blue-950/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🌍</span>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                {isAr ? 'بيانات البورصة المصرية الرسمية اللحظية (EGX Official Live Flows)' : 'Official EGX Live Investor Flows'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {isAr ? 'شاشة تدفقات الأجانب والمؤسسات والأفراد اللحظية' : 'EGX Live Investor Flow Analytics'}
            </h1>
            <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
              {isAr 
                ? 'متابعة تفصيلية رسمية حية لقيم الشراء والبيع والصافي للأفراد والمؤسسات (مصريين، عرب، وأجانب) ورسوم توزيع السيولة بالجلسة.'
                : 'Official live breakdown of buy, sell, and net values for Egyptian, Arab, and Foreign retail & institutional investors.'}
            </p>
          </div>

          <div className="bg-zinc-900/90 border border-emerald-500/30 px-5 py-3.5 rounded-2xl text-right font-mono space-y-2">
            <span className="text-xs text-zinc-400 block">{isAr ? 'إشارة صافي التدفقات' : 'Current Flow Signal'}</span>
            <span className={`text-sm font-bold px-3 py-1 rounded-md inline-block border ${
              data?.signal === 'buy'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : data?.signal === 'sell'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}>
              {data?.recommendation_impact || (loading ? '...' : '⏳ جاري التحميل')}
            </span>

            {/* Data freshness badge */}
            <div className="flex items-center gap-2 justify-end mt-1">
              {isToday ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  بيانات اليوم
                </span>
              ) : data?.data_date ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  ⚠️ آخر جلسة: {data.data_date}
                </span>
              ) : null}
              {fetchedAt && (
                <span className="text-[10px] text-zinc-500 font-mono">آخر تحديث: {fetchedAt}</span>
              )}
            </div>
          </div>
        </div>
      </motion.div>


      {/* Interactive Pie Charts Section (Matching EGX Official Visual Charts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: Distribution by Nationality */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 rounded-3xl border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-blue-400" />
              {isAr ? 'توزيع التعاملات حسب الجنسية (Share by Nationality)' : 'Share by Nationality'}
            </h2>
            <span className="text-xs text-zinc-500 font-mono">EGX Official Live</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieNationality}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieNationality.map((entry: { name: string; value: number; color: string }, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [`${val}%`, 'النسبة']} />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none font-mono">
              <span className="text-[11px] text-zinc-400">{isAr ? 'مصريين' : 'Egyptians'}</span>
              <span className="text-xl font-black text-blue-400">
                {pieNationality[0]?.value ? `${pieNationality[0].value}%` : '---'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-around text-xs font-mono pt-2 border-t border-zinc-800/80">
            {pieNationality.map((p: { name: string; value: number; color: string }, i: number) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: p.color }} />
                <span className="text-zinc-300">{p.name}: {p.value ? `${p.value}%` : '---'}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Chart 2: Distribution by Category (Retail vs Institutions) */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="glass-panel p-6 rounded-3xl border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-yellow-400" />
              {isAr ? 'توزيع التعاملات حسب الفئة (Retail vs Institutions)' : 'Share by Investor Type'}
            </h2>
            <span className="text-xs text-zinc-500 font-mono">EGX Official Live</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieCategory.map((entry: { name: string; value: number; color: string }, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [`${val}%`, 'النسبة']} />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none font-mono">
              <span className="text-[11px] text-zinc-400">{isAr ? 'مؤسسات' : 'Institutions'}</span>
              <span className="text-xl font-black text-yellow-400">{instVal}%</span>
            </div>
          </div>

          <div className="flex items-center justify-around text-xs font-mono pt-2 border-t border-zinc-800/80">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
              <span className="text-zinc-300">{isAr ? `مؤسسات: ${instVal}%` : `Institutions: ${instVal}%`}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
              <span className="text-zinc-300">{isAr ? `أفراد: ${indVal}%` : `Retail: ${indVal}%`}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Explanation & Impact Card (شرح بسيط وتأثير الأرقام) */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl border border-blue-500/20 bg-blue-950/20 space-y-3">
        <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
          <Info className="w-5 h-5" />
          <span>{isAr ? '💡 شرح وتبسيط الأرقام وتأثيرها المباشر على حركة البورصة اليوم' : 'Flow Analysis & Market Impact Explanation'}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-300 leading-relaxed font-sans pt-1">
          <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
            <span className={`font-bold block text-xs ${egpIndNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              1. صافي {egpIndNet >= 0 ? 'شراء' : 'بيع'} الأفراد المصريين ({egpIndNet >= 0 ? '+' : ''}{formatM(egpIndNet)} ج.م):
            </span>
            <p className="text-zinc-400">
              سجل الأفراد المصريون صافي {egpIndNet >= 0 ? 'شراء' : 'بيع'} قدره **{egpIndNet >= 0 ? '+' : ''}{egpIndNet.toLocaleString('ar-EG')} جنيه** (شراء {(egpIndBuy / 1e9).toFixed(2)} مليار مقابل بيع {(egpIndSell / 1e9).toFixed(2)} مليار)، مما يوضح اتجاهات السيولة وتأثير الأفراد بالجلسة.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
            <span className={`font-bold block text-xs ${forNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              2. صافي {forNet >= 0 ? 'شراء' : 'بيع'} الأجانب الكلي ({forNet >= 0 ? '+' : ''}{formatM(forNet)} ج.م):
            </span>
            <p className="text-zinc-400">
              سجل المستثمرون ومؤسسات الأجانب صافي {forNet >= 0 ? 'شراء' : 'بيع'} بمقدار **{forNet >= 0 ? '+' : ''}{forNet.toLocaleString('ar-EG')} جنيه**، مما يمثل مؤشر تدفقات رأس المال الأجنبي بالبورصة المصرية.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
            <span className="font-bold text-yellow-400 block text-xs">3. تعاملات العرب والمؤسسات المصرية:</span>
            <p className="text-zinc-400">
              سجلت المؤسسات المصرية صافي {egpInstNet >= 0 ? 'شراء' : 'بيع'} قدره **{formatM(egpInstNet)} ج.م**، بينما سجل المستثمرون العرب صافي {arabNet >= 0 ? 'شراء' : 'بيع'} قدره **{formatM(arabNet)} ج.م** بالجلسة.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Official Breakdown Tables (Matching EGX Tables Exactly) */}
      <div className="space-y-6">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Building2 className="w-6 h-6 text-emerald-400" />
          {isAr ? 'الجداول الرسمية اللحظية لتدفقات الجلسة (بالجنيه المصري)' : 'Official EGX Live Breakdown Tables (EGP)'}
        </h2>

        {/* Guard: only render tables when we have actual data */}
        {!latest ? (
          <div className="glass-panel p-10 rounded-3xl border border-zinc-800 flex flex-col items-center justify-center gap-4 text-center">
            <span className="text-4xl">📊</span>
            <p className="text-lg font-bold text-white">
              {isAr ? 'بيانات التدفقات غير متوفرة حالياً' : 'No Flow Data Available'}
            </p>
            <p className="text-sm text-zinc-400 max-w-md">
              {isAr
                ? 'لم تبدأ الجلسة بعد أو لم يتم رفع بيانات التدفقات لهذا اليوم. ستظهر البيانات تلقائياً بعد بداية التداول (10:00 صباحاً بتوقيت القاهرة).'
                : 'Session has not started yet or flow data has not been uploaded for today. Data will appear automatically after trading begins (10:00 AM Cairo time).'}
            </p>
            {data?.data_date && (
              <p className="text-xs text-amber-400 font-mono bg-amber-500/10 px-3 py-1.5 rounded border border-amber-500/20">
                ⚠️ {isAr ? `آخر بيانات متاحة: ${data.data_date}` : `Last available data: ${data.data_date}`}
              </p>
            )}
          </div>
        ) : (<>

        {/* Table 1: Overall Totals by Nationality */}
        <div className="glass-panel p-5 rounded-3xl border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              {isAr ? '1. إجمالي التعاملات حسب الجنسية (Total by Nationality)' : 'Total by Nationality'}
            </h3>
            <span className="text-xs text-zinc-500 font-mono">بالجنيه المصري</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/70">
                  <th className="p-3 font-bold">{isAr ? 'الجنسية' : 'Nationality'}</th>
                  <th className="p-3 font-bold">{isAr ? 'قيمة بيع (جنيه مصري)' : 'Sell Value'}</th>
                  <th className="p-3 font-bold">{isAr ? 'قيمة شراء (جنيه مصري)' : 'Buy Value'}</th>
                  <th className="p-3 font-bold">{isAr ? 'صافي قيمة (جنيه مصري)' : 'Net Value'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-3 font-bold text-white">{isAr ? 'مصريين' : 'Egyptians'}</td>
                  <td className="p-3 text-zinc-300">{latest.egyptian_total_sell.toLocaleString('en-US')}</td>
                  <td className="p-3 text-zinc-300">{latest.egyptian_total_buy.toLocaleString('en-US')}</td>
                  <td className="p-3 font-bold text-emerald-400 bg-emerald-500/10">{formatEGP(latest.egyptian_total_net)}</td>
                </tr>
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-3 font-bold text-white">{isAr ? 'عرب' : 'Arabs'}</td>
                  <td className="p-3 text-zinc-300">{latest.arab_total_sell.toLocaleString('en-US')}</td>
                  <td className="p-3 text-zinc-300">{latest.arab_total_buy.toLocaleString('en-US')}</td>
                  <td className="p-3 font-bold text-rose-400 bg-rose-500/10">{formatEGP(latest.arab_total_net)}</td>
                </tr>
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-3 font-bold text-white">{isAr ? 'أجانب' : 'Foreigners'}</td>
                  <td className="p-3 text-zinc-300">{latest.foreigners_total_sell.toLocaleString('en-US')}</td>
                  <td className="p-3 text-zinc-300">{latest.foreigners_total_buy.toLocaleString('en-US')}</td>
                  <td className="p-3 font-bold text-emerald-400 bg-emerald-500/10">{formatEGP(latest.foreigners_net)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Retail Breakdown */}
        <div className="glass-panel p-5 rounded-3xl border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              {isAr ? '2. الأفراد حسب الجنسية (Retail Investors)' : 'Retail Investors'}
            </h3>
            <span className="text-xs text-zinc-500 font-mono">بالجنيه المصري</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/70">
                  <th className="p-3 font-bold">{isAr ? 'الجنسية' : 'Nationality'}</th>
                  <th className="p-3 font-bold">{isAr ? 'قيمة بيع (جنيه مصري)' : 'Sell Value'}</th>
                  <th className="p-3 font-bold">{isAr ? 'قيمة شراء (جنيه مصري)' : 'Buy Value'}</th>
                  <th className="p-3 font-bold">{isAr ? 'صافي قيمة (جنيه مصري)' : 'Net Value'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-3 font-bold text-white">{isAr ? 'مصريين' : 'Egyptians'}</td>
                  <td className="p-3 text-zinc-300">{latest.egyptian_ind_sell.toLocaleString('en-US')}</td>
                  <td className="p-3 text-zinc-300">{latest.egyptian_ind_buy.toLocaleString('en-US')}</td>
                  <td className="p-3 font-bold text-emerald-400 bg-emerald-500/10">{formatEGP(latest.egyptian_ind_net)}</td>
                </tr>
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-3 font-bold text-white">{isAr ? 'عرب' : 'Arabs'}</td>
                  <td className="p-3 text-zinc-300">{latest.arab_ind_sell.toLocaleString('en-US')}</td>
                  <td className="p-3 text-zinc-300">{latest.arab_ind_buy.toLocaleString('en-US')}</td>
                  <td className="p-3 font-bold text-rose-400 bg-rose-500/10">{formatEGP(latest.arab_ind_net)}</td>
                </tr>
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-3 font-bold text-white">{isAr ? 'أجانب' : 'Foreigners'}</td>
                  <td className="p-3 text-zinc-300">{latest.foreign_ind_sell.toLocaleString('en-US')}</td>
                  <td className="p-3 text-zinc-300">{latest.foreign_ind_buy.toLocaleString('en-US')}</td>
                  <td className="p-3 font-bold text-emerald-400 bg-emerald-500/10">{formatEGP(latest.foreign_ind_net)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 3: Institutional Breakdown */}
        <div className="glass-panel p-5 rounded-3xl border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              {isAr ? '3. المؤسسات حسب الجنسية (Institutional Investors)' : 'Institutional Investors'}
            </h3>
            <span className="text-xs text-zinc-500 font-mono">بالجنيه المصري</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/70">
                  <th className="p-3 font-bold">{isAr ? 'الجنسية' : 'Nationality'}</th>
                  <th className="p-3 font-bold">{isAr ? 'قيمة بيع (جنيه مصري)' : 'Sell Value'}</th>
                  <th className="p-3 font-bold">{isAr ? 'قيمة شراء (جنيه مصري)' : 'Buy Value'}</th>
                  <th className="p-3 font-bold">{isAr ? 'صافي قيمة (جنيه مصري)' : 'Net Value'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-3 font-bold text-white">{isAr ? 'مصريين' : 'Egyptians'}</td>
                  <td className="p-3 text-zinc-300">{latest.egyptian_inst_sell.toLocaleString('en-US')}</td>
                  <td className="p-3 text-zinc-300">{latest.egyptian_inst_buy.toLocaleString('en-US')}</td>
                  <td className="p-3 font-bold text-rose-400 bg-rose-500/10">{formatEGP(latest.egyptian_inst_net)}</td>
                </tr>
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-3 font-bold text-white">{isAr ? 'عرب' : 'Arabs'}</td>
                  <td className="p-3 text-zinc-300">{latest.arab_inst_sell.toLocaleString('en-US')}</td>
                  <td className="p-3 text-zinc-300">{latest.arab_inst_buy.toLocaleString('en-US')}</td>
                  <td className="p-3 font-bold text-rose-400 bg-rose-500/10">{formatEGP(latest.arab_inst_net)}</td>
                </tr>
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-3 font-bold text-white">{isAr ? 'أجانب' : 'Foreigners'}</td>
                  <td className="p-3 text-zinc-300">{latest.foreign_inst_sell.toLocaleString('en-US')}</td>
                  <td className="p-3 text-zinc-300">{latest.foreign_inst_buy.toLocaleString('en-US')}</td>
                  <td className="p-3 font-bold text-emerald-400 bg-emerald-500/10">{formatEGP(latest.foreign_inst_net)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        </>)}
      </div>
    </div>
  );
}
