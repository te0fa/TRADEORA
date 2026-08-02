'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Filter, TrendingUp, TrendingDown, Building2, ExternalLink, Clock, ShieldCheck, Newspaper } from 'lucide-react';

export default function CalendarPage({ params }: { params: { locale: string } }) {
  const isAr = params.locale === 'ar';
  const [events, setEvents] = useState<any[]>([]);
  const [insiders, setInsiders] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'events' | 'insiders' | 'news'>('events');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [evRes, insRes, newsRes] = await Promise.all([
          fetch('/api/corporate-events?limit=40'),
          fetch('/api/insider-trading?limit=30'),
          fetch('/api/news?limit=30')
        ]);
        
        const evData = await evRes.json();
        const insData = await insRes.json();
        const newsData = await newsRes.json();

        setEvents(evData.events || []);
        setInsiders(insData.transactions || []);
        setNews(newsData.news || newsData.data || []);
      } catch (err) {
        console.error('Error fetching calendar data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredEvents = events.filter(e => {
    if (selectedType === 'all') return true;
    return e.event_type === selectedType;
  });

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 sm:p-8 rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/30 via-zinc-900 to-blue-950/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🏛️</span>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {isAr ? 'المصدر الأول: البورصة المصرية الرسمية' : 'Primary Source: Official EGX'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {isAr ? 'النتائج والفعاليات الاقتصادية (Economic & Corporate Calendar)' : 'Economic & Corporate Calendar'}
            </h1>
            <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
              {isAr 
                ? 'تتبع مواعيد إعلانات الأرباح، الجمعيات العامة، توزيعات الأرباح، وصدر إفصاحات كبار المساهمين ومجلس الإدارة المباشرة.'
                : 'Track upcoming earnings releases, general assemblies, dividend payouts, and official board member insider transactions.'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs Control */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'events' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            {isAr ? 'أجندة الفعاليات والنتائج' : 'Corporate Events'}
          </button>
          <button
            onClick={() => setActiveTab('insiders')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'insiders' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {isAr ? 'تعاملات كبار المساهمين (Insiders)' : 'Insider Trading'}
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'news' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            {isAr ? 'الأخبار والروابط الموثقة' : 'Verified News'}
          </button>
        </div>

        {activeTab === 'events' && (
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-zinc-900 text-zinc-200 border border-zinc-700 px-3 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500"
            >
              <option value="all">{isAr ? 'كل الفعاليات' : 'All Events'}</option>
              <option value="earnings">{isAr ? 'إعلانات الأرباح' : 'Earnings'}</option>
              <option value="general_assembly">{isAr ? 'الجمعيات العامة' : 'General Assemblies'}</option>
              <option value="dividend">{isAr ? 'توزيعات الأرباح' : 'Dividends'}</option>
              <option value="board_meeting">{isAr ? 'اجتماعات مجلس الإدارة' : 'Board Meetings'}</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Content Areas */}
      {loading ? (
        <div className="py-20 text-center text-zinc-500 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span>{isAr ? 'جاري جلب الفعاليات الرسمية من البورصة...' : 'Loading official events...'}</span>
        </div>
      ) : (
        <>
          {/* TAB 1: EVENTS CALENDAR */}
          {activeTab === 'events' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map((ev, idx) => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} key={ev.id || idx} className="glass-panel p-5 rounded-2xl border border-zinc-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-md bg-zinc-800 text-emerald-400 border border-zinc-700">
                        {ev.companies?.symbol || ev.symbol}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {ev.type_ar}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-white line-clamp-2 leading-relaxed">
                      {ev.details_ar || ev.companies?.name_ar}
                    </h3>

                    {ev.countdown_days !== undefined && ev.countdown_days > 0 && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg w-fit">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{ev.countdown_days} {isAr ? 'أيام متبقية على الموعد' : 'days remaining'}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 font-mono">
                    <span>{new Date(ev.event_date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</span>
                    {ev.source_url && (
                      <a href={ev.source_url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline flex items-center gap-1">
                        <span>{isAr ? 'الإفصاح' : 'View'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* TAB 2: INSIDER TRADING */}
          {activeTab === 'insiders' && (
            <div className="space-y-4">
              {insiders.map((ins, idx) => (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }} key={ins.id || idx} className="glass-panel p-5 rounded-2xl border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl border ${ins.transaction_type === 'buy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                      {ins.transaction_type === 'buy' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base font-mono">{ins.symbol}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-bold font-mono ${ins.transaction_type === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {ins.transaction_type === 'buy' ? (isAr ? '🟢 شراء قيادي' : 'BUY') : (isAr ? '🔴 بيع قيادي' : 'SELL')}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        {ins.position_ar || 'عضو مجلس إدارة'} ({ins.insider_name})
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs space-y-1">
                    <span className="text-zinc-500 block">{isAr ? 'التاريخ الرسمى' : 'Date'}</span>
                    <span className="text-white font-bold">{ins.transaction_date}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* TAB 3: VERIFIED NEWS WITH BADGES */}
          {activeTab === 'news' && (
            <div className="space-y-4">
              {news.map((item, idx) => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} key={item.id || idx} className="glass-panel p-5 rounded-2xl border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-1 rounded-md font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {item.source || '🏛️ البورصة المصرية (رسمي)'}
                      </span>
                      {item.companies?.symbol && (
                        <span className="text-xs font-mono text-zinc-400 font-bold">
                          [{item.companies.symbol}]
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-white leading-relaxed">{item.title}</h3>
                    {item.expected_impact_ar && (
                      <p className="text-xs text-zinc-400">{item.expected_impact_ar}</p>
                    )}
                  </div>

                  <a href={item.url} target="_blank" rel="noreferrer" className="text-xs font-mono text-emerald-400 hover:underline flex items-center gap-1 border border-emerald-500/20 px-3 py-1.5 rounded-lg bg-emerald-500/5">
                    <span>{isAr ? 'قراءة الخبر' : 'Read'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
