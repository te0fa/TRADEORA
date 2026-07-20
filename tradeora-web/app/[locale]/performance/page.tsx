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
import { Clock, TrendingUp, Award, Activity, BarChart2, Briefcase, UserCheck, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'platform' | 'personal'>('platform');
  const [loading, setLoading] = useState(true);

  // Platform states
  const [platformTrades, setPlatformTrades] = useState<RecommendedTrade[]>([]);
  const [platformStats, setPlatformStats] = useState<any>(null);

  // Personal states
  const [personalTrades, setPersonalTrades] = useState<UserTrade[]>([]);
  const [personalStats, setPersonalStats] = useState<any>(null);

  useEffect(() => {
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

  const formatNum = (num: number | null | undefined, precision: number = 2) => {
    if (num === null || num === undefined) return '-';
    return parseFloat(num.toFixed(precision)).toLocaleString('en-US');
  };

  const formatPercent = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '-';
    return `${num > 0 ? '+' : ''}${formatNum(num, 1)}%`;
  };

  const platformPieData = useMemo(() => {
    if (!platformStats) return [];
    return [
      { name: 'Winning Trades', value: platformStats.winning_trades, color: '#10B981' },
      { name: 'Losing Trades', value: platformStats.losing_trades, color: '#EF4444' }
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
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                  <motion.div variants={itemVariants}>
                    <Card className="p-5 h-full flex flex-col justify-between">
                      <div className="flex items-center justify-between text-zinc-400 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Win Rate</span>
                        <Award className="w-5 h-5 text-up-green" />
                      </div>
                      <div>
                        <div className="text-3xl font-black text-up-green font-mono">
                          {platformStats.win_rate.toFixed(1)}%
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                          Based on {platformStats.closed_trades} closed trades
                        </p>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Card className="p-5 h-full flex flex-col justify-between">
                      <div className="flex items-center justify-between text-zinc-400 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Cum. Return</span>
                        <TrendingUp className="w-5 h-5 text-accent-blue" />
                      </div>
                      <div>
                        <div className={`text-3xl font-black font-mono ${platformStats.total_pnl >= 0 ? 'text-accent-blue' : 'text-down-red'}`}>
                          {platformStats.total_pnl > 0 ? '+' : ''}{platformStats.total_pnl.toFixed(1)}%
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                          Total compounded PnL percentage
                        </p>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Card className="p-5 h-full flex flex-col justify-between">
                      <div className="flex items-center justify-between text-zinc-400 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Total Signals</span>
                        <Activity className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-3xl font-black text-white font-mono">
                          {platformStats.total_trades}
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1 font-medium flex gap-3">
                          <span className="text-up-green">W: {platformStats.winning_trades}</span>
                          <span className="text-down-red">L: {platformStats.losing_trades}</span>
                        </p>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Card className="p-5 h-full flex flex-col justify-between">
                      <div className="flex items-center justify-between text-zinc-400 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Avg Return</span>
                        <BarChart2 className="w-5 h-5 text-accent-gold" />
                      </div>
                      <div>
                        <div className={`text-3xl font-black font-mono ${platformStats.avg_pnl >= 0 ? 'text-accent-gold' : 'text-down-red'}`}>
                          {platformStats.avg_pnl > 0 ? '+' : ''}{platformStats.avg_pnl.toFixed(1)}%
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                          Average return per trade
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                </div>

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
                        <div className={`text-2xl font-black font-mono ${personalStats.total_pnl_amount >= 0 ? 'text-accent-gold' : 'text-down-red'}`}>
                          {personalStats.total_pnl_amount > 0 ? '+' : ''}{personalStats.total_pnl_amount.toLocaleString()} EGP
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
    </div>
  );
}
