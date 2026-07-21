'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { 
  BarChart2, 
  Cpu, 
  Zap, 
  Activity, 
  ArrowRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface Props {
  params: Promise<{
    locale: string;
  }>;
}

export default function DashboardPage({ params }: Props) {
  const { locale } = React.use(params);
  const router = useRouter();
  const isAr = locale === 'ar';
  const [, startTransition] = useTransition();

  // Market Indices states
  const [egx30, setEgx30] = useState<{value: number|null, change: number|null}>({value: null, change: null});
  const [egx70, setEgx70] = useState<{value: number|null, change: number|null}>({value: null, change: null});
  const [egx33, setEgx33] = useState<{value: number|null, change: number|null}>({value: null, change: null});

  // Screener statistics state
  const [statsData, setStatsData] = useState({
    buySignals: 0,
    sellSignals: 0,
    highestVolume: '—',
    bestPerformer: '—',
    bestPerformerPct: 0.0,
  });

  // Market Summary state
  const [marketSummary, setMarketSummary] = useState<{
    aiScore: number | null;
    buyCount: number;
    sellCount: number;
  }>({
    aiScore: null,
    buyCount: 0,
    sellCount: 0,
  });

  // Top Signals state
  const [topSignals, setTopSignals] = useState<any[]>([]);

  // Sector Map state
  const [sectors, setSectors] = useState<any[]>([]);

  // Count animations
  const [analyzedStocks, setAnalyzedStocks] = useState(0);
  const [signalsTested, setSignalsTested] = useState(0);
  const [marketInterval, setMarketInterval] = useState(0);

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const done = localStorage.getItem('onboarding_done');
        if (!done) setShowOnboarding(true);
      }
    });

    fetchMarketOverview();
    fetchTopSignals();
    fetchSectors();
    fetchMarketSummary();

    fetch('/api/egx30').then(r => r.json()).then(setEgx30).catch(console.error);
    fetch('/api/egx70').then(r => r.json()).then(setEgx70).catch(console.error);
    fetch('/api/egx33').then(r => r.json()).then(setEgx33).catch(console.error);

    // Fast real-time index price polling (every 10 seconds)
    const indexIntervalId = setInterval(() => {
      fetch('/api/egx30').then(r => r.json()).then(setEgx30).catch(console.error);
      fetch('/api/egx70').then(r => r.json()).then(setEgx70).catch(console.error);
      fetch('/api/egx33').then(r => r.json()).then(setEgx33).catch(console.error);
    }, 10000);

    // Heavy database data polling (every 5 minutes)
    const dbIntervalId = setInterval(() => {
      fetchMarketOverview();
      fetchTopSignals();
      fetchSectors();
      fetchMarketSummary();
    }, 300000);

    // Animate stats
    const duration = 1500;
    const steps = 60;
    const stepTime = duration / steps;
    let step = 0;

    const animTimer = setInterval(() => {
      step++;
      const progress = step / steps;
      setAnalyzedStocks(Math.round(progress * 314));
      setSignalsTested(Math.round(progress * 1959));
      setMarketInterval(Math.round(progress * 15));

      if (step >= steps) {
        clearInterval(animTimer);
      }
    }, stepTime);

    return () => {
      clearInterval(indexIntervalId);
      clearInterval(dbIntervalId);
      clearInterval(animTimer);
    };
  }, []);

  async function fetchMarketSummary() {
    try {
      const res = await fetch('/api/market-summary');
      const data = await res.json();
      if (data) setMarketSummary(data);
    } catch (e) {
      console.error('Error fetching market summary:', e);
    }
  }

  async function fetchMarketOverview() {
    try {
      const res = await fetch('/api/screener');
      const companies = await res.json();
      if (!Array.isArray(companies) || companies.length === 0) return;

      let buys = 0, sells = 0, maxVolValue = 0;
      let maxVolSymbol = '—', bestSym = '—', bestPct = -999.0;

      companies.forEach((c: any) => {
        if (c.signal_type === 'buy') buys++;
        if (c.signal_type === 'sell') sells++;

        const vol = Number(c.volume || 0);
        if (vol > maxVolValue) {
          maxVolValue = vol;
          maxVolSymbol = c.symbol;
        }

        const open = Number(c.open_price || 0);
        const close = Number(c.close_price || 0);
        const pct = open > 0 ? ((close - open) / open) * 100 : 0;
        if (pct > bestPct) {
          bestPct = pct;
          bestSym = c.symbol;
        }
      });

      setStatsData(prev => ({
        ...prev,
        buySignals: buys,
        sellSignals: sells,
        highestVolume: maxVolSymbol,
        bestPerformer: bestSym,
        bestPerformerPct: bestPct > -999.0 ? bestPct : 0.0,
      }));
    } catch (e) {
      console.error('Error fetching market overview stats:', e);
    }
  }

  async function fetchTopSignals() {
    try {
      const { data, error } = await supabase
        .from('signal_stats')
        .select(`win_rate_tp1, signal_type, companies (id, symbol, name_ar, name_en)`)
        .eq('timeframe', '1d')
        .order('win_rate_tp1', { ascending: false })
        .limit(10);

      if (error) throw error;

      const enriched = await Promise.all(
        (data ?? []).map(async (s: any) => {
          if (!s.companies?.id) return null;
          
          const { data: price } = await supabase
            .from('market_prices')
            .select('close_price, open_price')
            .eq('company_id', s.companies.id)
            .order('price_date', { ascending: false })
            .limit(1)
            .maybeSingle();

          const close = price?.close_price ?? 0;
          const open  = price?.open_price  ?? close;
          const change = open > 0 ? ((close - open) / open) * 100 : 0;

          const rawWinRate = s.win_rate_tp1 !== null && s.win_rate_tp1 !== undefined ? Number(s.win_rate_tp1) : null;
          const winRateVal = rawWinRate !== null ? (rawWinRate > 1 ? rawWinRate : rawWinRate * 100) : null;

          return {
            symbol: s.companies.symbol,
            name: isAr ? s.companies.name_ar : s.companies.name_en,
            signal: s.signal_type || 'buy',
            price: close,
            change,
            winRate: winRateVal !== null ? Math.round(winRateVal) : null,
            score: winRateVal !== null ? Math.min(8, Math.max(1, Math.round(winRateVal / 12.5))) : null,
          };
        })
      );

      setTopSignals(enriched.filter(Boolean).slice(0, 3));
    } catch (e) {
      console.error('Error fetching top signals:', e);
    }
  }

  async function fetchSectors() {
    try {
      const res = await fetch('/api/sectors');
      const data = await res.json();
      if (Array.isArray(data)) setSectors(data);
    } catch (e) {
      console.error('Error fetching sectors heatmap:', e);
    }
  }

  const t = (ar: string, en: string) => (isAr ? ar : en);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="show" 
      variants={containerVariants}
      className="w-full min-h-screen pb-20" 
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* ── Marquee / Ticker Bar ── */}
      <motion.div variants={itemVariants} className="w-full glass-panel px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold rounded-2xl mb-10 overflow-hidden">
        <div className="flex items-center gap-6 animate-pulse-soft">
          {[
            { label: 'EGX30', data: egx30 },
            { label: 'EGX70', data: egx70 },
            { label: 'EGX33', data: egx33 },
          ].map((idx, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-zinc-400">{idx.label}</span>
              <span className="text-white font-mono">{idx.data.value !== null ? idx.data.value.toLocaleString() : '---'}</span>
              {idx.data.change !== null && (
                <span className={`font-mono flex items-center ${idx.data.change >= 0 ? 'text-up-green' : 'text-down-red'}`}>
                  {idx.data.change >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                  {Math.abs(idx.data.change)}%
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-zinc-400 hidden sm:inline">{t('إشارات اليوم:', 'Today signals:')}</span>
          <span className="text-up-green bg-up-green-bg px-2 py-0.5 rounded-md font-mono">{statsData.buySignals} Buy</span>
          <span className="text-down-red bg-down-red-bg px-2 py-0.5 rounded-md font-mono">{statsData.sellSignals} Sell</span>
          <span className="text-accent-blue bg-blue-500/10 px-2 py-0.5 rounded-md font-mono hidden sm:inline">Vol: {statsData.highestVolume}</span>
        </div>
      </motion.div>

      {/* ── Hero Section ── */}
      <motion.section variants={itemVariants} className="relative w-full py-24 flex flex-col items-center justify-center text-center overflow-hidden glass-card rounded-3xl mb-12">
        <div className="absolute top-[-50%] left-[-10%] w-[60%] h-[150%] bg-accent-blue/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-50%] right-[-10%] w-[60%] h-[150%] bg-accent-gold/10 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 mb-8"
        >
          <Image src="/logo.png" alt="TRADEORA" width={220} height={70} className="object-contain drop-shadow-2xl" priority />
        </motion.div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 z-10 tracking-tight leading-tight max-w-4xl">
          {isAr ? (
            <>تحليل أسواق المال بـ <span className="gold-text">الذكاء الاصطناعي</span></>
          ) : (
            <>Financial Markets Driven By <span className="gold-text">AI</span></>
          )}
        </h1>
        
        <p className="text-sm md:text-base text-zinc-400 mb-10 max-w-2xl mx-auto z-10 leading-relaxed">
          {t('نظام متكامل يحلل 314 سهم مصري لحظياً باستخدام خوارزميات تعلم الآلة لتقديم إشارات عالية الدقة للمتداول المحترف.', 'An integrated system analyzing 314 EGX stocks in real-time using machine learning algorithms to provide high-accuracy signals for professional traders.')}
        </p>

        <div className="flex flex-wrap gap-4 z-10 justify-center">
          <Button variant="gold" size="lg" onClick={() => startTransition(() => router.push(`/${locale}/auth`))}>
            {t('ابدأ مجاناً', 'Start for Free')} <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
          </Button>
          <Button variant="glass" size="lg" onClick={() => startTransition(() => router.push(`/${locale}/screener`))}>
            {t('استكشف المنصة', 'Explore Platform')}
          </Button>
        </div>
      </motion.section>

      {/* ── Top Signals ── */}
      <motion.section variants={itemVariants} className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-accent-gold">⚡</span>
            {t('أقوى فرص اليوم', 'Top Opportunities')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topSignals.length === 0 ? (
            <div className="col-span-3 text-center py-12 glass-panel rounded-2xl text-zinc-500">
              {t('جاري تحليل الأسواق...', 'Analyzing markets...')}
            </div>
          ) : (
            topSignals.map((s, idx) => (
              <Card key={idx} className="p-6 cursor-pointer" onClick={() => startTransition(() => router.push(`/${locale}/stock/${s.symbol}`))}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-black text-white mb-1 group-hover:text-accent-blue transition-colors font-mono">{s.symbol}</h3>
                    <p className="text-xs text-zinc-400">{s.name}</p>
                  </div>
                  <Badge variant={s.signal === 'buy' ? 'success' : 'danger'} pulsing>
                    {s.signal === 'buy' ? t('شراء', 'BUY') : t('بيع', 'SELL')}
                  </Badge>
                </div>

                <div className="flex items-end justify-between mb-6">
                  <div>
                    <span className="text-sm text-zinc-500 block mb-1">{t('السعر الحالي', 'Current Price')}</span>
                    <span className="text-2xl font-bold text-white font-mono">{s.price?.toFixed(2)}</span>
                  </div>
                  <div className={`flex items-center gap-1 font-mono font-bold ${s.change >= 0 ? 'text-up-green' : 'text-down-red'}`}>
                    {s.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {Math.abs(s.change).toFixed(2)}%
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">{t('نسبة النجاح', 'Win Rate')}</span>
                    <span className="text-accent-gold font-bold">{s.winRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">{t('قوة الإشارة', 'Strength')}</span>
                    <span className="text-white font-mono">{s.score}/8</span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </motion.section>

      {/* ── Stats ── */}
      <motion.section variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { label: t('سهم مُحلّل', 'Analyzed'), value: analyzedStocks, icon: <BarChart2 className="w-5 h-5 text-accent-blue" />, suffix: '' },
          { label: t('دقة الذكاء الاصطناعي', 'AI Accuracy'), value: marketSummary.aiScore || 85, icon: <Cpu className="w-5 h-5 text-accent-gold" />, suffix: '%' },
          { label: t('إشارة مختبرة', 'Backtested'), value: signalsTested, icon: <Zap className="w-5 h-5 text-up-green" />, suffix: '+' },
          { label: t('تحديث دوري', 'Update Rate'), value: marketInterval, icon: <Activity className="w-5 h-5 text-purple-400" />, suffix: t(' د', 'm') },
        ].map((stat, i) => (
          <Card key={i} hoverEffect={false} className="p-6 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              {stat.icon}
            </div>
            <p className="text-3xl font-black text-white font-mono leading-none mb-2">
              {stat.value.toLocaleString()}{stat.suffix}
            </p>
            <p className="text-xs text-zinc-400">{stat.label}</p>
          </Card>
        ))}
      </motion.section>

      {/* ── Heatmap ── */}
      <motion.section variants={itemVariants} className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-accent-blue">📊</span>
          {t('أداء القطاعات', 'Sector Heatmap')}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {sectors.length === 0 ? (
            <div className="col-span-full text-center py-8 glass-panel rounded-2xl text-zinc-500">
              {t('جاري جلب البيانات...', 'Loading data...')}
            </div>
          ) : (
            sectors.map((sec, idx) => (
              <motion.div
                whileHover={{ scale: 1.05 }}
                key={idx}
                onClick={() => startTransition(() => router.push(`/${locale}/sectors`))}
                className={`p-4 rounded-2xl cursor-pointer flex flex-col justify-between h-28 border transition-colors ${
                  sec.avgChange > 0
                    ? 'bg-up-green-bg border-up-green/20'
                    : sec.avgChange < 0
                      ? 'bg-down-red-bg border-down-red/20'
                      : 'glass-panel'
                }`}
              >
                <span className={`text-[11px] font-bold leading-tight ${sec.avgChange > 0 ? 'text-up-green' : sec.avgChange < 0 ? 'text-down-red' : 'text-zinc-300'}`}>
                  {sec.name}
                </span>
                
                <div className="flex justify-between items-end mt-auto font-mono">
                  <span className="text-[10px] text-zinc-500">{sec.total} {t('سهم', 'stocks')}</span>
                  <span className={`text-sm font-black ${sec.avgChange > 0 ? 'text-up-green' : sec.avgChange < 0 ? 'text-down-red' : 'text-zinc-400'}`}>
                    {sec.avgChange > 0 ? '+' : ''}{sec.avgChange?.toFixed(2)}%
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.section>

      {showOnboarding && (
        <OnboardingFlow
          locale={locale as string}
          onComplete={() => {
            localStorage.setItem('onboarding_done', '1');
            setShowOnboarding(false);
          }}
        />
      )}

    </motion.div>
  );
}
