'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { TrendingUp, BarChart2, Calendar, Target, Shield, Award, HelpCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

interface PerformanceReport {
  id: string;
  report_date: string;
  overall_stats: {
    win_rate: number;
    sharpe: number;
    max_dd: number;
    total_trades: number;
    avg_pnl: number;
    benchmark_return: number;
  };
  feature_ic: Array<{
    feature: string;
    ic: number;
    p_value: number;
  }>;
  by_timeframe: Record<string, {
    win_rate: number;
    avg_pnl: number;
    sharpe: number;
    max_dd: number;
    count: number;
  }>;
  by_sector: Record<string, {
    win_rate: number;
    avg_pnl: number;
    sharpe: number;
    max_dd: number;
    count: number;
  }>;
  by_period: Record<string, {
    win_rate: number;
    avg_pnl: number;
    sharpe: number;
    max_dd: number;
    count: number;
  }>;
}

interface AnalyticsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { locale } = React.use(params);
  const isAr = locale === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<PerformanceReport[]>([]);
  const [activeReport, setActiveReport] = useState<PerformanceReport | null>(null);

  useEffect(() => {
    async function fetchReports() {
      try {
        const { data, error } = await supabase
          .from('performance_reports')
          .select('*')
          .order('report_date', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setReports(data);
          setActiveReport(data[0]);
        }
      } catch (err) {
        console.error('Error fetching performance reports:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto p-12 text-center glass-card rounded-2xl border border-white/5">
        <HelpCircle className="w-16 h-16 text-slate-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">
          {t('لا توجد تقارير أداء متوفرة بعد', 'No performance reports available yet')}
        </h2>
        <p className="text-slate-400 text-xs">
          {t('سيتم إنشاء التقرير الأول تلقائياً في نهاية جلسة التداول الأسبوعية.', 'The first report will be generated automatically at the end of the weekly trading session.')}
        </p>
      </div>
    );
  }

  // Format feature IC for charting
  const icData = activeReport?.feature_ic.map(f => ({
    name: f.feature,
    IC: parseFloat(f.ic.toFixed(4))
  })) || [];

  // Format sector metrics for charting
  const sectorData = activeReport ? Object.entries(activeReport.by_sector).map(([sector, stats]) => ({
    name: sector,
    'Win Rate': parseFloat(stats.win_rate.toFixed(1)),
    'Avg Return': parseFloat(stats.avg_pnl.toFixed(2))
  })) : [];

  // Format historical winrate trend
  const historyData = [...reports].reverse().map(r => ({
    date: new Date(r.report_date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' }),
    'Win Rate': parseFloat(r.overall_stats.win_rate.toFixed(1)),
    'Avg Return': parseFloat(r.overall_stats.avg_pnl.toFixed(2))
  }));

  return (
    <div className="w-full max-w-6xl mx-auto p-6 font-sans text-text-primary" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white mb-1 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-yellow-400" />
            <span>{t('📊 تحليلات الأداء المتقدمة', 'Performance Analytics')}</span>
          </h1>
          <p className="text-xs text-slate-400">
            {t('تحليل إحصائي وقياس فاعلية مؤشرات الذكاء الاصطناعي أسبوعياً', 'Weekly statistical analysis & AI feature evaluation')}
          </p>
        </div>

        {/* Report Selector */}
        <select
          value={activeReport?.id}
          onChange={(e) => {
            const found = reports.find(r => r.id === e.target.value);
            if (found) setActiveReport(found);
          }}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none cursor-pointer focus:border-yellow-400"
        >
          {reports.map(r => (
            <option key={r.id} value={r.id} className="bg-[#0D1B2A] text-white">
              {t('تقرير الأسبوع المنتهي في: ', 'Week ended: ')} {new Date(r.report_date).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {activeReport && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-yellow-500/5 to-transparent">
              <p className="text-[10px] text-slate-400 mb-1">{t('نسبة الصفقات الناجحة', 'Win Rate')}</p>
              <h3 className="text-2xl font-black text-yellow-400">{activeReport.overall_stats.win_rate.toFixed(1)}%</h3>
              <p className="text-[9px] text-slate-500 mt-1">{t('من إجمالي', 'From total of')} {activeReport.overall_stats.total_trades} {t('توصية مغلقة', 'closed recommendations')}</p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-emerald-500/5 to-transparent">
              <p className="text-[10px] text-slate-400 mb-1">{t('متوسط ربح الصفقة', 'Average Return')}</p>
              <h3 className="text-2xl font-black text-emerald-400">{activeReport.overall_stats.avg_pnl.toFixed(2)}%</h3>
              <p className="text-[9px] text-slate-500 mt-1">{t('مقابل عائد مؤشر السوق: ', 'Vs market return: ')} {activeReport.overall_stats.benchmark_return.toFixed(2)}%</p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-blue-500/5 to-transparent">
              <p className="text-[10px] text-slate-400 mb-1">{t('معامل شارب للمخاطر', 'Sharpe Ratio')}</p>
              <h3 className="text-2xl font-black text-blue-400">{activeReport.overall_stats.sharpe.toFixed(2)}</h3>
              <p className="text-[9px] text-slate-500 mt-1">{t('يقيس الربحية بالنسبة للمخاطرة', 'Measures risk-adjusted return')}</p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-red-500/5 to-transparent">
              <p className="text-[10px] text-slate-400 mb-1">{t('أقصى تراجع للمحفظة', 'Max Drawdown')}</p>
              <h3 className="text-2xl font-black text-red-400">{activeReport.overall_stats.max_dd.toFixed(1)}%</h3>
              <p className="text-[9px] text-slate-500 mt-1">{t('أقصى خسارة متتالية مرصودة', 'Max peak-to-trough drop')}</p>
            </div>
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Feature Information Coefficient (IC) */}
            <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-white/5">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-yellow-400" />
                <span>{t('🧬 قوة ارتباط المؤشرات بالربحية (Information Coefficient - IC)', 'Feature Information Coefficient (IC)')}</span>
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={icData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} angle={-30} textAnchor="end" height={50} />
                    <YAxis stroke="#94a3b8" fontSize={10} domain={[-0.5, 0.5]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0D1B2A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }} />
                    <Bar dataKey="IC" fill="#C9A84C">
                      {icData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.IC >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Timeframe Analysis */}
            <div className="glass-card p-6 rounded-2xl border border-white/5">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-yellow-400" />
                <span>{t('⏱️ الأداء حسب الفريم الزمني', 'Performance by Timeframe')}</span>
              </h2>
              <div className="space-y-4">
                {Object.entries(activeReport.by_timeframe).map(([tf, stat]) => (
                  <div key={tf} className="bg-white/[0.02] p-3.5 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-300">{tf}</span>
                      <span className="text-[10px] text-slate-500">{stat.count} {t('توصية', 'trades')}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[9px] text-slate-400">{t('نجاح', 'Win %')}</p>
                        <p className="text-xs font-bold text-yellow-400">{stat.win_rate.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400">{t('عائد', 'Return')}</p>
                        <p className="text-xs font-bold text-emerald-400">{stat.avg_pnl.toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400">{t('شارب', 'Sharpe')}</p>
                        <p className="text-xs font-bold text-blue-400">{stat.sharpe.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sector & Historical Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sector Analysis */}
            <div className="glass-card p-6 rounded-2xl border border-white/5">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-yellow-400" />
                <span>{t('🏢 أداء القطاعات بالسوق', 'Sector Performance')}</span>
              </h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectorData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0D1B2A', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="Win Rate" fill="#F0D080" />
                    <Bar dataKey="Avg Return" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Historical Trend */}
            <div className="glass-card p-6 rounded-2xl border border-white/5">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-400" />
                <span>{t('📈 منحنى الأداء التاريخي أسبوعياً', 'Historical Performance Trend')}</span>
              </h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0D1B2A', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Line type="monotone" dataKey="Win Rate" stroke="#F0D080" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Avg Return" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
