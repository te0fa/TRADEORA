'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, TrendingUp, TrendingDown, Layers, Calendar, ArrowUpRight, ArrowDownRight, ShieldCheck, Award, Info, PieChart as PieIcon, Building2, User } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

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

  // Pie chart distributions matching EGX official statistics
  const pieNationality = [
    { name: isAr ? 'مصريين' : 'Egyptians', value: 95.92, color: '#3B82F6' },
    { name: isAr ? 'عرب' : 'Arabs', value: 2.91, color: '#EAB308' },
    { name: isAr ? 'أجانب' : 'Foreigners', value: 1.17, color: '#10B981' },
  ];

  const pieCategory = [
    { name: isAr ? 'أفراد' : 'Retail', value: 91.02, color: '#3B82F6' },
    { name: isAr ? 'مؤسسات' : 'Institutions', value: 8.97, color: '#EAB308' },
  ];

  function formatEGP(val: number): string {
    if (val === 0) return '0';
    return val.toLocaleString('en-US');
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
                {isAr ? 'بيانات البورصة المصرية الرسمية (EGX Official Flows)' : 'Official EGX Investor Flows'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {isAr ? 'شاشة تدفقات الأجانب والمؤسسات والأفراد (EGX Investor Flow Analytics)' : 'EGX Investor Flow Analytics'}
            </h1>
            <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
              {isAr 
                ? 'متابعة تفصيلية رسمية لقيم الشراء والبيع والصافي للأفراد والمؤسسات (مصريين، عرب، وأجانب) ومقارنة النسب ورسوم توزيع السيولة بالجلسة.'
                : 'Official breakdown of buy, sell, and net values for Egyptian, Arab, and Foreign retail & institutional investors.'}
            </p>
          </div>

          {latest && (
            <div className="bg-zinc-900/90 border border-emerald-500/30 px-5 py-3.5 rounded-2xl text-right font-mono">
              <span className="text-xs text-zinc-400 block mb-1">{isAr ? 'إشارة صافي التدفقات' : 'Current Flow Signal'}</span>
              <span className={`text-sm font-bold px-3 py-1 rounded-md inline-block ${
                latest.foreigners_net >= 0 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {latest.foreigners_net >= 0 ? '🟢 دخول وسيولة إيجابية للأجانب' : '🔴 ضغط بيعي أجنبي'}
              </span>
            </div>
          )}
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
            <span className="text-xs text-zinc-500 font-mono">EGX Official</span>
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
                  {pieNationality.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [`${val}%`, 'النسبة']} />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none font-mono">
              <span className="text-[11px] text-zinc-400">{isAr ? 'مصريين' : 'Egyptians'}</span>
              <span className="text-xl font-black text-blue-400">95.92%</span>
            </div>
          </div>

          <div className="flex items-center justify-around text-xs font-mono pt-2 border-t border-zinc-800/80">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
              <span className="text-zinc-300">{isAr ? 'مصريين: 95.92%' : 'Egyptians: 95.92%'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
              <span className="text-zinc-300">{isAr ? 'عرب: 2.91%' : 'Arabs: 2.91%'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="text-zinc-300">{isAr ? 'أجانب: 1.17%' : 'Foreigners: 1.17%'}</span>
            </div>
          </div>
        </motion.div>

        {/* Chart 2: Distribution by Category (Retail vs Institutions) */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="glass-panel p-6 rounded-3xl border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-yellow-400" />
              {isAr ? 'توزيع التعاملات حسب الفئة (Retail vs Institutions)' : 'Share by Investor Type'}
            </h2>
            <span className="text-xs text-zinc-500 font-mono">EGX Official</span>
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
                  {pieCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [`${val}%`, 'النسبة']} />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none font-mono">
              <span className="text-[11px] text-zinc-400">{isAr ? 'أفراد' : 'Retail'}</span>
              <span className="text-xl font-black text-blue-400">91.02%</span>
            </div>
          </div>

          <div className="flex items-center justify-around text-xs font-mono pt-2 border-t border-zinc-800/80">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
              <span className="text-zinc-300">{isAr ? 'أفراد: 91.02%' : 'Retail: 91.02%'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
              <span className="text-zinc-300">{isAr ? 'مؤسسات: 8.97%' : 'Institutions: 8.97%'}</span>
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
            <span className="font-bold text-blue-400 block text-xs">1. سيولة الأفراد المصريين (+106.2M ج.م):</span>
            <p className="text-zinc-400">
              الأفراد يستحوذون على **91.02%** من تداولات السوق. صافي المشتريات الإيجابي للأفراد يعكس وجود **سيولة دخول قوية وقوة مضاربية مرتفعة** بالأسهم الصغيرة والمتوسطة.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
            <span className="font-bold text-emerald-400 block text-xs">2. شراء الأجانب الصافي (+11.15M ج.م):</span>
            <p className="text-zinc-400">
              سجل الأجانب ومؤسسات الأجانب شراءً صافياً بـ `+11.15 مليون جنيه`، مما يوفر **غطاء ثقة واستقرار للأسهم القيادية** (مثل CIB وطاقة وهيرمس وسيدي كرير).
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
            <span className="font-bold text-yellow-400 block text-xs">3. استيعاب ضغط مبيعات العرب والشركات:</span>
            <p className="text-zinc-400">
              رغم مبيعات العرب (-101M) والمؤسسات المصرية (-16.4M)، إلا أن **قوة مشتريات الأفراد والأجانب امتصت المبيعات بالكامل**، مما حافظ على توازن الجلسة.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Official Breakdown Tables (Matching EGX Tables Exactly) */}
      <div className="space-y-6">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Building2 className="w-6 h-6 text-emerald-400" />
          {isAr ? 'الجداول الرسمية المعتمدة لتدفقات الجلسة (بالجنيه المصري)' : 'Official EGX Breakdown Tables (EGP)'}
        </h2>

        {/* Table 1: Overall Totals by Nationality */}
        <div className="glass-panel p-5 rounded-3xl border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              {isAr ? '1. الإجمالي حسب الجنسية (Total by Nationality)' : 'Total by Nationality'}
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
                  <td className="p-3 text-zinc-300">5,894,648,049</td>
                  <td className="p-3 text-zinc-300">5,984,491,965</td>
                  <td className="p-3 font-bold text-emerald-400 bg-emerald-500/10">+89,843,917</td>
                </tr>
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-3 font-bold text-white">{isAr ? 'عرب' : 'Arabs'}</td>
                  <td className="p-3 text-zinc-300">230,833,345</td>
                  <td className="p-3 text-zinc-300">129,829,886</td>
                  <td className="p-3 font-bold text-rose-400 bg-rose-500/10">-101,003,459</td>
                </tr>
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-3 font-bold text-white">{isAr ? 'أجانب' : 'Foreigners'}</td>
                  <td className="p-3 text-zinc-300">66,627,810</td>
                  <td className="p-3 text-zinc-300">77,787,353</td>
                  <td className="p-3 font-bold text-emerald-400 bg-emerald-500/10">+11,159,543</td>
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
                  <td className="p-3 text-zinc-300">5,418,697,450</td>
                  <td className="p-3 text-zinc-300">5,524,954,563</td>
                  <td className="p-3 font-bold text-emerald-400 bg-emerald-500/10">+106,257,113</td>
                </tr>
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-3 font-bold text-white">{isAr ? 'عرب' : 'Arabs'}</td>
                  <td className="p-3 text-zinc-300">198,402,736</td>
                  <td className="p-3 text-zinc-300">120,446,686</td>
                  <td className="p-3 font-bold text-rose-400 bg-rose-500/10">-77,956,051</td>
                </tr>
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-3 font-bold text-white">{isAr ? 'أجانب' : 'Foreigners'}</td>
                  <td className="p-3 text-zinc-300">3,244,535</td>
                  <td className="p-3 text-zinc-300">7,352,575</td>
                  <td className="p-3 font-bold text-emerald-400 bg-emerald-500/10">+4,108,041</td>
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
                  <td className="p-3 text-zinc-300">475,950,599</td>
                  <td className="p-3 text-zinc-300">459,537,402</td>
                  <td className="p-3 font-bold text-rose-400 bg-rose-500/10">-16,413,197</td>
                </tr>
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-3 font-bold text-white">{isAr ? 'عرب' : 'Arabs'}</td>
                  <td className="p-3 text-zinc-300">32,430,609</td>
                  <td className="p-3 text-zinc-300">9,383,200</td>
                  <td className="p-3 font-bold text-rose-400 bg-rose-500/10">-23,047,409</td>
                </tr>
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-3 font-bold text-white">{isAr ? 'أجانب' : 'Foreigners'}</td>
                  <td className="p-3 text-zinc-300">63,383,276</td>
                  <td className="p-3 text-zinc-300">70,434,778</td>
                  <td className="p-3 font-bold text-emerald-400 bg-emerald-500/10">+7,051,502</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
