'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function ComparePage() {
  const { locale } = useParams();
  const isAr = locale === 'ar';
  const [sym1, setSym1] = useState('TMGH');
  const [sym2, setSym2] = useState('HRHO');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<{
    s1: any; s2: any
  }>({ s1: null, s2: null });

  const [companies, setCompanies] = useState<any[]>([]);
  const [search1, setSearch1] = useState('TMGH');
  const [search2, setSearch2] = useState('HRHO');
  const [showDropdown1, setShowDropdown1] = useState(false);
  const [showDropdown2, setShowDropdown2] = useState(false);

  useEffect(() => {
    supabase.from('companies')
      .select('id, symbol, name_ar, name_en')
      .order('symbol')
      .then(({ data }) => {
        if (data) setCompanies(data);
      });
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: cos } = await supabase
        .from('companies')
        .select('id, symbol, name_ar, name_en')
        .in('symbol', [sym1.toUpperCase(), sym2.toUpperCase()]);

      if (!cos || cos.length < 2) {
        alert(isAr ? '⚠️ يرجى التأكد من اختيار سهمين صحيحين للمقارنة.' : '⚠️ Please select two valid stock symbols.');
        setLoading(false);
        return;
      }

      const c1 = cos.find(c => c.symbol === sym1.toUpperCase());
      const c2 = cos.find(c => c.symbol === sym2.toUpperCase());

      if (!c1 || !c2) {
        setLoading(false);
        return;
      }

      const [{ data: p1 }, { data: p2 }] = await Promise.all([
        supabase.from('market_prices')
          .select('price_date, close_price')
          .eq('company_id', c1.id)
          .order('price_date', { ascending: false })
          .limit(90),
        supabase.from('market_prices')
          .select('price_date, close_price')
          .eq('company_id', c2.id)
          .order('price_date', { ascending: false })
          .limit(90),
      ]);

      const prices1 = (p1 ?? []).reverse();
      const prices2 = (p2 ?? []).reverse();

      const base1 = prices1[0]?.close_price ?? 1;
      const base2 = prices2[0]?.close_price ?? 1;

      const chartData: any[] = [];
      const maxLength = Math.max(prices1.length, prices2.length);

      for (let i = 0; i < maxLength; i++) {
        const item1 = prices1[i];
        const item2 = prices2[i];
        const date = item1?.price_date || item2?.price_date || '';

        chartData.push({
          date: new Date(date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' }),
          [sym1]: item1 ? parseFloat(((item1.close_price / base1 - 1) * 100).toFixed(2)) : null,
          [sym2]: item2 ? parseFloat(((item2.close_price / base2 - 1) * 100).toFixed(2)) : null,
        });
      }

      setData(chartData);

      const [{ data: st1 }, { data: st2 }] = await Promise.all([
        supabase.from('signal_stats')
          .select('signal_type, win_rate_tp1, total_signals')
          .eq('company_id', c1.id)
          .eq('timeframe', '1d')
          .maybeSingle(),
        supabase.from('signal_stats')
          .select('signal_type, win_rate_tp1, total_signals')
          .eq('company_id', c2.id)
          .eq('timeframe', '1d')
          .maybeSingle(),
      ]);

      const lastP1 = prices1.at(-1);
      const prevP1 = prices1.at(-2);
      const lastP2 = prices2.at(-1);
      const prevP2 = prices2.at(-2);

      setInfo({
        s1: {
          ...c1,
          stats: st1,
          price: lastP1?.close_price,
          change: (prices1.length > 1 && lastP1 && prevP1)
            ? ((lastP1.close_price - prevP1.close_price) / prevP1.close_price * 100)
            : 0
        },
        s2: {
          ...c2,
          stats: st2,
          price: lastP2?.close_price,
          change: (prices2.length > 1 && lastP2 && prevP2)
            ? ((lastP2.close_price - prevP2.close_price) / prevP2.close_price * 100)
            : 0
        },
      });
    } catch (e) {
      console.error('Error comparing stocks:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredCompanies1 = companies.filter(c =>
    c.symbol.toLowerCase().includes(search1.toLowerCase()) ||
    c.name_ar?.includes(search1) ||
    c.name_en?.toLowerCase().includes(search1.toLowerCase())
  );

  const filteredCompanies2 = companies.filter(c =>
    c.symbol.toLowerCase().includes(search2.toLowerCase()) ||
    c.name_ar?.includes(search2) ||
    c.name_en?.toLowerCase().includes(search2.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="min-h-screen pb-20 font-sans text-text-primary" 
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
          <span className="text-accent-blue">⚖️</span>
          <span>{isAr ? 'مقارنة الأداء النسبي' : 'Relative Performance'}</span>
        </h1>
        <p className="text-sm text-zinc-400">
          {isAr ? 'قارن أداء سهمين على مدار 90 يوماً واكتشف الفروقات الجوهرية.' : 'Compare two assets over 90 days to spot divergence and momentum.'}
        </p>
      </motion.div>

      {/* Input panel with Searchable Dropdowns */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4 mb-8 z-30 relative items-center">
        {/* Dropdown 1 */}
        <div className="flex-1 relative w-full">
          <input
            value={search1}
            onFocus={() => setShowDropdown1(true)}
            onBlur={() => setTimeout(() => setShowDropdown1(false), 200)}
            onChange={e => {
              setSearch1(e.target.value);
              setShowDropdown1(true);
            }}
            placeholder={isAr ? 'ابحث باسم السهم أو الرمز...' : 'Search stock name or symbol...'}
            className="w-full glass-input rounded-xl px-5 py-4 text-accent-blue font-black text-base outline-none focus:border-accent-blue text-center uppercase tracking-wider"
          />
          {showDropdown1 && (
            <div className="absolute left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-surface-elevated border border-white/10 rounded-xl shadow-2xl z-50 divide-y divide-white/5 scrollbar-thin backdrop-blur-xl">
              {filteredCompanies1.slice(0, 50).map(c => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSym1(c.symbol);
                    setSearch1(`${c.symbol} - ${isAr ? c.name_ar : c.name_en}`);
                    setShowDropdown1(false);
                  }}
                  className="px-5 py-3 text-sm text-zinc-300 hover:bg-accent-blue/10 hover:text-white cursor-pointer transition flex justify-between items-center"
                >
                  <span className="font-black text-accent-blue font-mono">{c.symbol}</span>
                  <span className="truncate max-w-[200px] text-zinc-500 text-[11px]">{isAr ? c.name_ar : c.name_en}</span>
                </div>
              ))}
              {filteredCompanies1.length === 0 && (
                <div className="px-5 py-4 text-sm text-zinc-500 text-center">
                  {isAr ? 'لا توجد نتائج' : 'No results found'}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-lg shadow-black/20">
          <span className="text-zinc-500 text-sm font-black italic">VS</span>
        </div>

        {/* Dropdown 2 */}
        <div className="flex-1 relative w-full">
          <input
            value={search2}
            onFocus={() => setShowDropdown2(true)}
            onBlur={() => setTimeout(() => setShowDropdown2(false), 200)}
            onChange={e => {
              setSearch2(e.target.value);
              setShowDropdown2(true);
            }}
            placeholder={isAr ? 'ابحث باسم السهم أو الرمز...' : 'Search stock name or symbol...'}
            className="w-full glass-input rounded-xl px-5 py-4 text-accent-gold font-black text-base outline-none focus:border-accent-gold text-center uppercase tracking-wider"
          />
          {showDropdown2 && (
            <div className="absolute left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-surface-elevated border border-white/10 rounded-xl shadow-2xl z-50 divide-y divide-white/5 scrollbar-thin backdrop-blur-xl">
              {filteredCompanies2.slice(0, 50).map(c => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSym2(c.symbol);
                    setSearch2(`${c.symbol} - ${isAr ? c.name_ar : c.name_en}`);
                    setShowDropdown2(false);
                  }}
                  className="px-5 py-3 text-sm text-zinc-300 hover:bg-accent-gold/10 hover:text-white cursor-pointer transition flex justify-between items-center"
                >
                  <span className="font-black text-accent-gold font-mono">{c.symbol}</span>
                  <span className="truncate max-w-[200px] text-zinc-500 text-[11px]">{isAr ? c.name_ar : c.name_en}</span>
                </div>
              ))}
              {filteredCompanies2.length === 0 && (
                <div className="px-5 py-4 text-sm text-zinc-500 text-center">
                  {isAr ? 'لا توجد نتائج' : 'No results found'}
                </div>
              )}
            </div>
          )}
        </div>

        <Button
          onClick={loadData}
          disabled={loading}
          size="lg"
          className="w-full md:w-auto self-stretch"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : (
            <span>{isAr ? 'قارن الآن' : 'Compare'}</span>
          )}
        </Button>
      </motion.div>

      {/* Statistics info row */}
      <AnimatePresence mode="wait">
        {info.s1 && info.s2 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8"
          >
            {[
              { stock: info.s1, color: 'text-accent-blue', border: 'border-accent-blue/30', bg: 'bg-accent-blue/5' },
              { stock: info.s2, color: 'text-accent-gold', border: 'border-accent-gold/30', bg: 'bg-accent-gold/5' },
            ].map(({ stock, color, border, bg }) => {
              const sigType = stock.stats?.signal_type;
              return (
                <Card hoverEffect={false} key={stock.id} className={`p-6 border-2 ${border} ${bg}`}>
                  <h3 className={`${color} font-black text-2xl mb-1 font-mono tracking-tight`}>
                    {stock.symbol}
                  </h3>
                  <p className="text-zinc-400 text-xs mb-5 font-medium">
                    {isAr ? (stock.name_ar || stock.name_en) : (stock.name_en || stock.name_ar)}
                  </p>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                      <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{isAr ? 'آخر سعر' : 'Last Price'}</span>
                      <span className="text-white font-black font-mono text-sm">{stock.price?.toFixed(2)} EGP</span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                      <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{isAr ? 'التغير اليومي' : 'Daily Change'}</span>
                      <span className={`font-black font-mono text-sm ${stock.change > 0 ? 'text-up-green' : stock.change < 0 ? 'text-down-red' : 'text-zinc-400'}`}>
                        {stock.change > 0 ? '+' : ''}{stock.change?.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                      <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{isAr ? 'الإشارة الحالية' : 'Current Signal'}</span>
                      <Badge variant={sigType === 'buy' ? 'success' : sigType === 'sell' ? 'danger' : 'warning'}>
                        {sigType?.toUpperCase() ?? '—'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-2.5">
                      <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{isAr ? 'نسبة نجاح الإشارات' : 'Signal Win Rate'}</span>
                      <span className="text-white font-black font-mono text-sm">{stock.stats?.win_rate_tp1 ? `${stock.stats.win_rate_tp1.toFixed(0)}%` : '—'}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chart Panel */}
      <AnimatePresence>
        {data.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card hoverEffect={false} className="p-6">
              <h3 className="text-white font-bold text-sm mb-6 uppercase tracking-wider">
                {isAr ? 'الأداء النسبي التراكمي (%)' : 'Relative Performance Trend (%)'}
              </h3>
              <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#71717A', fontSize: 10 }} 
                      axisLine={false} 
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis 
                      tickFormatter={v => `${v}%`} 
                      tick={{ fill: '#71717A', fontSize: 10 }} 
                      axisLine={false}
                      tickLine={false}
                      dx={-10}
                    />
                    <Tooltip
                      formatter={(v: any) => [`${v}%`, '']}
                      contentStyle={{
                        background: 'rgba(11, 15, 25, 0.9)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '12px',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                      }}
                      labelStyle={{ color: '#9CA3AF', marginBottom: '4px' }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px', paddingTop: '20px', fontWeight: 'bold' }} 
                      iconType="circle"
                    />
                    <Line
                      type="monotone"
                      dataKey={sym1}
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: '#3B82F6', stroke: '#0B0F19', strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey={sym2}
                      stroke="#FCD34D"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: '#FCD34D', stroke: '#0B0F19', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
