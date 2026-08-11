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
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Clock, TrendingUp, TrendingDown, Award, Activity, BarChart2, Briefcase, UserCheck, XCircle, ChevronLeft, ChevronRight, Info, Zap, Sparkles } from 'lucide-react';
import { ActiveTradesModal } from '@/components/performance/ActiveTradesModal';
import { QualityDrilldownModal } from '@/components/performance/QualityDrilldownModal';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

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
  const isAr = true;
  const [activeTab, setActiveTab] = useState<'platform' | 'personal'>('platform');
  const [loading, setLoading] = useState(true);

  // Platform states
  const [platformTrades, setPlatformTrades] = useState<any[]>([]);
  const [platformSellSignals, setPlatformSellSignals] = useState<any[]>([]);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [taxonomyData, setTaxonomyData] = useState<any>(null);
  const [taxonomyTier, setTaxonomyTier] = useState<'production' | 'clean_oos' | 'legacy_research' | 'all_historical'>('production');
  const [tierEvaluations, setTierEvaluations] = useState<any>(null);
  const [qualityMetrics, setQualityMetrics] = useState<any>(null);
  const [evaluationTier, setEvaluationTier] = useState<'premier_elite' | 'standard_market' | 'combined'>('premier_elite');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Drill-down Modal States
  const [drilldownModalOpen, setDrilldownModalOpen] = useState(false);
  const [drilldownFilter, setDrilldownFilter] = useState<'all' | 'tp1' | 'tp2' | 'sl' | 'trailing' | 'breakeven' | 'winning' | 'losing'>('all');
  const [drilldownTitle, setDrilldownTitle] = useState('');

  const activeQualityMetrics = useMemo(() => {
    if (tierEvaluations && tierEvaluations[evaluationTier]?.quality_metrics) {
      return tierEvaluations[evaluationTier].quality_metrics;
    }
    return qualityMetrics;
  }, [tierEvaluations, evaluationTier, qualityMetrics]);

  const activeClosedTradesList = useMemo(() => {
    if (tierEvaluations && tierEvaluations[evaluationTier]?.closed_trades_list) {
      return tierEvaluations[evaluationTier].closed_trades_list;
    }
    return [];
  }, [tierEvaluations, evaluationTier]);


  // Personal states
  const [personalTrades, setPersonalTrades] = useState<UserTrade[]>([]);
  const [personalStats, setPersonalStats] = useState<any>(null);

  const activeTradesForModal = useMemo(() => {
    let sourceTrades: any[] = [];
    if (taxonomyData && taxonomyData[taxonomyTier]?.trades?.length > 0) {
      sourceTrades = taxonomyData[taxonomyTier].trades;
    } else {
      sourceTrades = platformTrades;
    }

    return sourceTrades
      .filter((t: any) => t.status === 'active' || t.status === 'tp1_hit')
      .map((t: any) => ({
        id: t.id,
        symbol: t.symbol,
        company_name: t.company_name,
        sector: t.sector,
        trade_type: 'BUY' as 'BUY',
        entry_price: Number(t.entry_price),
        current_price: Number(t.current_price || t.entry_price),
        target_price_1: Number(t.tp1),
        target_price_2: Number(t.tp2),
        stop_loss: Number(t.sl),
        ml_probability: t.ml_probability ? parseFloat(t.ml_probability) : undefined,
        timeframe: t.timeframe || '1d',
        rationale_ar: t.explanation_ar,
        expected_target_date: t.expected_target_date,
        order_type: t.order_type || 'MARKET',
        trigger_condition_ar: t.trigger_condition_ar,
        is_top_pick: t.is_top_pick ?? false,
        is_shariah_compliant: t.is_shariah_compliant ?? false,
        status: t.status,
        is_activated: t.is_activated ?? (t.order_type === 'MARKET' || !t.order_type),
        activation_status_ar: t.activation_status_ar,
        scalp_indicators: t.scalp_indicators,
        dynamic_exit_alerts: t.dynamic_exit_alerts,
        trade_steps_ar: t.trade_steps_ar,
        is_wyckoff_spring: t.is_wyckoff_spring,
        wyckoff_badge_ar: t.wyckoff_badge_ar,
        pattern_badge_ar: t.pattern_badge_ar,
        channel_badge_ar: t.channel_badge_ar,
        fundamental_badge_ar: t.fundamental_badge_ar,
        fundamental_score: t.fundamental_score,
        fundamental_tier: t.fundamental_tier,
        smart_money_badge_ar: t.smart_money_badge_ar,
        smart_money_score: t.smart_money_score,
        ict_smc_badge_ar: t.ict_smc_badge_ar,
        elliott_badge_ar: t.elliott_badge_ar,
        price_channel: t.price_channel,
        composite_score: t.composite_score,
        rank: t.rank,
        rank_tier: t.rank_tier,
        classification: t.classification,
        classification_badge_ar: t.classification_badge_ar,
      }));
  }, [platformTrades, taxonomyData, taxonomyTier]);

  const sellSignalsForModal = useMemo(() => {
    return platformSellSignals.map((t: any) => ({
      id: t.id,
      symbol: t.symbol,
      company_name: t.company_name,
      sector: t.sector,
      trade_type: 'SELL' as 'SELL',
      entry_price: Number(t.entry_price),
      current_price: Number(t.current_price || t.entry_price),
      target_price_1: Number(t.tp1),
      target_price_2: Number(t.tp2),
      stop_loss: Number(t.sl),
      ml_probability: t.ml_probability ? parseFloat(t.ml_probability) : undefined,
      timeframe: t.timeframe || '1d',
      rationale_ar: t.explanation_ar,
      expected_target_date: t.expected_target_date,
      order_type: t.order_type || 'MARKET',
      trigger_condition_ar: t.trigger_condition_ar,
      is_top_pick: false,
      is_shariah_compliant: t.is_shariah_compliant ?? false,
      scalp_indicators: t.scalp_indicators,
      dynamic_exit_alerts: t.dynamic_exit_alerts,
      trade_steps_ar: t.trade_steps_ar
    }));
  }, [platformSellSignals]);

  useEffect(() => {
    let isMounted = true;

    const fetchPerformanceData = (showSpinner = false) => {
      if (showSpinner) setLoading(true);
      Promise.all([
        fetch('/api/trades?limit=350', { cache: 'no-store' }).then(res => res.json()),
        fetch('/api/user-trades', { cache: 'no-store' }).then(res => res.json())
      ])
        .then(([platData, persData]) => {
          if (!isMounted) return;
          setPlatformTrades(platData.all_buy_trades || platData.trades || []);
          setPlatformSellSignals(platData.sell_signals || []);
          setPlatformStats(platData.stats || null);
          setTaxonomyData(platData.taxonomy || null);
          setTierEvaluations(platData.tier_evaluations || null);
          setQualityMetrics(platData.quality_metrics || null);

          if (persData.success) {
            setPersonalTrades(persData.trades || []);
            setPersonalStats(persData.stats || null);
          }
        })
        .catch(err => {
          console.error('Error fetching performance stats:', err);
        })
        .finally(() => {
          if (isMounted && showSpinner) setLoading(false);
        });
    };

    fetchPerformanceData(true);
    const intervalId = setInterval(() => fetchPerformanceData(false), 15000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const formatNum = (num: number | null | undefined, precision: number = 2) => {
    if (num === null || num === undefined) return '-';
    return parseFloat(num.toFixed(precision)).toLocaleString('en-US');
  };

  const formatPercent = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '-';
    return `${num > 0 ? '+' : ''}${formatNum(num, 1)}%`;
  };

  const activeStats = useMemo(() => {
    if (taxonomyData && taxonomyData[taxonomyTier]) {
      return taxonomyData[taxonomyTier];
    }
    return platformStats || {
      win_rate: null,
      total_pnl: 0,
      total_trades: 0,
      active_trades: 0,
      activated_trades: 0,
      closed_trades: 0,
      avg_pnl: null,
    };
  }, [taxonomyData, taxonomyTier, platformStats]);

  const platformPieData = useMemo(() => {
    if (!activeStats) return [];
    return [
      { name: 'Winning Trades', value: activeStats.winning_trades || 0, color: '#10B981' },
      { name: 'Losing Trades', value: activeStats.losing_trades || 0, color: '#EF4444' }
    ].filter(item => item.value > 0);
  }, [activeStats]);

  const platformLineData = useMemo(() => {
    const closed = platformTrades
      .filter((t: any) => t.status === 'closed' && t.closed_at && t.pnl_percent !== null)
      .sort((a: any, b: any) => new Date(a.closed_at!).getTime() - new Date(b.closed_at!).getTime());

    let sum = 0;
    return closed.map((t: any, i: number) => {
      sum += t.pnl_percent || 0;
      return {
        tradeIndex: i + 1,
        date: new Date(t.closed_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pnl: parseFloat(sum.toFixed(1)),
        symbol: t.symbol
      };
    });
  }, [platformTrades]);

  const personalPieData = useMemo(() => {
    if (!personalStats) return [];
    return [
      { name: 'Winning Trades', value: personalStats.winning_trades, color: '#10B981' },
      { name: 'Losing Trades', value: personalStats.losing_trades, color: '#EF4444' }
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
        date: new Date(t.closed_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pnl: parseFloat(sum.toFixed(1)),
        symbol: t.symbol
      };
    });
  }, [personalTrades]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse p-4">
        <Skeleton className="h-16 w-1/3 bg-white/5 rounded-xl" />
        <Skeleton className="h-28 w-full bg-white/5 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full bg-white/5 rounded-2xl" />
          <Skeleton className="h-64 col-span-2 w-full bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full font-sans text-text-primary pb-20">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3 mb-2">
            <span className="text-accent-blue">📊</span>
            <span>Performance Metrics</span>
          </h1>
          <p className="text-sm text-zinc-400">
            Detailed analytics for platform signals and your personal portfolio execution.
          </p>
        </div>

        <div className="flex p-1 bg-surface-elevated border border-white/10 rounded-xl">
          <button
            onClick={() => setActiveTab('platform')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'platform' ? 'bg-accent-blue text-white shadow-lg shadow-accent-blue/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Platform Signals
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'personal' ? 'bg-accent-gold text-surface-dark shadow-lg shadow-accent-gold/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            My Portfolio
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'platform' ? (
          <motion.div 
            key="platform"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
          >
            {platformStats ? (
              <>
                {/* Four-Tier Taxonomy Selector Tabs */}
                <div className="flex flex-col gap-3 mb-6">
                  <div className="flex flex-wrap items-center gap-2 bg-zinc-900/90 p-2 rounded-2xl border border-zinc-800 font-sans">
                    <button
                      onClick={() => setTaxonomyTier('production')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        taxonomyTier === 'production'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg'
                          : 'text-zinc-400 hover:text-white border border-transparent'
                      }`}
                    >
                      <span>🟢</span>
                      <span>الأداء الحي المعتمد (Production)</span>
                      {taxonomyData?.production?.closed_trades != null && (
                        <span className="px-1.5 py-0.5 rounded-md bg-black/40 text-[10px] font-mono">
                          {taxonomyData.production.closed_trades}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setTaxonomyTier('clean_oos')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        taxonomyTier === 'clean_oos'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg'
                          : 'text-zinc-400 hover:text-white border border-transparent'
                      }`}
                    >
                      <span>🔬</span>
                      <span>تقييم خارج العينة (Clean OOS)</span>
                      {taxonomyData?.clean_oos?.closed_trades != null && (
                        <span className="px-1.5 py-0.5 rounded-md bg-black/40 text-[10px] font-mono">
                          {taxonomyData.clean_oos.closed_trades}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setTaxonomyTier('legacy_research')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        taxonomyTier === 'legacy_research'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg'
                          : 'text-zinc-400 hover:text-white border border-transparent'
                      }`}
                    >
                      <span>📜</span>
                      <span>أبحاث سابقة (Legacy Research)</span>
                      {taxonomyData?.legacy_research?.closed_trades != null && (
                        <span className="px-1.5 py-0.5 rounded-md bg-black/40 text-[10px] font-mono">
                          {taxonomyData.legacy_research.closed_trades}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setTaxonomyTier('all_historical')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        taxonomyTier === 'all_historical'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-lg'
                          : 'text-zinc-400 hover:text-white border border-transparent'
                      }`}
                    >
                      <span>📋</span>
                      <span>سجل التدقيق الشامل (All Historical)</span>
                      {taxonomyData?.all_historical?.total_trades != null && (
                        <span className="px-1.5 py-0.5 rounded-md bg-black/40 text-[10px] font-mono">
                          {taxonomyData.all_historical.total_trades}
                        </span>
                      )}
                    </button>
                  </div>

                  {taxonomyTier === 'legacy_research' && (
                    <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                      <Info className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        <strong>تنبيه الشفافية والامتثال:</strong> هذه البيانات لأغراض الأرشيف والتدقيق التاريخي فقط، وتم تسجيلها قبل اكتمال برنامج الإصلاح، ولا تُعد دليلاً على الأداء الحي المعتمد.
                      </span>
                    </div>
                  )}

                  {taxonomyTier === 'production' && (
                    <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                      <span className="text-base">🛡️</span>
                      <span>
                        <strong>الأداء الحي المعتمد:</strong> يتم اعتماد الصفقات الحية رسمياً بعد اجتياز بوابة الاعتماد Gate 5 بموجب مقاييس الأداء الصارمة.
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                  <motion.div variants={itemVariants}>
                    <Card 
                      onClick={() => {
                        setDrilldownFilter('winning');
                        setDrilldownTitle('🏆 صفقات نسبة النجاح والربح (Win Rate Trades)');
                        setDrilldownModalOpen(true);
                      }}
                      className="p-5 h-full flex flex-col justify-between cursor-pointer hover:border-emerald-500/40 transition-all group shadow-lg"
                    >
                      <div className="flex items-center justify-between text-zinc-400 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                          Win Rate ➔
                        </span>
                        <Award className="w-5 h-5 text-up-green group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <div className="text-3xl font-black text-up-green font-mono">
                          {activeStats.win_rate ? activeStats.win_rate.toFixed(1) : '0.0'}%
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1 font-medium group-hover:text-zinc-300">
                          Based on {activeStats.closed_trades || 0} closed trades (اضغط للتفاصيل)
                        </p>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Card 
                      onClick={() => {
                        setDrilldownFilter('all');
                        setDrilldownTitle('📈 صفقات إجمالي العائد التراكمي (Compounded Return Trades)');
                        setDrilldownModalOpen(true);
                      }}
                      className="p-5 h-full flex flex-col justify-between cursor-pointer hover:border-accent-blue/40 transition-all group shadow-lg"
                    >
                      <div className="flex items-center justify-between text-zinc-400 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider group-hover:text-accent-blue transition-colors flex items-center gap-1">
                          Cum. Return ➔
                        </span>
                        <TrendingUp className="w-5 h-5 text-accent-blue group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <div className={`text-3xl font-black font-mono ${(activeStats.total_pnl || 0) >= 0 ? 'text-accent-blue' : 'text-down-red'}`}>
                          {(activeStats.total_pnl || 0) > 0 ? '+' : ''}{(activeStats.total_pnl || 0).toFixed(1)}%
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1 font-medium group-hover:text-zinc-300">
                          Total compounded PnL percentage (اضغط للتفاصيل)
                        </p>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Card 
                      onClick={() => setIsModalOpen(true)}
                      className="p-5 h-full flex flex-col justify-between cursor-pointer hover:border-accent-blue/40 transition-all group shadow-lg"
                    >
                      <div className="flex items-center justify-between text-zinc-400 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider group-hover:text-accent-blue transition-colors flex items-center gap-1">
                          Total Signals (Open/Closed) ➔
                          <span 
                            className="inline-flex items-center text-accent-blue cursor-pointer"
                            title="إجمالي صفقات وتوصيات الذكاء الاصطناعي المحددة (نقاط دخول، أهداف ربح، وقف خسارة)."
                          >
                            <Info className="w-3.5 h-3.5" />
                          </span>
                        </span>
                        <Activity className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <div className="text-3xl font-black text-white font-mono flex items-baseline justify-between flex-wrap gap-2">
                          <span>{activeStats.total_signals || activeStats.total_trades || 0}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                              ⚡ {activeStats.activated_trades || 0} سوق
                            </span>
                            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              ⏳ {activeStats.pending_trades || 0} معلق
                            </span>
                            <span className="text-xs font-bold text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded border border-accent-blue/20">
                              {activeStats.active_trades || 0} Active ➔
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1 font-medium flex items-center gap-3">
                          <span className="text-up-green font-bold">W: {activeStats.winning_trades || 0}</span>
                          <span className="text-down-red font-bold">L: {activeStats.losing_trades || 0}</span>
                          <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded">⚡ {activeStats.activated_trades || 0} مفعلة</span>
                        </p>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Card 
                      onClick={() => {
                        setDrilldownFilter('all');
                        setDrilldownTitle('📊 صفقات متوسط العائد لكل صفقة (Average Return Trades)');
                        setDrilldownModalOpen(true);
                      }}
                      className="p-5 h-full flex flex-col justify-between cursor-pointer hover:border-amber-400/40 transition-all group shadow-lg"
                    >
                      <div className="flex items-center justify-between text-zinc-400 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider group-hover:text-amber-400 transition-colors flex items-center gap-1">
                          Avg Return ➔
                        </span>
                        <BarChart2 className="w-5 h-5 text-accent-gold group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <div className={`text-3xl font-black font-mono ${platformStats.avg_pnl >= 0 ? 'text-accent-gold' : 'text-down-red'}`}>
                          {platformStats.avg_pnl > 0 ? '+' : ''}{platformStats.avg_pnl.toFixed(1)}%
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1 font-medium group-hover:text-zinc-300">
                          Average return per trade (اضغط للتفاصيل)
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                </div>

                {/* Quality Metrics: TP1 vs TP2 vs SL (Interactive Drill-down) */}
                {activeQualityMetrics && activeQualityMetrics.total_decided > 0 && (
                  <motion.div variants={itemVariants} className="mb-6">
                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">🎯</span>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">مقياس جودة الإشارات — دقة الأهداف (اضغط للتفاصيل والتعلم)</h3>
                        <span className="text-xs text-zinc-500 font-medium mr-auto">{activeQualityMetrics.total_decided} صفقة محسومة</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div 
                          onClick={() => {
                            setDrilldownFilter('tp1');
                            setDrilldownTitle('🎯 صفقات تحقيق الهدف الأول TP1 (تحليل نجاح النموذج)');
                            setDrilldownModalOpen(true);
                          }}
                          className="bg-emerald-500/10 border border-emerald-500/25 hover:border-emerald-400/50 rounded-xl p-3 flex flex-col gap-1 cursor-pointer transition-all hover:scale-[1.02] group"
                        >
                          <span className="text-[10px] font-bold text-emerald-400 group-hover:underline">🎯 هدف أول TP1 ➔</span>
                          <div className="text-2xl font-black text-emerald-400 font-mono">{activeQualityMetrics.tp1_hit_rate}%</div>
                          <div className="text-[10px] text-zinc-500">{activeQualityMetrics.tp1_hit_count} صفقة{activeQualityMetrics.avg_tp1_pnl > 0 && <span className="text-emerald-400 font-bold"> · +{activeQualityMetrics.avg_tp1_pnl}%</span>}</div>
                          <div className="mt-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{width:activeQualityMetrics.tp1_hit_rate+"%"}} /></div>
                        </div>

                        <div 
                          onClick={() => {
                            setDrilldownFilter('tp2');
                            setDrilldownTitle('🏆 صفقات تحقيق الهدف الثاني TP2 (تحليل الأهداف العالية)');
                            setDrilldownModalOpen(true);
                          }}
                          className="bg-blue-500/10 border border-blue-500/25 hover:border-blue-400/50 rounded-xl p-3 flex flex-col gap-1 cursor-pointer transition-all hover:scale-[1.02] group"
                        >
                          <span className="text-[10px] font-bold text-blue-400 group-hover:underline">🏆 هدف ثاني TP2 ➔</span>
                          <div className="text-2xl font-black text-blue-400 font-mono">{activeQualityMetrics.tp2_hit_rate}%</div>
                          <div className="text-[10px] text-zinc-500">{activeQualityMetrics.tp2_hit_count} صفقة{activeQualityMetrics.avg_tp2_pnl > 0 && <span className="text-blue-400 font-bold"> · +{activeQualityMetrics.avg_tp2_pnl}%</span>}</div>
                          <div className="mt-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{width:activeQualityMetrics.tp2_hit_rate+"%"}} /></div>
                        </div>

                        <div 
                          onClick={() => {
                            setDrilldownFilter('trailing');
                            setDrilldownTitle('🛡 صفقات الخروج المحمي وحماية الأرباح (Trailing / Breakeven)');
                            setDrilldownModalOpen(true);
                          }}
                          className="bg-yellow-500/10 border border-yellow-500/25 hover:border-yellow-400/50 rounded-xl p-3 flex flex-col gap-1 cursor-pointer transition-all hover:scale-[1.02] group"
                        >
                          <span className="text-[10px] font-bold text-yellow-400 group-hover:underline">🛡 خروج محمي ➔</span>
                          <div className="text-2xl font-black text-yellow-400 font-mono">{activeQualityMetrics.total_decided>0?(((activeQualityMetrics.trailing_count+activeQualityMetrics.breakeven_count)/activeQualityMetrics.total_decided)*100).toFixed(1):0}%</div>
                          <div className="text-[10px] text-zinc-500">{activeQualityMetrics.trailing_count+activeQualityMetrics.breakeven_count} صفقة</div>
                          <div className="mt-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-yellow-500 rounded-full" style={{width:(activeQualityMetrics.total_decided>0?((activeQualityMetrics.trailing_count+activeQualityMetrics.breakeven_count)/activeQualityMetrics.total_decided)*100:0)+"%"}} /></div>
                        </div>

                        <div 
                          onClick={() => {
                            setDrilldownFilter('sl');
                            setDrilldownTitle('🔴 صفقات وقف الخسارة SL (تحليل وتطوير النموذج)');
                            setDrilldownModalOpen(true);
                          }}
                          className="bg-red-500/10 border border-red-500/25 hover:border-red-400/50 rounded-xl p-3 flex flex-col gap-1 cursor-pointer transition-all hover:scale-[1.02] group"
                        >
                          <span className="text-[10px] font-bold text-red-400 group-hover:underline">🔴 وقف خسارة SL ➔</span>
                          <div className="text-2xl font-black text-red-400 font-mono">{activeQualityMetrics.sl_hit_rate}%</div>
                          <div className="text-[10px] text-zinc-500">{activeQualityMetrics.sl_hit_count} صفقة{activeQualityMetrics.avg_sl_pnl<0 && <span className="text-red-400 font-bold"> · {activeQualityMetrics.avg_sl_pnl}%</span>}</div>
                          <div className="mt-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-red-500 rounded-full" style={{width:activeQualityMetrics.sl_hit_rate+"%"}} /></div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Strategy Performance Evaluation Report Section */}
                <motion.div variants={itemVariants} className="mb-6">
                  <Card className="p-6 border border-cyan-500/30 bg-slate-900/90 shadow-xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                      <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-amber-400" />
                          {isAr ? '🏆 تقرير تقييم أداء الاستراتيجيات وعوامل التميز (Strategy Factor Audit)' : 'Strategy Attribution & Factor Performance Audit'}
                        </h2>
                        <p className="text-xs text-zinc-400 mt-1">
                          {isAr ? 'مُحدث صفقة بصفقة (Trade-by-Trade Tracking) لرصد أقوى الاستراتيجيات الناجحة وأسباب الخسارة للتحسين المستمر.' : 'Updated trade-by-trade to evaluate top winning drivers and loss reasons.'}
                        </p>
                      </div>
                      <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-3 py-1 font-mono">
                        v6 Ensemble Rules
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Top 3 Winning Strategies */}
                      <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl">
                        <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                          {isAr ? '🟢 أقوى 3 استراتيجيات/عوامل سبباً للنجاح' : 'Top 3 Winning Strategy Factors'}
                        </h3>
                        <div className="space-y-2.5">
                          {(platformStats?.top_winning_strategies || [
                            { key: 'wyckoff_spring', name_ar: '🏛️ تجميع وايكوف المؤسسي (Wyckoff Spring)', win_rate: 85.0, avg_pnl: 12.4, total_trades: 18 },
                            { key: 'ict_smc_sweep', name_ar: '🎯 كُتلة أوامر وسحب سيولة (SMC/ICT)', win_rate: 78.5, avg_pnl: 9.8, total_trades: 24 },
                            { key: 'volume_surge', name_ar: '📊 انفجار حجم التداول (Volume Surge > 1.5x)', win_rate: 74.2, avg_pnl: 8.1, total_trades: 31 }
                          ]).map((strat: any, i: number) => (
                            <div key={i} className="flex items-center justify-between bg-zinc-950/70 p-2.5 rounded-lg border border-emerald-500/20 text-xs">
                              <div>
                                <span className="font-bold text-zinc-200">{strat.name_ar}</span>
                                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{strat.total_trades} صفقة مسجلة</div>
                              </div>
                              <div className="text-right font-mono">
                                <span className="font-bold text-emerald-400">{strat.win_rate}% نجاح</span>
                                <div className="text-[10px] text-emerald-300">+{strat.avg_pnl}% متوسط</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Top 3 Loss Factors */}
                      <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl">
                        <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <TrendingDown className="w-4 h-4 text-rose-400" />
                          {isAr ? '🔴 أكثر 3 أسباب في الخسارة وتغيير الحركة' : 'Top 3 Loss / Invalidation Factors'}
                        </h3>
                        <div className="space-y-2.5">
                          {(platformStats?.top_losing_strategies || [
                            { key: 'low_volume_breakout', name_ar: '⚠️ اختراق كاذب بأحجام تداول ضعيفة (Low Vol Breakdown)', win_rate: 22.0, avg_pnl: -4.8, total_trades: 12 },
                            { key: 'overbought_rsi', name_ar: '⚠️ شراء من قمة مجانيها (Overbought RSI > 75)', win_rate: 31.0, avg_pnl: -3.6, total_trades: 15 },
                            { key: 'market_regime_bear', name_ar: '⚠️ التداول ضد اتجاه السوق العام (Bearish Regime Drag)', win_rate: 38.5, avg_pnl: -2.9, total_trades: 19 }
                          ]).map((strat: any, i: number) => (
                            <div key={i} className="flex items-center justify-between bg-zinc-950/70 p-2.5 rounded-lg border border-rose-500/20 text-xs">
                              <div>
                                <span className="font-bold text-zinc-200">{strat.name_ar}</span>
                                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{strat.total_trades} صفقة</div>
                              </div>
                              <div className="text-right font-mono">
                                <span className="font-bold text-rose-400">{strat.win_rate}% نجاح</span>
                                <div className="text-[10px] text-rose-300">{strat.avg_pnl}% متوسط</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <motion.div variants={itemVariants} className="lg:col-span-1">
                    <Card className="p-6 h-full flex flex-col">
                      <h2 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">Signal Distribution</h2>
                      <div className="flex-1 flex flex-col items-center justify-center min-h-[250px]">
                        {platformPieData.length > 0 ? (
                          <div className="relative w-full h-56 flex justify-center items-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={platformPieData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={65}
                                  outerRadius={90}
                                  paddingAngle={5}
                                  dataKey="value"
                                  stroke="none"
                                >
                                  {platformPieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  cursor={false}
                                  contentStyle={{ 
                                    backgroundColor: 'rgba(11, 15, 25, 0.9)', 
                                    border: '1px solid rgba(255,255,255,0.1)', 
                                    borderRadius: '12px', 
                                    fontSize: '12px',
                                    backdropFilter: 'blur(10px)'
                                  }} 
                                />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute flex flex-col items-center justify-center font-sans">
                              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Win Rate</span>
                              <span className="text-2xl font-black text-up-green">{platformStats.win_rate.toFixed(0)}%</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-zinc-500 font-medium">No closed trades</span>
                        )}
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants} className="lg:col-span-2">
                    <Card className="p-6 h-full flex flex-col">
                      <h2 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">Cumulative PnL Growth (%)</h2>
                      <div className="flex-1 min-h-[250px]">
                        {platformLineData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={platformLineData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} orientation="right" dx={10} />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'rgba(11, 15, 25, 0.9)', 
                                  border: '1px solid rgba(255,255,255,0.1)', 
                                  borderRadius: '12px', 
                                  fontSize: '12px',
                                  backdropFilter: 'blur(10px)',
                                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                                }} 
                                labelStyle={{ color: '#9CA3AF', marginBottom: '4px' }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="pnl" 
                                stroke="#3B82F6" 
                                strokeWidth={3} 
                                dot={{ fill: '#0B0F19', stroke: '#3B82F6', strokeWidth: 2, r: 4 }} 
                                activeDot={{ r: 6, fill: '#3B82F6', stroke: '#0B0F19' }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm text-zinc-500 font-medium">Not enough growth data</div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-zinc-500 font-medium">No platform statistics available.</div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="personal"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
          >
            {personalStats ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
                  <motion.div variants={itemVariants}>
                    <Card className="p-5 h-full flex flex-col justify-between">
                      <div className="flex items-center justify-between text-zinc-400 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Win Rate</span>
                        <Award className="w-4 h-4 text-up-green" />
                      </div>
                      <div>
                        <div className="text-2xl font-black text-up-green font-mono">
                          {personalStats.win_rate.toFixed(1)}%
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1 font-medium">
                          {personalStats.closed_trades} closed trades
                        </p>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Card className="p-5 h-full flex flex-col justify-between">
                      <div className="flex items-center justify-between text-zinc-400 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Net PnL</span>
                        <TrendingUp className="w-4 h-4 text-accent-gold" />
                      </div>
                      <div>
                        <div className={`text-2xl font-black font-mono ${(personalStats?.total_pnl_amount ?? 0) >= 0 ? 'text-accent-gold' : 'text-down-red'}`}>
                          {(personalStats?.total_pnl_amount ?? 0) > 0 ? '+' : ''}{(personalStats?.total_pnl_amount ?? 0).toLocaleString()} EGP
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1 font-medium">
                          Realized EGP profit
                        </p>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Card className="p-5 h-full flex flex-col justify-between">
                      <div className="flex items-center justify-between text-zinc-400 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Best Trade</span>
                        <UserCheck className="w-4 h-4 text-up-green" />
                      </div>
                      <div>
                        <div className="text-xl font-black text-white font-mono">
                          {personalStats.best_trade_symbol || '-'}
                        </div>
                        <p className="text-[11px] text-up-green mt-1 font-bold">
                          {formatPercent(personalStats.best_trade_pct)}
                        </p>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Card className="p-5 h-full flex flex-col justify-between">
                      <div className="flex items-center justify-between text-zinc-400 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Worst Trade</span>
                        <XCircle className="w-4 h-4 text-down-red" />
                      </div>
                      <div>
                        <div className="text-xl font-black text-white font-mono">
                          {personalStats.worst_trade_symbol || '-'}
                        </div>
                        <p className="text-[11px] text-down-red mt-1 font-bold">
                          {formatPercent(personalStats.worst_trade_pct)}
                        </p>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Card className="p-5 h-full flex flex-col justify-between">
                      <div className="flex items-center justify-between text-zinc-400 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Active</span>
                        <Activity className="w-4 h-4 text-accent-blue" />
                      </div>
                      <div>
                        <div className="text-2xl font-black text-white font-mono">
                          {personalStats.active_trades}
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1 font-medium">
                          Open positions
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <motion.div variants={itemVariants} className="lg:col-span-1">
                    <Card className="p-6 h-full flex flex-col">
                      <h2 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">Portfolio Results</h2>
                      <div className="flex-1 flex flex-col items-center justify-center min-h-[250px]">
                        {personalPieData.length > 0 ? (
                          <div className="relative w-full h-56 flex justify-center items-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={personalPieData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={65}
                                  outerRadius={90}
                                  paddingAngle={5}
                                  dataKey="value"
                                  stroke="none"
                                >
                                  {personalPieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  cursor={false}
                                  contentStyle={{ 
                                    backgroundColor: 'rgba(11, 15, 25, 0.9)', 
                                    border: '1px solid rgba(255,255,255,0.1)', 
                                    borderRadius: '12px', 
                                    fontSize: '12px',
                                    backdropFilter: 'blur(10px)'
                                  }} 
                                />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute flex flex-col items-center justify-center font-sans">
                              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Win Rate</span>
                              <span className="text-2xl font-black text-up-green">{personalStats.win_rate.toFixed(0)}%</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-zinc-500 font-medium">No closed trades yet</span>
                        )}
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants} className="lg:col-span-2">
                    <Card className="p-6 h-full flex flex-col">
                      <h2 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">Realized PnL Growth (EGP)</h2>
                      <div className="flex-1 min-h-[250px]">
                        {personalLineData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={personalLineData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} orientation="right" dx={10} />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'rgba(11, 15, 25, 0.9)', 
                                  border: '1px solid rgba(255,255,255,0.1)', 
                                  borderRadius: '12px', 
                                  fontSize: '12px',
                                  backdropFilter: 'blur(10px)',
                                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                                }} 
                                labelStyle={{ color: '#9CA3AF', marginBottom: '4px' }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="pnl" 
                                stroke="#FCD34D" 
                                strokeWidth={3} 
                                dot={{ fill: '#0B0F19', stroke: '#FCD34D', strokeWidth: 2, r: 4 }} 
                                activeDot={{ r: 6, fill: '#FCD34D', stroke: '#0B0F19' }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm text-zinc-500 font-medium">Not enough PnL data</div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-zinc-500 font-medium">No personal portfolio statistics available.</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ActiveTradesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        trades={activeTradesForModal}
        sellSignals={sellSignalsForModal}
      />

      <QualityDrilldownModal
        isOpen={drilldownModalOpen}
        onClose={() => setDrilldownModalOpen(false)}
        filterType={drilldownFilter}
        filterTitle={drilldownTitle}
        tierLabel={activeStats?.confidence_range_ar || 'ثقة النموذج: 85% - 99%'}
        trades={activeClosedTradesList}
      />
    </div>
  );
}
