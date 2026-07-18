'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  Activity, 
  DollarSign, 
  Award, 
  Shield, 
  RefreshCw, 
  UserMinus, 
  UserPlus, 
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Signal
} from 'lucide-react';

interface AdminDashboardProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function AdminDashboard({ params }: AdminDashboardProps) {
  const { locale } = React.use(params);
  const isAr = locale === 'ar';
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrades: 0,
    activeTrades: 0,
    totalPnl: 0,
    winRate: 0,
    newUsersToday: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'trades' | 'signals'>('overview');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    try {
      // إحصائيات عامة والبيانات التفصيلية بالتوازي
      const [
        { count: totalUsers },
        { count: totalTrades },
        { count: activeTrades },
        { data: closedTrades },
        { data: usersData },
        { data: tradesData },
        { data: signalsData }
      ] = await Promise.all([
        supabase.from('user_profiles')
                 .select('*', { count: 'exact', head: true }),
        supabase.from('user_trades')
                 .select('*', { count: 'exact', head: true }),
        supabase.from('user_trades')
                 .select('*', { count: 'exact', head: true })
                 .eq('status', 'active'),
        supabase.from('user_trades')
                 .select('pnl_percent, pnl_amount')
                 .eq('status', 'closed'),
        supabase.from('user_profiles')
                 .select('id, full_name, role, subscription_end, created_at')
                 .order('created_at', { ascending: false })
                 .limit(100),
        supabase.from('user_trades')
                 .select('id, symbol, direction, entry_price, status, pnl_percent, pnl_amount, activated_at, closed_at, exit_reason')
                 .order('activated_at', { ascending: false })
                 .limit(150),
        supabase.from('recommended_trades')
                 .select('id, symbol, direction, entry_price, status, tp1, tp2, sl, pnl_percent, recommended_at')
                 .order('recommended_at', { ascending: false })
                 .limit(100)
      ]);

      const wins = closedTrades?.filter(
        t => (t.pnl_percent ?? 0) > 0
      ).length ?? 0;
      const total = closedTrades?.length ?? 1;
      const totalPnl = closedTrades?.reduce(
        (s, t) => s + (t.pnl_amount ?? 0), 0
      ) ?? 0;

      const today = new Date().toISOString().split('T')[0];
      const newToday = usersData?.filter(u =>
        u.created_at?.startsWith(today)
      ).length ?? 0;

      setStats({
        totalUsers:    totalUsers ?? 0,
        totalTrades:   totalTrades ?? 0,
        activeTrades:  activeTrades ?? 0,
        totalPnl,
        winRate: Math.round(wins / total * 100) || 0,
        newUsersToday: newToday,
      });

      setUsers(usersData ?? []);
      setTrades(tradesData ?? []);
      setSignals(signalsData ?? []);
    } catch (error) {
      console.error('Error loading admin dashboard statistics:', error);
    } finally {
      setLoading(false);
    }
  }

  // ترقية مستخدم لـ Premium
  const handleUpgradeUser = async (userId: string) => {
    setActionLoading(userId);
    const end = new Date();
    end.setMonth(end.getMonth() + 1);

    await supabase
      .from('user_profiles')
      .update({
        role: 'premium',
        subscription_end: end.toISOString()
      })
      .eq('id', userId);

    await loadData();
    setActionLoading(null);
  };

  // حظر مستخدم
  const handleBanUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حظر هذا المستخدم؟')) return;
    setActionLoading(userId);

    await supabase
      .from('user_profiles')
      .update({ role: 'banned' })
      .eq('id', userId);

    await loadData();
    setActionLoading(null);
  };

  // إلغاء الحظر أو ترقية لـ Admin
  const handleMakeUser = async (userId: string) => {
    setActionLoading(userId);
    await supabase
      .from('user_profiles')
      .update({ role: 'user', subscription_end: null })
      .eq('id', userId);

    await loadData();
    setActionLoading(null);
  };

  if (loading && users.length === 0) {
    return (
      <div className="w-full py-24 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin"></div>
        <span className="text-xs text-slate-400">جاري تحميل لوحة التحكم الإدارية...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto font-sans text-text-primary" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-500 animate-pulse" />
            <span>🛡️ لوحة تحكم الإدارة العامة</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            TRADEORA Central Management Dashboard — مراقبة المشتركين والصفقات الفعالة
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-5 py-2.5 bg-blue-600/10 border border-blue-500/30 text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'جاري التحديث...' : 'تحديث البيانات'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          {
            icon: <Users className="w-5 h-5 text-blue-400" />,
            label: 'إجمالي المستخدمين',
            value: stats.totalUsers,
            sub: `+${stats.newUsersToday} اليوم`,
            colorClass: 'text-blue-400'
          },
          {
            icon: <Briefcase className="w-5 h-5 text-purple-400" />,
            label: 'صفقات المحفظة',
            value: stats.totalTrades,
            colorClass: 'text-purple-400'
          },
          {
            icon: <Activity className="w-5 h-5 text-yellow-400 animate-pulse" />,
            label: 'صفقات نشطة',
            value: stats.activeTrades,
            colorClass: 'text-yellow-400'
          },
          {
            icon: <Award className={`w-5 h-5 ${stats.winRate >= 60 ? 'text-green-400' : 'text-red-400'}`} />,
            label: 'معدل النجاح',
            value: `${stats.winRate}%`,
            colorClass: stats.winRate >= 60 ? 'text-green-400' : 'text-red-400'
          },
          {
            icon: <DollarSign className={`w-5 h-5 ${stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`} />,
            label: 'صافي أرباح المحفظة',
            value: `${stats.totalPnl.toLocaleString(undefined, { maximumFractionDigits: 0 })} ج.م`,
            colorClass: stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'
          },
          {
            icon: <UserPlus className="w-5 h-5 text-cyan-400" />,
            label: 'مشتركون جدد',
            value: stats.newUsersToday,
            colorClass: 'text-cyan-400'
          },
        ].map((card, idx) => (
          <div key={idx} className="glass-card p-4 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent relative overflow-hidden flex flex-col justify-between min-h-[110px]">
            <div className="flex justify-between items-start mb-2">
              <span className="text-slate-400 text-[10px] font-bold">{card.label}</span>
              {card.icon}
            </div>
            <div>
              <p className={`text-lg font-black font-mono ${card.colorClass}`}>
                {card.value}
              </p>
              {card.sub && (
                <p className="text-slate-500 text-[9px] mt-0.5">
                  {card.sub}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/5 pb-4 overflow-x-auto">
        {[
          { key: 'overview', label: '📊 نظرة عامة' },
          { key: 'users',    label: '👥 إدارة المستخدمين' },
          { key: 'trades',   label: '💼 صفقات العملاء' },
          { key: 'signals',  label: '🔔 إشارات المنصة' },
        ].map(tab => (
          <button 
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
              activeTab === tab.key
                ? 'bg-blue-600/20 border-blue-500/40 text-blue-400 shadow-md shadow-blue-500/5'
                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content: Users */}
      {activeTab === 'users' && (
        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5 text-slate-400 text-[10px] uppercase font-bold">
                  <th className="p-4">{locale === 'ar' ? 'المستحدم / المعرف' : 'User / ID'}</th>
                  <th className="p-4">{locale === 'ar' ? 'الدور والامتياز' : 'Role'}</th>
                  <th className="p-4">{locale === 'ar' ? 'صلاحية الاشتراك' : 'Subscription End'}</th>
                  <th className="p-4">{locale === 'ar' ? 'تاريخ الانضمام' : 'Registered Date'}</th>
                  <th className="p-4 text-left">{locale === 'ar' ? 'إجراءات الإشراف' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition">
                    <td className="p-4">
                      <span className="font-bold text-white block">{u.full_name ?? 'بدون اسم'}</span>
                      <span className="text-[9px] text-slate-500 font-mono block mt-0.5">{u.id}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold ${
                        u.role === 'admin'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : u.role === 'premium'
                          ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          : u.role === 'banned'
                          ? 'bg-rose-950/20 text-rose-500 border border-rose-500/10'
                          : 'bg-slate-500/10 text-slate-400'
                      }`}>
                        {u.role === 'admin' ? '🛡️ أدمن'
                         : u.role === 'premium' ? '⭐ بريميم'
                         : u.role === 'banned' ? '🚫 محظور'
                         : '👤 عادي'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 font-mono">
                      {u.subscription_end
                        ? new Date(u.subscription_end).toLocaleDateString('ar-EG')
                        : '—'}
                    </td>
                    <td className="p-4 text-slate-400 font-mono">
                      {new Date(u.created_at).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="p-4 text-left">
                      <div className="flex gap-2 justify-end">
                        {u.role !== 'premium' && u.role !== 'admin' && (
                          <button
                            onClick={() => handleUpgradeUser(u.id)}
                            disabled={actionLoading === u.id}
                            className="px-2.5 py-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold cursor-pointer transition active:scale-95 shrink-0"
                          >
                            ⭐ ترقية
                          </button>
                        )}
                        {u.role === 'premium' && (
                          <button
                            onClick={() => handleMakeUser(u.id)}
                            disabled={actionLoading === u.id}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 border border-white/5 text-slate-300 text-[10px] font-bold cursor-pointer transition active:scale-95 shrink-0"
                          >
                            👤 إلغاء
                          </button>
                        )}
                        {u.role !== 'banned' && u.role !== 'admin' && (
                          <button
                            onClick={() => handleBanUser(u.id)}
                            disabled={actionLoading === u.id}
                            className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-bold cursor-pointer transition active:scale-95 shrink-0"
                          >
                            🚫 حظر
                          </button>
                        )}
                        {u.role === 'banned' && (
                          <button
                            onClick={() => handleMakeUser(u.id)}
                            disabled={actionLoading === u.id}
                            className="px-2.5 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-[10px] font-bold cursor-pointer transition active:scale-95 shrink-0"
                          >
                            🔓 فك حظر
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Trades */}
      {activeTab === 'trades' && (
        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5 text-slate-400 text-[10px] uppercase font-bold">
                  <th className="p-4">{locale === 'ar' ? 'السهم' : 'Symbol'}</th>
                  <th className="p-4">{locale === 'ar' ? 'نوع الحركة' : 'Direction'}</th>
                  <th className="p-4">{locale === 'ar' ? 'سعر الدخول' : 'Entry Price'}</th>
                  <th className="p-4">{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="p-4">{locale === 'ar' ? 'العائد الفعلي' : 'PNL %'}</th>
                  <th className="p-4">{locale === 'ar' ? 'ربح/خسارة' : 'PNL Amount'}</th>
                  <th className="p-4">{locale === 'ar' ? 'تاريخ التفعيل' : 'Activated At'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {trades.map(t => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition text-[11px]">
                    <td className="p-4 text-white font-bold text-xs">{t.symbol}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold ${
                        t.direction === 'buy' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {t.direction === 'buy' ? '▲ شراء' : '▼ بيع'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300 font-semibold">{t.entry_price?.toFixed(2)} EGP</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === 'active'
                          ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          : t.status === 'tp1_hit'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : (t.pnl_percent ?? 0) > 0
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {t.status === 'active' ? '🟡 نشطة'
                         : t.status === 'tp1_hit' ? '🎯 هدف 1'
                         : (t.pnl_percent ?? 0) > 0 ? '✅ ربح' : '❌ خسارة'}
                      </span>
                    </td>
                    <td className="p-4">
                      {t.pnl_percent !== null ? (
                        <span className={`font-bold ${
                          t.pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {t.pnl_percent >= 0 ? '+' : ''}{t.pnl_percent.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      {t.pnl_amount !== null ? (
                        <span className={`font-bold ${
                          t.pnl_amount >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {t.pnl_amount >= 0 ? '+' : ''}{t.pnl_amount.toFixed(0)} EGP
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400 font-normal">
                      {new Date(t.activated_at).toLocaleDateString('ar-EG')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Signals (Platform Recommendations) */}
      {activeTab === 'signals' && (
        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5 text-slate-400 text-[10px] uppercase font-bold">
                  <th className="p-4">{locale === 'ar' ? 'السهم' : 'Symbol'}</th>
                  <th className="p-4">{locale === 'ar' ? 'نوع التوصية' : 'Direction'}</th>
                  <th className="p-4">{locale === 'ar' ? 'سعر الدخول' : 'Entry Price'}</th>
                  <th className="p-4">{locale === 'ar' ? 'الوقف / الأهداف' : 'SL / TP Levels'}</th>
                  <th className="p-4">{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="p-4">{locale === 'ar' ? 'الربح/خسارة' : 'PNL'}</th>
                  <th className="p-4">{locale === 'ar' ? 'تاريخ التوصية' : 'Recommended At'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {signals.map(s => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition text-[11px]">
                    <td className="p-4 text-white font-bold text-xs">{s.symbol}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold ${
                        s.direction === 'buy' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {s.direction === 'buy' ? '▲ شراء' : '▼ بيع'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300 font-semibold">{s.entry_price?.toFixed(2)} EGP</td>
                    <td className="p-4 text-slate-400 font-normal">
                      <span>SL: {s.sl?.toFixed(2)}</span>
                      <span className="mx-2">|</span>
                      <span>TP1: {s.tp1?.toFixed(2)}</span>
                      <span className="mx-2">|</span>
                      <span>TP2: {s.tp2?.toFixed(2)}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.status === 'active'
                          ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          : s.status === 'tp1_hit'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : (s.pnl_percent ?? 0) > 0
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {s.status === 'active' ? '🟡 نشطة'
                         : s.status === 'tp1_hit' ? '🎯 هدف 1'
                         : (s.pnl_percent ?? 0) > 0 ? '✅ ربح' : '❌ خسارة'}
                      </span>
                    </td>
                    <td className="p-4">
                      {s.pnl_percent !== null ? (
                        <span className={`font-bold ${
                          s.pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {s.pnl_percent >= 0 ? '+' : ''}{s.pnl_percent.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400 font-normal">
                      {new Date(s.recommended_at).toLocaleDateString('ar-EG')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* توزيع الأدوار والامتيازات */}
          <div className="glass-card p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent">
            <h3 className="text-white font-bold mb-4 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-accent-blue" />
              <span>👥 توزيع اشتراكات المستخدمين</span>
            </h3>
            <div className="space-y-4">
              {[
                { role: 'admin',   label: '🛡️ مشرف المنصة (Admin)', colorClass: 'bg-red-500' },
                { role: 'premium', label: '⭐ عميل مميز (Premium)', colorClass: 'bg-yellow-500' },
                { role: 'user',    label: '👤 مستخدم عادي (Standard)', colorClass: 'bg-slate-400' },
              ].map(r => {
                const count = users.filter(u => u.role === r.role).length;
                const pct = users.length > 0 ? (count / users.length) * 100 : 0;
                return (
                  <div key={r.role}>
                    <div className="flex justify-between text-xs mb-1.5 font-bold">
                      <span className="text-slate-400">{r.label}</span>
                      <span className="text-white font-mono">{count} مستخدم ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${r.colorClass} rounded-full`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* آخر صفقات تم تفعيلها */}
          <div className="glass-card p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent">
            <h3 className="text-white font-bold mb-4 text-sm flex items-center gap-2">
              <Signal className="w-4 h-4 text-purple-400" />
              <span>📊 آخر الصفقات المفتوحة</span>
            </h3>
            <div className="space-y-3">
              {trades.slice(0, 5).map(t => (
                <div key={t.id} className="flex justify-between items-center text-xs pb-2 border-b border-white/5 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{t.symbol}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      t.direction === 'buy' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {t.direction === 'buy' ? 'شراء' : 'بيع'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(t.activated_at).toLocaleDateString('ar-EG')}
                    </span>
                    <span className={`font-bold font-mono ${
                      t.pnl_percent === null ? 'text-yellow-400'
                      : t.pnl_percent >= 0 ? 'text-green-400'
                      : 'text-red-400'
                    }`}>
                      {t.pnl_percent !== null
                        ? `${t.pnl_percent >= 0 ? '+' : ''}${t.pnl_percent.toFixed(1)}%`
                        : '⏳ نشطة'}
                    </span>
                  </div>
                </div>
              ))}

              {trades.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-xs">
                  لا توجد صفقات حالية مفتوحة.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
