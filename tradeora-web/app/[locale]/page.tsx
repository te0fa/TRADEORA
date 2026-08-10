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
  TrendingDown,
  Info
} from 'lucide-react';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { MarketMoversWidget } from '@/components/dashboard/MarketMoversWidget';
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
  const [egx100, setEgx100] = useState<{value: number|null, change: number|null}>({value: null, change: null});
  const [egx33, setEgx33] = useState<{value: number|null, change: number|null}>({value: null, change: null});

  const [statsData, setStatsData] = useState({
    buySignals: 0,
    sellSignals: 0,
    highestVolume: '—',
    highestVolumeName: '',
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

  // Foreign Investor Flows state
  const [investorFlows, setInvestorFlows] = useState<any>(null);

  // Market Breadth state
  const [marketBreadth, setMarketBreadth] = useState<any>(null);

  // Count animations
  const [analyzedStocks, setAnalyzedStocks] = useState(0);
  const [signalsTested, setSignalsTested] = useState(0);
  const [marketInterval, setMarketInterval] = useState(0);

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      if (user) {
        const done = localStorage.getItem('onboarding_done');
        if (!done) setShowOnboarding(true);
      }
    });

    fetchMarketOverview();
    fetchTopSignals();
    fetchSectors();
    fetchMarketSummary();
    fetchInvestorFlows();

    const fetchLiveIndices = async () => {
      try {
        const res = await fetch('/api/market-indices', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.egx30)  setEgx30(data.egx30);
          if (data.egx70)  setEgx70(data.egx70);
          if (data.egx100) setEgx100(data.egx100);
          if (data.egx33)  setEgx33(data.egx33);
        }
      } catch { /* silent fallback */ }
    };

    fetchLiveIndices();
    fetchInvestorFlows();
    fetchMarketBreadth();
    // Poll every 5 seconds — strict 5s synchronized live index update cycle
    const indexIntervalId = setInterval(fetchLiveIndices, 5000);


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
      setAnalyzedStocks(Math.round(progress * 281));
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

  async function fetchMarketBreadth() {
    try {
      const res = await fetch('/api/market-breadth');
      const data = await res.json();
      if (data?.success) setMarketBreadth(data.breadth);
    } catch (e) {
      console.error('Error fetching market breadth:', e);
    }
  }

  async function fetchInvestorFlows() {
    try {
      const res = await fetch('/api/investor-flows');
      const data = await res.json();
      if (data?.success) setInvestorFlows(data);
    } catch (e) {
      console.error('Error fetching investor flows:', e);
    }
  }

  async function fetchMarketOverview() {
    try {
      const res = await fetch('/api/screener');
      const companies = await res.json();
      if (!Array.isArray(companies) || companies.length === 0) return;

      let buys = 0, sells = 0, maxVolValue = 0;
      let maxVolSymbol = '—', maxVolCompanyName = '', bestSym = '—', bestPct = -999.0;

      companies.forEach((c: any) => {
        const sig = String(c.signal || c.signal_type || '').toLowerCase();
        if (sig === 'buy') buys++;
        if (sig === 'sell') sells++;

        const vol = Number(c.volume || 0);
        if (vol > maxVolValue) {
          maxVolValue = vol;
          maxVolSymbol = c.symbol;
          maxVolCompanyName = isAr ? c.name_ar : c.name_en;
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
        highestVolumeName: maxVolCompanyName,
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
        .select(`win_rate_tp1, signal_type, companies!inner (id, symbol, name_ar, name_en, status)`)
        .eq('timeframe', '1d')
        .eq('signal_type', 'buy') // Strictly fetch BUY opportunities!
        .eq('companies.status', 'active')
        .not('win_rate_tp1', 'is', null)
        .order('win_rate_tp1', { ascending: false })
        .limit(15);

      if (error) throw error;

      const enriched = await Promise.all(
        (data ?? []).map(async (s: any) => {
          if (!s.companies?.id || s.companies.status !== 'active') return null;
          
          const { data: price } = await supabase
            .from('market_prices')
            .select('open_price, close_price')
            .eq('company_id', s.companies.id)
            .order('price_date', { ascending: false })
            .limit(1)
            .maybeSingle();

          const open = price?.open_price ? Number(price.open_price) : 0;
          const close = price?.close_price ? Number(price.close_price) : 0;
          const changePercent = open > 0 && close > 0 ? Number((((close - open) / open) * 100).toFixed(2)) : 0;

          const rawWinRate = s.win_rate_tp1 !== null && s.win_rate_tp1 !== undefined ? Number(s.win_rate_tp1) : null;
          const winRateVal = rawWinRate != null ? (rawWinRate > 1 ? rawWinRate : rawWinRate * 100) : null;

          return {
            symbol: s.companies.symbol,
            name: (isAr ? s.companies.name_ar : s.companies.name_en) || s.companies.symbol,
            signal: 'buy',
            price: close || null,
            change: changePercent,
            winRate: winRateVal != null ? Math.round(winRateVal) : null,
            score: winRateVal != null ? Math.min(8, Math.max(1, Math.round(winRateVal / 12.5))) : null,
          };
        })
      );

      const valid = enriched.filter(Boolean);
      setTopSignals(valid.slice(0, 3));
    } catch (e) {
      console.error('Error fetching top signals:', e);
      setTopSignals([]);
    }
  }

  async function fetchSectors() {
    try {
      const res = await fetch('/api/sectors');
      const data = await res.json();
      if (data?.success && Array.isArray(data.sectors)) {
        const normalized = data.sectors.map((s: any) => ({
          ...s,
          name: s.name || s.sector_name || 'عام',
          avgChange: s.avgChange ?? s.avgChangePct ?? 0,
          total: s.total ?? 0,
        }));
        setSectors(normalized);
      } else if (Array.isArray(data)) {
        setSectors(data);
      } else {
        setSectors([]);
      }
    } catch (e) {
      console.error('Error fetching sectors heatmap:', e);
      setSectors([]);
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
      <motion.div variants={itemVariants} className="w-full glass-panel px-4 py-3.5 flex flex-col gap-3 rounded-2xl mb-10 overflow-hidden border border-white/10 shadow-lg backdrop-blur-md">
        {/* Row 1: Market Indices */}
        <div className="w-full flex items-center justify-between flex-wrap gap-4 animate-pulse-soft">
          {[
            { label: 'EGX30', data: egx30 },
            { label: 'EGX70', data: egx70 },
            { label: 'EGX100', data: egx100 },
            { label: 'EGX33', data: egx33 },
          ].map((idx, i) => (
            <div key={i} className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-zinc-400 font-bold">{idx.label}</span>
              <span className="text-white font-mono font-extrabold">{idx.data?.value != null ? Number(idx.data.value).toLocaleString('en-US') : '---'}</span>
              {idx.data?.change != null ? (
                <span className={`font-mono font-bold flex items-center ${idx.data.change >= 0 ? 'text-up-green' : 'text-down-red'}`} dir="ltr">
                  {idx.data.change >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                  {idx.data.change >= 0 ? '+' : ''}{idx.data.change}%
                </span>
              ) : (
                <span className="font-mono text-zinc-500">---</span>
              )}
            </div>
          ))}
        </div>

        {/* Row 2: Fixed Row for Today's Signals & Top Volume Stock */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold pt-2.5 border-t border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-zinc-300 font-bold flex items-center gap-1.5">
              <span>{isAr ? 'إشارات اليوم:' : 'Today Signals:'}</span>
              <span 
                className="relative group cursor-pointer inline-flex items-center text-accent-blue hover:text-white"
                title={isAr ? "الفرز الفني اللحظي للمؤشرات لجميع أسهم البورصة (281 سهم). يختلف عن صفقات وتوصيات التداول المحددة في صفحة الأداء." : "Instant technical screener signals for all 281 EGX stocks."}
              >
                <Info className="w-3.5 h-3.5" />
              </span>
            </span>
            <span className="text-up-green bg-up-green-bg px-2.5 py-0.5 rounded-md font-mono font-bold border border-emerald-500/20">{statsData.buySignals} Buy</span>
            <span className="text-down-red bg-down-red-bg px-2.5 py-0.5 rounded-md font-mono font-bold border border-rose-500/20">{statsData.sellSignals} Sell</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-medium">{isAr ? 'الأعلى حجم تداول اليوم:' : 'Top Volume Stock:'}</span>
            <div 
              className="relative group cursor-pointer inline-flex items-center gap-1.5 text-accent-blue bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-md font-mono font-semibold hover:bg-blue-500/20 transition-colors"
              title={isAr ? "السهم الأعلى حجماً اليوم: يظهر كود البورصة أولاً (رمز السهم مثل ARAB) متبوعاً باسم الشركة بالكامل باللغة العربية لسهولة التعرف عليه." : "Highest volume stock today: Shows ticker symbol followed by full company name."}
            >
              <span className="font-bold">{statsData.highestVolume}</span>
              {statsData.highestVolumeName && <span className="text-zinc-300 font-sans font-normal">({statsData.highestVolumeName})</span>}
              <Info className="w-3.5 h-3.5 text-accent-blue/80 group-hover:text-white transition-colors ml-0.5" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Foreign Investor Flow Banner ── */}
      {investorFlows?.latest && (
        (() => {
          const formatFlowAmount = (val: number) => {
            if (val === undefined || val === null || isNaN(val)) return '0';
            const abs = Math.abs(val);
            if (abs >= 1_000_000_000) {
              const b = (val / 1_000_000_000).toFixed(2);
              return isAr ? `${b} مليار ج.م` : `${b}B EGP`;
            }
            if (abs >= 1_000_000) {
              const m = (val / 1_000_000).toFixed(1);
              return isAr ? `${m}M ج.م` : `${m}M EGP`;
            }
            const k = (val / 1000).toFixed(1);
            return isAr ? `${k}K ج.م` : `${k}K EGP`;
          };

          return (
            <motion.div variants={itemVariants} className="w-full glass-panel px-5 py-3.5 rounded-2xl mb-8 flex flex-wrap items-center justify-between gap-4 border border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center gap-3">
                <span className="text-xl">🌍</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {isAr ? 'تدفقات الأجانب والمؤسسات (EGX Official)' : 'Foreign & Institutional Flows'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                      investorFlows.latest.foreigners_net >= 0 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {investorFlows.latest.foreigners_net >= 0 ? '🟢 أجانب يشترون' : '🔴 أجانب يبيعون'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {investorFlows.recommendation_impact}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="text-right">
                  <span className="text-zinc-500 block text-[10px]">{isAr ? 'صافي الأجانب' : 'Foreign Net'}</span>
                  <span className={`font-bold ${investorFlows.latest.foreigners_net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatFlowAmount(investorFlows.latest.foreigners_net)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-500 block text-[10px]">{isAr ? 'مؤسسات مصرية' : 'Egy Inst.'}</span>
                  <span className={`font-bold ${investorFlows.latest.egyptian_inst_net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatFlowAmount(investorFlows.latest.egyptian_inst_net)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-500 block text-[10px]">{isAr ? 'أفراد مصرية' : 'Egy Retail'}</span>
                  <span className={`font-bold ${investorFlows.latest.egyptian_ind_net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatFlowAmount(investorFlows.latest.egyptian_ind_net)}
                  </span>
                </div>
                <button
                  onClick={() => router.push(`/${locale}/investor-flows`)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold hover:bg-emerald-500/30 transition-all text-xs"
                >
                  {isAr ? 'تفاصيل التدفقات 📊' : 'View Flows'}
                </button>
              </div>
            </motion.div>
          );
        })()
      )}

      {/* ── Market Breadth & Health Banner ── */}
      {marketBreadth && (
        <motion.div variants={itemVariants} className="w-full glass-panel px-5 py-3.5 rounded-2xl mb-8 flex flex-wrap items-center justify-between gap-4 border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-3">
            <span className="text-xl">📈</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {isAr ? 'اتساع وصحة تداول السوق (Market Breadth)' : 'Market Breadth & Health'}
                </span>
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {marketBreadth.market_health_status === 'strong_bullish' ? (isAr ? '🟢 صعود صحي ممتاز' : 'Strong Bullish') : (isAr ? '🔵 صعود معتدل' : 'Healthy Rally')}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isAr ? 'قياس مشاركة جميع أسهم البورصة لضمان عدم تركز الصعود في أسهم معينة.' : 'Measures market participation across all EGX stocks.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-zinc-500 block text-[10px]">{isAr ? 'أسهم صاعدة / هابطة' : 'Adv / Dec'}</span>
              <span className="font-bold text-emerald-400">{marketBreadth.advance_count}🟢</span>
              <span className="text-zinc-500 px-1">/</span>
              <span className="font-bold text-rose-400">{marketBreadth.decline_count}🔴</span>
            </div>
            <div className="text-right">
              <span className="text-zinc-500 block text-[10px]">{isAr ? '% فوق متوسط 200' : '% > MA200'}</span>
              <span className="font-bold text-cyan-400">{marketBreadth.pct_above_ma200}%</span>
            </div>
            <div className="text-right">
              <span className="text-zinc-500 block text-[10px]">McClellan Oscillator</span>
              <span className="font-bold text-amber-400">+{marketBreadth.mcclellan_oscillator}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Top Market Movers Widget (Gainers, Losers, Most Active) ── */}
      <motion.div variants={itemVariants} className="mb-8">
        <MarketMoversWidget locale={locale} />
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
          {t('نظام متكامل يحلل 281 سهم مصري نشط لحظياً باستخدام خوارزميات تعلم الآلة لتقديم إشارات عالية الدقة للمتداول المحترف.', 'An integrated system analyzing 281 active EGX stocks in real-time using machine learning algorithms to provide high-accuracy signals for professional traders.')}
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
              {stat.value != null ? Number(stat.value).toLocaleString('en-US') : 0}{stat.suffix}
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
            sectors.map((sec, idx) => {
              const chg = Number(sec.avgChange ?? sec.avgChangePct ?? 0);
              const secName = sec.name || sec.sector_name || 'عام';
              return (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  key={idx}
                  onClick={() => startTransition(() => router.push(`/${locale}/sectors`))}
                  className={`p-4 rounded-2xl cursor-pointer flex flex-col justify-between h-28 border transition-colors ${
                    chg > 0
                      ? 'bg-up-green-bg border-up-green/20'
                      : chg < 0
                        ? 'bg-down-red-bg border-down-red/20'
                        : 'glass-panel'
                  }`}
                >
                  <span className={`text-[11px] font-bold leading-tight ${chg > 0 ? 'text-up-green' : chg < 0 ? 'text-down-red' : 'text-zinc-300'}`}>
                    {secName}
                  </span>
                  <div className="flex justify-between items-end mt-auto font-mono">
                    <span className="text-[10px] text-zinc-500">{sec.total ?? 0} {t('سهم', 'stocks')}</span>
                    <span className={`text-sm font-black ${chg > 0 ? 'text-up-green' : chg < 0 ? 'text-down-red' : 'text-zinc-400'}`}>
                      {chg > 0 ? '+' : ''}{chg.toFixed(2)}%
                    </span>
                  </div>
                </motion.div>
              );
            })
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
