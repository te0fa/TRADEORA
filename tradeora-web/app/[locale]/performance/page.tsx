'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { toEasternArabic } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Clock, TrendingUp, Award, Activity, BarChart2, Briefcase, UserCheck, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface RecommendedTrade {
  id: string;
  symbol: string;
  direction: string;
  entry_price: number;
  tp1: number;
  tp2: number;
  sl: number;
  status: string;
  exit_reason: string | null;
  exit_price: number | null;
  pnl_percent: number | null;
  recommended_at: string;
  closed_at: string | null;
}

interface UserTrade {
  id: string;
  symbol: string;
  direction: string;
  entry_price: number;
  shares_count: number;
  tp1: number;
  tp2: number;
  sl: number;
  status: string;
  exit_reason: string | null;
  exit_price: number | null;
  pnl_percent: number | null;
  pnl_amount: number | null;
  activated_at: string;
  closed_at: string | null;
}

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState<'platform' | 'personal'>('platform');
  const [loading, setLoading] = useState(true);

  // Platform states
  const [platformTrades, setPlatformTrades] = useState<RecommendedTrade[]>([]);
  const [platformStats, setPlatformStats] = useState<any>(null);

  // Personal states
  const [personalTrades, setPersonalTrades] = useState<UserTrade[]>([]);
  const [personalStats, setPersonalStats] = useState<any>(null);

  useEffect(() => {
    // Fetch both datasets concurrently
    setLoading(true);
    Promise.all([
      fetch('/api/trades?limit=150').then(res => res.json()),
      fetch('/api/user-trades').then(res => res.json())
    ])
      .then(([platData, persData]) => {
        setPlatformTrades(platData.trades || []);
        setPlatformStats(platData.stats || null);
        
        if (persData.success) {
          setPersonalTrades(persData.trades || []);
          setPersonalStats(persData.stats || null);
        }
      })
      .catch(err => {
        console.error('Error fetching performance stats:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Format Helpers
  const formatNum = (num: number | null | undefined, precision: number = 2) => {
    if (num === null || num === undefined) return '-';
    return parseFloat(num.toFixed(precision)).toLocaleString('ar-EG');
  };

  const formatPercent = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '-';
    return `${num > 0 ? '+' : ''}${formatNum(num, 1)}%`;
  };

  // Recharts calculations for Platform
  const platformPieData = useMemo(() => {
    if (!platformStats) return [];
    return [
      { name: 'صفقات رابحة', value: platformStats.winning_trades, color: '#10B981' },
      { name: 'صفقات خاسرة', value: platformStats.losing_trades, color: '#EF4444' }
    ].filter(item => item.value > 0);
  }, [platformStats]);

  const platformLineData = useMemo(() => {
    const closed = platformTrades
      .filter(t => t.status === 'closed' && t.closed_at && t.pnl_percent !== null)
      .sort((a, b) => new Date(a.closed_at!).getTime() - new Date(b.closed_at!).getTime());

    let sum = 0;
    return closed.map((t, i) => {
      sum += t.pnl_percent || 0;
      return {
        tradeIndex: i + 1,
        date: new Date(t.closed_at!).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
        pnl: parseFloat(sum.toFixed(1)),
        symbol: t.symbol
      };
    });
  }, [platformTrades]);

  // Recharts calculations for Personal
  const personalPieData = useMemo(() => {
    if (!personalStats) return [];
    return [
      { name: 'صفقات رابحة', value: personalStats.winning_trades, color: '#10B981' },
      { name: 'صفقات خاسرة', value: personalStats.losing_trades, color: '#EF4444' }
    ].filter(item => item.value > 0);
  }, [personalStats]);

  const personalLineData = useMemo(() => {
    const closed = personalTrades
      .filter(t => t.status === 'closed' && t.closed_at && t.pnl_amount !== null)
      .sort((a, b) => new Date(a.closed_at!).getTime() - new Date(b.closed_at!).getTime());

    let sum = 0;
    return closed.map((t, i) => {
      sum += t.pnl_amount || 0;
      return {
        tradeIndex: i + 1,
        date: new Date(t.closed_at!).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
        pnl: parseFloat(sum.toFixed(1)),
        symbol: t.symbol
      };
    });
  }, [personalTrades]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        <Skeleton className="h-16 w-1/3" />
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 col-span-2 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full font-sans text-text-primary">
      {/* Title */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>📊</span>
            <span>مركز قياس الأداء والثقة</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            إحصائيات تفصيلية لمعدلات نجاح صفقات التوصيات الآلية والصفقات الفعلية بمحفظتك.
          </p>
        </div>

        {/* Tabs Control */}
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 text-xs self-start">
          <button
            onClick={() => setActiveTab('platform')}
            className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'platform' ? 'bg-accent-blue text-white' : 'text-text-secondary hover:text-white'
            }`}
          >
            📢 إشارات المنصة العامة
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'personal' ? 'bg-accent-blue text-white' : 'text-text-secondary hover:text-white'
            }`}
          >
            💼 محفظتي وصفقاتي الحقيقية
          </button>
        </div>
      </div>

      {activeTab === 'platform' ? (
        /* PLATFORM VIEW */
        <>
          {platformStats ? (
            <>
              {/* Cards Deck */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="glass-card p-4 rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.01] to-white/[0.002] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-text-secondary mb-1">
                    <span className="text-xs font-bold">معدل النجاح</span>
                    <Award className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-emerald-400 font-sans">
                      {platformStats.win_rate.toFixed(1)}%
                    </div>
                    <p className="text-[10px] text-text-secondary/60 mt-1">
                      بناءً على {toEasternArabic(platformStats.closed_trades)} صفقة مغلقة
                    </p>
                  </div>
                </div>

                <div className="glass-card p-4 rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.01] to-white/[0.002] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-text-secondary mb-1">
                    <span className="text-xs font-bold">إجمالي العائد التراكمي</span>
                    <TrendingUp className="w-4 h-4 text-accent-blue" />
                  </div>
                  <div>
                    <div className={`text-2xl font-black font-sans ${platformStats.total_pnl >= 0 ? 'text-accent-blue' : 'text-red-400'}`}>
                      {platformStats.total_pnl > 0 ? '+' : ''}{platformStats.total_pnl.toFixed(1)}%
                    </div>
                    <p className="text-[10px] text-text-secondary/60 mt-1">
                      الربح/الخسارة التراكمية المئوية
                    </p>
                  </div>
                </div>

                <div className="glass-card p-4 rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.01] to-white/[0.002] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-text-secondary mb-1">
                    <span className="text-xs font-bold">إجمالي التوصيات</span>
                    <Activity className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white font-sans">
                      {toEasternArabic(platformStats.total_trades)}
                    </div>
                    <p className="text-[10px] text-text-secondary/60 mt-1 flex gap-2">
                      <span className="text-emerald-400">رابحة: {toEasternArabic(platformStats.winning_trades)}</span>
                      <span className="text-red-400">خاسرة: {toEasternArabic(platformStats.losing_trades)}</span>
                    </p>
                  </div>
                </div>

                <div className="glass-card p-4 rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.01] to-white/[0.002] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-text-secondary mb-1">
                    <span className="text-xs font-bold">متوسط عائد الصفقة</span>
                    <BarChart2 className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <div className={`text-2xl font-black font-sans ${platformStats.avg_pnl >= 0 ? 'text-violet-400' : 'text-red-400'}`}>
                      {platformStats.avg_pnl > 0 ? '+' : ''}{platformStats.avg_pnl.toFixed(1)}%
                    </div>
                    <p className="text-[10px] text-text-secondary/60 mt-1">
                      متوسط الأداء للصفقة الواحدة
                    </p>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="glass-card p-5 rounded-2xl border border-white/5 flex flex-col">
                  <h2 className="text-xs font-bold text-text-primary mb-4">توزيع نتائج صفقات التوصيات</h2>
                  <div className="flex-1 flex flex-col items-center justify-center min-h-[220px]">
                    {platformPieData.length > 0 ? (
                      <div className="relative w-full h-48 flex justify-center items-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={platformPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={75}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {platformPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1E1E2E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '11px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute flex flex-col items-center justify-center font-sans">
                          <span className="text-[9px] text-text-secondary">Win Rate</span>
                          <span className="text-lg font-black text-emerald-400">{platformStats.win_rate.toFixed(0)}%</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-text-secondary">لا توجد تداولات مغلقة</span>
                    )}
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-white/5 lg:col-span-2 flex flex-col">
                  <h2 className="text-xs font-bold text-text-primary mb-4">منحنى نمو الأرباح التراكمية (%)</h2>
                  <div className="flex-1 min-h-[220px]">
                    {platformLineData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={platformLineData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                          <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={9} tickLine={false} reversed={true} />
                          <YAxis stroke="rgba(255,255,255,0.4)" fontSize={9} tickLine={false} orientation="right" />
                          <Tooltip contentStyle={{ backgroundColor: '#1E1E2E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '11px' }} />
                          <Line type="monotone" dataKey="pnl" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-text-secondary">لا توجد بيانات نمو كافية</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-text-secondary">لا توجد إحصائيات متوفرة للتوصيات.</div>
          )}
        </>
      ) : (
        /* PERSONAL PORTFOLIO VIEW */
        <>
          {personalStats ? (
            <>
              {/* Personal Cards Deck */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="glass-card p-4 rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.01] to-white/[0.002] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-text-secondary mb-1">
                    <span className="text-xs font-bold">نسبة نجاح محفظتي</span>
                    <Award className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-emerald-400 font-sans">
                      {personalStats.win_rate.toFixed(1)}%
                    </div>
                    <p className="text-[10px] text-text-secondary/60 mt-1">
                      بناءً على {toEasternArabic(personalStats.closed_trades)} صفقة منتهية
                    </p>
                  </div>
                </div>

                <div className="glass-card p-4 rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.01] to-white/[0.002] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-text-secondary mb-1">
                    <span className="text-xs font-bold">الأرباح والخسائر</span>
                    <TrendingUp className="w-4 h-4 text-accent-blue" />
                  </div>
                  <div>
                    <div className={`text-2xl font-black font-sans ${personalStats.total_pnl_amount >= 0 ? 'text-accent-blue' : 'text-red-400'}`}>
                      {personalStats.total_pnl_amount > 0 ? '+' : ''}{personalStats.total_pnl_amount.toLocaleString()} EGP
                    </div>
                    <p className="text-[10px] text-text-secondary/60 mt-1">
                      صافي الأرباح المحققة بالجنيه
                    </p>
                  </div>
                </div>

                <div className="glass-card p-4 rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.01] to-white/[0.002] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-text-secondary mb-1">
                    <span className="text-xs font-bold">أفضل صفقة</span>
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-emerald-400 font-sans">
                      {personalStats.best_trade_symbol}
                    </div>
                    <p className="text-[10px] text-text-secondary/60 mt-1">
                      بعائد {formatPercent(personalStats.best_trade_pct)}
                    </p>
                  </div>
                </div>

                <div className="glass-card p-4 rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.01] to-white/[0.002] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-text-secondary mb-1">
                    <span className="text-xs font-bold">أسوأ صفقة</span>
                    <XCircle className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-red-400 font-sans">
                      {personalStats.worst_trade_symbol}
                    </div>
                    <p className="text-[10px] text-text-secondary/60 mt-1">
                      بعائد {formatPercent(personalStats.worst_trade_pct)}
                    </p>
                  </div>
                </div>

                <div className="glass-card p-4 rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.01] to-white/[0.002] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-text-secondary mb-1">
                    <span className="text-xs font-bold">نشط بالمحفظة</span>
                    <Activity className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white font-sans">
                      {toEasternArabic(personalStats.active_trades)}
                    </div>
                    <p className="text-[10px] text-text-secondary/60 mt-1">
                      صفقات قيد المتابعة حالياً
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="glass-card p-5 rounded-2xl border border-white/5 flex flex-col">
                  <h2 className="text-xs font-bold text-text-primary mb-4">توزيع نتائج تداولاتي</h2>
                  <div className="flex-1 flex flex-col items-center justify-center min-h-[220px]">
                    {personalPieData.length > 0 ? (
                      <div className="relative w-full h-48 flex justify-center items-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={personalPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={75}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {personalPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1E1E2E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '11px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute flex flex-col items-center justify-center font-sans">
                          <span className="text-[9px] text-text-secondary">نجاح المحفظة</span>
                          <span className="text-lg font-black text-emerald-400">{personalStats.win_rate.toFixed(0)}%</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-text-secondary">لا توجد صفقات مغلقة بعد</span>
                    )}
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-white/5 lg:col-span-2 flex flex-col">
                  <h2 className="text-xs font-bold text-text-primary mb-4">نمو الرصيد الفعلي التراكمي (EGP)</h2>
                  <div className="flex-1 min-h-[220px]">
                    {personalLineData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={personalLineData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                          <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={9} tickLine={false} reversed={true} />
                          <YAxis stroke="rgba(255,255,255,0.4)" fontSize={9} tickLine={false} orientation="right" />
                          <Tooltip contentStyle={{ backgroundColor: '#1E1E2E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '11px' }} />
                          <Line type="monotone" dataKey="pnl" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-text-secondary">لا توجد صفقات منتهية كافية بالجنيه</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-text-secondary">لا توجد إحصائيات متوفرة للمحفظة حالياً.</div>
          )}
        </>
      )}
    </div>
  );
}
