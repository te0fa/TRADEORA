'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Check,
  Filter
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
  date_str?: string;
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
  date_str?: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export function NotificationCenter({ isOpen, onClose, locale }: NotificationCenterProps) {
  const isAr = locale === 'ar';
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'news' | 'activated' | 'exits'>('activated');
  const [sessionScope, setSessionScope] = useState<'TODAY_SESSION' | 'ALL_HISTORY'>('TODAY_SESSION');
  
  const [newsAlerts, setNewsAlerts] = useState<NewsNotification[]>([]);
  const [activatedAlerts, setActivatedAlerts] = useState<TradeNotification[]>([]);
  const [exitAlerts, setExitAlerts] = useState<TradeNotification[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load read IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tradeora_read_notifications');
      if (stored) setReadIds(JSON.parse(stored));
    } catch {}
  }, []);

  // Click outside to close notification panel
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Mark single item as read
  const markAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setReadIds(prev => {
      const updated = [...prev, id];
      try { localStorage.setItem('tradeora_read_notifications', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  // Mark all items in active view as read
  const markAllAsRead = () => {
    const allIds = [
      ...newsAlerts.map(n => n.id),
      ...activatedAlerts.map(a => a.id),
      ...exitAlerts.map(x => x.id),
    ];
    setReadIds(prev => {
      const updated = Array.from(new Set([...prev, ...allIds]));
      try { localStorage.setItem('tradeora_read_notifications', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    Promise.all([
      fetch('/api/news?limit=10', { cache: 'no-store' }).then(r => r.json()).catch(() => ({})),
      fetch('/api/trades?limit=100', { cache: 'no-store' }).then(r => r.json()).catch(() => ({}))
    ]).then(([newsRes, tradesRes]) => {
      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Process News
      if (newsRes?.success && Array.isArray(newsRes.news)) {
        const parsedNews: NewsNotification[] = newsRes.news.map((n: any, idx: number) => ({
          id: n.id || `n-${idx}`,
          title: n.title || (isAr ? 'إفصاح جوهري جديد' : 'New Market Disclosure'),
          symbol: n.symbol || n.stock_symbol,
          sector: n.sector,
          sentiment: n.sentiment === 'positive' ? 'positive' : n.sentiment === 'negative' ? 'negative' : 'neutral',
          impact_ar: n.expected_impact_ar || (n.sentiment === 'positive' ? '🟢 إيجابي على السهم والقطاع' : n.sentiment === 'negative' ? '🔴 ضغط بيعي محتمل' : '⚪ حيادي'),
          time: n.created_at ? new Date(n.created_at).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : (isAr ? 'أحدث نشر' : 'Recent'),
          date_str: n.created_at ? n.created_at.split('T')[0] : todayStr
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
        const recDate = t.recommended_at ? t.recommended_at.split('T')[0] : todayStr;

        if (t.status === 'active' || t.is_activated) {
          activatedList.push({
            id: t.id || `act-${idx}`,
            symbol: sym,
            company_name: cName,
            title_ar: `🚀 تفعيل صفقة ${sym}`,
            message_ar: `وصل السعر إلى نطاق التفعيل المحدد عند ${t.entry_price} ج.م. المستهدف الأول: ${t.tp1 || '-'} ج.م.`,
            type: 'activated',
            price: Number(t.entry_price),
            time: isAr ? 'جلسة اليوم' : 'Today',
            date_str: recDate
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
            time: isAr ? 'أحدث تحقيق' : 'Recent',
            date_str: recDate
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
            time: isAr ? 'مغلقة' : 'Closed',
            date_str: recDate
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
            time: isAr ? 'ملغاة قبل الدخول' : 'Cancelled before entry',
            date_str: recDate
          });
        }
      });

      setActivatedAlerts(activatedList);
      setExitAlerts(exitList);
    }).finally(() => setLoading(false));
  }, [isOpen, isAr]);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter unread alerts by session scope
  const filterByScope = <T extends { id: string; date_str?: string }>(items: T[]) => {
    let unread = items.filter(item => !readIds.includes(item.id));
    if (sessionScope === 'TODAY_SESSION') {
      unread = unread.filter(item => item.date_str === todayStr || !item.date_str);
    }
    return unread;
  };

  const filteredActivated = filterByScope(activatedAlerts);
  const filteredExits = filterByScope(exitAlerts);
  const filteredNews = filterByScope(newsAlerts);

  const totalUnreadCount = filteredActivated.length + filteredExits.length + filteredNews.length;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="absolute left-4 top-16 w-80 sm:w-[440px] z-50 glass-card p-4 rounded-2xl shadow-2xl border border-cyan-500/30 text-slate-100 font-sans"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Bell className="w-4 h-4 animate-bounce" />
            </span>
            <h3 className="text-sm font-bold text-white">
              {isAr ? 'مركز التنبيهات وإحاطة السوق' : 'Live Intelligence Hub'}
            </h3>
            {totalUnreadCount > 0 && (
              <Badge className="bg-cyan-500 text-slate-950 font-bold text-[10px] px-2 py-0.5">
                {totalUnreadCount}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {totalUnreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold bg-cyan-500/10 px-2 py-1 rounded-lg border border-cyan-500/20 cursor-pointer transition-all"
                title={isAr ? 'تعيين الكل كمقروء' : 'Mark all read'}
              >
                ✓ {isAr ? 'قراءة الكل' : 'Mark All Read'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Session Filter Scope Toggle Bar */}
        <div className="flex items-center justify-between bg-slate-900/80 p-1.5 rounded-xl border border-white/5 mb-3 text-[10px]">
          <span className="text-zinc-400 font-medium px-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-cyan-400" />
            {isAr ? 'نطاق التنبيهات:' : 'Alert Scope:'}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSessionScope('TODAY_SESSION')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                sessionScope === 'TODAY_SESSION'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {isAr ? 'جلسة اليوم ⚡' : 'Today Session'}
            </button>
            <button
              onClick={() => setSessionScope('ALL_HISTORY')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                sessionScope === 'ALL_HISTORY'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {isAr ? 'كل التنبيهات 📜' : 'All History'}
            </button>
          </div>
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
            {filteredActivated.length > 0 && <span className="text-[9px] bg-emerald-500/30 px-1 rounded">{filteredActivated.length}</span>}
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
            {filteredExits.length > 0 && <span className="text-[9px] bg-rose-500/30 px-1 rounded">{filteredExits.length}</span>}
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
            {filteredNews.length > 0 && <span className="text-[9px] bg-cyan-500/30 px-1 rounded">{filteredNews.length}</span>}
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
                filteredActivated.length === 0 ? (
                  <p className="text-center py-6 text-xs text-zinc-500">{isAr ? 'لا توجد تنبيهات تفعيل جديدة لهذه الجلسة' : 'No new active alerts'}</p>
                ) : (
                  filteredActivated.map(item => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-zinc-900/80 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors relative group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          {item.title_ar}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500 font-mono">{item.time}</span>
                          <button
                            onClick={(e) => markAsRead(item.id, e)}
                            className="p-1 rounded bg-zinc-800 hover:bg-emerald-500/30 text-zinc-400 hover:text-emerald-300 text-[10px] transition-colors cursor-pointer"
                            title={isAr ? 'إخفاء التنبيه (قراءة)' : 'Mark Read'}
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed mb-1 pl-6">{item.message_ar}</p>
                      {item.price && (
                        <div className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded w-fit font-bold ml-6">
                          سعر التحديث: {item.price} ج.م
                        </div>
                      )}
                    </div>
                  ))
                )
              )}

              {/* TAB 2: Exits & Stop Loss Hit */}
              {activeTab === 'exits' && (
                filteredExits.length === 0 ? (
                  <p className="text-center py-6 text-xs text-zinc-500">{isAr ? 'لا توجد تنبيهات خروج جديدة لهذه الجلسة' : 'No new exit alerts'}</p>
                ) : (
                  filteredExits.map(item => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-zinc-900/80 border border-rose-500/20 hover:border-rose-500/40 transition-colors relative group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-rose-300 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                          {item.title_ar}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500 font-mono">{item.time}</span>
                          <button
                            onClick={(e) => markAsRead(item.id, e)}
                            className="p-1 rounded bg-zinc-800 hover:bg-rose-500/30 text-zinc-400 hover:text-rose-300 text-[10px] transition-colors cursor-pointer"
                            title={isAr ? 'إخفاء التنبيه (قراءة)' : 'Mark Read'}
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed mb-1.5 pl-6">{item.message_ar}</p>
                      {item.reason_ar && (
                        <div className="p-1.5 bg-rose-500/10 rounded border border-rose-500/20 text-[10px] text-rose-200 font-semibold leading-normal ml-6">
                          💡 **سبب الخروج قبل التفعيل/الوقف:** {item.reason_ar}
                        </div>
                      )}
                    </div>
                  ))
                )
              )}

              {/* TAB 3: Important News & Impact */}
              {activeTab === 'news' && (
                filteredNews.length === 0 ? (
                  <p className="text-center py-6 text-xs text-zinc-500">{isAr ? 'لا توجد أخبار عاجلة جديدة لهذه الجلسة' : 'No new news alerts'}</p>
                ) : (
                  filteredNews.map(item => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-zinc-900/80 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors relative group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-cyan-300 flex items-center gap-1.5">
                          <Newspaper className="w-3.5 h-3.5 text-cyan-400" />
                          {item.symbol ? `[${item.symbol}]` : ''} {item.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500 font-mono">{item.time}</span>
                          <button
                            onClick={(e) => markAsRead(item.id, e)}
                            className="p-1 rounded bg-zinc-800 hover:bg-cyan-500/30 text-zinc-400 hover:text-cyan-300 text-[10px] transition-colors cursor-pointer"
                            title={isAr ? 'إخفاء التنبيه (قراءة)' : 'Mark Read'}
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] pl-6">
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

