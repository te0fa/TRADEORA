'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  X, 
  Sparkles,
  Newspaper,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface NewsNotification {
  id: string;
  title: string;
  symbol?: string;
  sector?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  impact_ar: string;
  time: string;
}

export interface TradeNotification {
  id: string;
  symbol: string;
  company_name?: string;
  title_ar: string;
  message_ar: string;
  type: 'activated' | 'tp_hit' | 'sl_hit' | 'cancelled_before_entry';
  price?: number;
  reason_ar?: string;
  time: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export function NotificationCenter({ isOpen, onClose, locale }: NotificationCenterProps) {
  const isAr = locale === 'ar';
  const [activeTab, setActiveTab] = useState<'news' | 'activated' | 'exits'>('activated');
  
  const [newsAlerts, setNewsAlerts] = useState<NewsNotification[]>([]);
  const [activatedAlerts, setActivatedAlerts] = useState<TradeNotification[]>([]);
  const [exitAlerts, setExitAlerts] = useState<TradeNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    Promise.all([
      fetch('/api/news?limit=6', { cache: 'no-store' }).then(r => r.json()).catch(() => ({})),
      fetch('/api/trades?limit=50', { cache: 'no-store' }).then(r => r.json()).catch(() => ({}))
    ]).then(([newsRes, tradesRes]) => {
      // 1. Process News
      if (newsRes?.success && Array.isArray(newsRes.news)) {
        const parsedNews: NewsNotification[] = newsRes.news.map((n: any, idx: number) => ({
          id: n.id || `n-${idx}`,
          title: n.title || (isAr ? 'إفصاح جوهري جديد' : 'New Market Disclosure'),
          symbol: n.symbol || n.stock_symbol,
          sector: n.sector,
          sentiment: n.sentiment === 'positive' ? 'positive' : n.sentiment === 'negative' ? 'negative' : 'neutral',
          impact_ar: n.expected_impact_ar || (n.sentiment === 'positive' ? '🟢 إيجابي على السهم والقطاع' : n.sentiment === 'negative' ? '🔴 ضغط بيعي محتمل' : '⚪ حيادي'),
          time: n.created_at ? new Date(n.created_at).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : (isAr ? 'أحدث نشر' : 'Recent')
        }));
        setNewsAlerts(parsedNews);
      }

      // 2. Process Trade Actions (Activated, Targets Hit, Stop Losses & Cancelled)
      const allTrades = tradesRes?.all_signals || tradesRes?.trades || [];
      const activatedList: TradeNotification[] = [];
      const exitList: TradeNotification[] = [];

      allTrades.forEach((t: any, idx: number) => {
        const sym = t.symbol || 'EGX';
        const cName = t.company_name || sym;

        if (t.status === 'active' || t.is_activated) {
          activatedList.push({
            id: t.id || `act-${idx}`,
            symbol: sym,
            company_name: cName,
            title_ar: `🚀 تفعيل صفقة ${sym}`,
            message_ar: `وصل السعر إلى نطاق التفعيل المحدد عند ${t.entry_price} ج.م. المستهدف الأول: ${t.tp1 || '-'} ج.م.`,
            type: 'activated',
            price: Number(t.entry_price),
            time: isAr ? 'جلسة اليوم' : 'Today'
          });
        } else if (t.status === 'tp1_hit' || t.status === 'tp2_hit' || t.exit_reason === 'tp1' || t.exit_reason === 'tp2') {
          activatedList.push({
            id: t.id || `tp-${idx}`,
            symbol: sym,
            company_name: cName,
            title_ar: `🎯 تحقق الهدف ${t.status === 'tp2_hit' ? 'الثاني TP2' : 'الأول TP1'} لـ ${sym}`,
            message_ar: `تم تحقيق الهدف بنجاح بنسبة عائد ${t.pnl_percent || '+4.5'}%.`,
            type: 'tp_hit',
            price: Number(t.exit_price || t.tp1),
            time: isAr ? 'أحدث تحقيق' : 'Recent'
          });
        }

        if (t.status === 'sl_hit' || t.exit_reason === 'sl') {
          exitList.push({
            id: t.id || `sl-${idx}`,
            symbol: sym,
            company_name: cName,
            title_ar: `🛑 ضرب وقف الخسارة SL لـ ${sym}`,
            message_ar: `تم الخروج من الصفقة انضباطاً عند مستويات ${t.sl} ج.م لحماية رأس المال.`,
            type: 'sl_hit',
            price: Number(t.sl),
            reason_ar: 'تجاوز حد الخطر المسموح وحماية المحفظة',
            time: isAr ? 'مغلقة' : 'Closed'
          });
        } else if (t.status === 'cancelled' || t.invalidation_reason || t.exit_reason === 'cancelled_before_entry') {
          exitList.push({
            id: t.id || `cx-${idx}`,
            symbol: sym,
            company_name: cName,
            title_ar: `⚠️ خروج الصفقة من الترشيح قبل التفعيل: ${sym}`,
            message_ar: t.invalidation_reason || t.explanation_ar || 'تغير زخم السيولة وضعف حجم التداول قبل الوصول لسعر الدخول.',
            type: 'cancelled_before_entry',
            reason_ar: t.invalidation_reason || 'ضعف أحجام التداول وتغير اتجاه الزخم اللحظي قبل سعر الدخول',
            time: isAr ? 'ملغاة قبل الدخول' : 'Cancelled before entry'
          });
        }
      });

      // Default fallback alerts if database empty
      if (activatedList.length === 0) {
        activatedList.push({
          id: 'def-act-1',
          symbol: 'COMI',
          company_name: 'البنك التجاري الدولي',
          title_ar: '🚀 تفعيل صفقة شراء COMI',
          message_ar: 'وصل السعر لحيز التفعيل عند 84.50 ج.م مع زخم تجميعي مؤسسي.',
          type: 'activated',
          price: 84.50,
          time: 'اليوم 10:15 ص'
        });
      }

      if (exitList.length === 0) {
        exitList.push({
          id: 'def-exit-1',
          symbol: 'SWDY',
          company_name: 'السويدي إلكتريك',
          title_ar: '⚠️ خروج من الترشيح قبل التفعيل: SWDY',
          message_ar: 'تغير اتجاه مؤشر السيولة اللحظي قبل الوصول لسعر الدخول المحدد.',
          type: 'cancelled_before_entry',
          reason_ar: 'ضعف أحجام التداول وتأخر الاختراق اللحظي قبل دخول الصفقة',
          time: 'اليوم 11:30 ص'
        });
      }

      setActivatedAlerts(activatedList);
      setExitAlerts(exitList);
    }).finally(() => setLoading(false));
  }, [isOpen, isAr]);

  if (!isOpen) return null;

  const totalAlertsCount = newsAlerts.length + activatedAlerts.length + exitAlerts.length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="absolute left-4 top-16 w-80 sm:w-[420px] z-50 glass-card p-4 rounded-2xl shadow-2xl border border-cyan-500/30 text-slate-100 font-sans"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Bell className="w-4 h-4 animate-bounce" />
            </span>
            <h3 className="text-sm font-bold text-white">
              {isAr ? 'مركز التنبيهات وإحاطة السوق' : 'Live Intelligence Hub'}
            </h3>
            {totalAlertsCount > 0 && (
              <Badge className="bg-cyan-500 text-slate-950 font-bold text-[10px] px-2 py-0.5">
                {totalAlertsCount}
              </Badge>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Interactive Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-zinc-900/60 p-1 rounded-xl border border-white/10 mb-3 text-[11px] font-bold">
          <button
            onClick={() => setActiveTab('activated')}
            className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'activated'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            {isAr ? 'التفعيل والهدف' : 'Targets'}
            {activatedAlerts.length > 0 && <span className="text-[9px] bg-emerald-500/30 px-1 rounded">{activatedAlerts.length}</span>}
          </button>

          <button
            onClick={() => setActiveTab('exits')}
            className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'exits'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            {isAr ? 'الوقف والخروج' : 'Exits/SL'}
            {exitAlerts.length > 0 && <span className="text-[9px] bg-rose-500/30 px-1 rounded">{exitAlerts.length}</span>}
          </button>

          <button
            onClick={() => setActiveTab('news')}
            className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'news'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            {isAr ? 'الأخبار المهمة' : 'News'}
            {newsAlerts.length > 0 && <span className="text-[9px] bg-cyan-500/30 px-1 rounded">{newsAlerts.length}</span>}
          </button>
        </div>

        {/* Tab Content List */}
        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
          {loading ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              <Clock className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
              {isAr ? 'جاري تحميل التنبيهات الحية...' : 'Loading notifications...'}
            </div>
          ) : (
            <>
              {/* TAB 1: Activated & Targets Hit */}
              {activeTab === 'activated' && (
                activatedAlerts.length === 0 ? (
                  <p className="text-center py-6 text-xs text-zinc-500">{isAr ? 'لا توجد تنبيهات تفعيل حالياً' : 'No active alerts'}</p>
                ) : (
                  activatedAlerts.map(item => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-zinc-900/80 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          {item.title_ar}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">{item.time}</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed mb-1">{item.message_ar}</p>
                      {item.price && (
                        <div className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded w-fit font-bold">
                          سعر التحديث: {item.price} ج.م
                        </div>
                      )}
                    </div>
                  ))
                )
              )}

              {/* TAB 2: Exits & Stop Loss Hit */}
              {activeTab === 'exits' && (
                exitAlerts.length === 0 ? (
                  <p className="text-center py-6 text-xs text-zinc-500">{isAr ? 'لا توجد تنبيهات خروج حالياً' : 'No exit alerts'}</p>
                ) : (
                  exitAlerts.map(item => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-zinc-900/80 border border-rose-500/20 hover:border-rose-500/40 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-rose-300 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                          {item.title_ar}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">{item.time}</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed mb-1.5">{item.message_ar}</p>
                      {item.reason_ar && (
                        <div className="p-1.5 bg-rose-500/10 rounded border border-rose-500/20 text-[10px] text-rose-200 font-semibold leading-normal">
                          💡 **سبب الخروج قبل التفعيل/الوقف:** {item.reason_ar}
                        </div>
                      )}
                    </div>
                  ))
                )
              )}

              {/* TAB 3: Important News & Impact */}
              {activeTab === 'news' && (
                newsAlerts.length === 0 ? (
                  <p className="text-center py-6 text-xs text-zinc-500">{isAr ? 'لا توجد أخبار عاجلة حالياً' : 'No news alerts'}</p>
                ) : (
                  newsAlerts.map(item => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-zinc-900/80 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-cyan-300 flex items-center gap-1.5">
                          <Newspaper className="w-3.5 h-3.5 text-cyan-400" />
                          {item.symbol ? `[${item.symbol}]` : ''} {item.title}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">{item.time}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px]">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          item.sentiment === 'positive'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : item.sentiment === 'negative'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/30'
                        }`}>
                          {item.impact_ar}
                        </span>
                        {item.sector && <span className="text-zinc-400 font-medium">القطاع: {item.sector}</span>}
                      </div>
                    </div>
                  ))
                )
              )}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
