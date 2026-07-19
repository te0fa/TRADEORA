'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { supabase } from '@/lib/supabase';

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
          [sym1]: item1 ? parseFloat(((item1.close_price / base1 - 1) * 100).toFixed(2)) : 0,
          [sym2]: item2 ? parseFloat(((item2.close_price / base2 - 1) * 100).toFixed(2)) : 0,
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

  return (
    <div className="min-h-screen p-6 font-sans text-text-primary mb-20" dir={isAr ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <span>⚖️</span>
        <span>{isAr ? 'مقارنة الأداء النسبي للأسهم' : 'Stock Relative Performance'}</span>
      </h1>

      {/* Input panel with Searchable Dropdowns */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 z-30 relative">
        {/* Dropdown 1 */}
        <div className="flex-1 relative">
          <input
            value={search1}
            onFocus={() => setShowDropdown1(true)}
            onBlur={() => setTimeout(() => setShowDropdown1(false), 200)}
            onChange={e => {
              setSearch1(e.target.value);
              setShowDropdown1(true);
            }}
            placeholder={isAr ? 'ابحث باسم السهم أو الرمز...' : 'Search stock name or symbol...'}
            className="w-full bg-white/5 border border-blue-500/30 rounded-xl px-4 py-3 text-blue-400 font-extrabold text-sm outline-none focus:border-blue-500 text-center"
          />
          {showDropdown1 && (
            <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 divide-y divide-white/5 scrollbar-thin">
              {filteredCompanies1.slice(0, 50).map(c => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSym1(c.symbol);
                    setSearch1(`${c.symbol} - ${isAr ? c.name_ar : c.name_en}`);
                    setShowDropdown1(false);
                  }}
                  className="px-4 py-2.5 text-xs text-slate-300 hover:bg-blue-600/20 hover:text-white cursor-pointer transition flex justify-between items-center"
                >
                  <span className="font-bold text-blue-400 font-mono">{c.symbol}</span>
                  <span className="truncate max-w-[200px] text-slate-400 text-[10px]">{isAr ? c.name_ar : c.name_en}</span>
                </div>
              ))}
              {filteredCompanies1.length === 0 && (
                <div className="px-4 py-3 text-xs text-slate-500 text-center">
                  {isAr ? 'لا توجد نتائج' : 'No results found'}
                </div>
              )}
            </div>
          )}
        </div>

        <span className="text-slate-500 text-xl font-black self-center text-center">VS</span>

        {/* Dropdown 2 */}
        <div className="flex-1 relative">
          <input
            value={search2}
            onFocus={() => setShowDropdown2(true)}
            onBlur={() => setTimeout(() => setShowDropdown2(false), 200)}
            onChange={e => {
              setSearch2(e.target.value);
              setShowDropdown2(true);
            }}
            placeholder={isAr ? 'ابحث باسم السهم أو الرمز...' : 'Search stock name or symbol...'}
            className="w-full bg-white/5 border border-purple-500/30 rounded-xl px-4 py-3 text-purple-400 font-extrabold text-sm outline-none focus:border-purple-500 text-center"
          />
          {showDropdown2 && (
            <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 divide-y divide-white/5 scrollbar-thin">
              {filteredCompanies2.slice(0, 50).map(c => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSym2(c.symbol);
                    setSearch2(`${c.symbol} - ${isAr ? c.name_ar : c.name_en}`);
                    setShowDropdown2(false);
                  }}
                  className="px-4 py-2.5 text-xs text-slate-300 hover:bg-purple-600/20 hover:text-white cursor-pointer transition flex justify-between items-center"
                >
                  <span className="font-bold text-purple-400 font-mono">{c.symbol}</span>
                  <span className="truncate max-w-[200px] text-slate-400 text-[10px]">{isAr ? c.name_ar : c.name_en}</span>
                </div>
              ))}
              {filteredCompanies2.length === 0 && (
                <div className="px-4 py-3 text-xs text-slate-500 text-center">
                  {isAr ? 'لا توجد نتائج' : 'No results found'}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl transition-all cursor-pointer text-xs self-stretch md:self-auto"
        >
          {loading ? '...' : (isAr ? 'قارن الآن' : 'Compare')}
        </button>
      </div>

      {/* Statistics info row */}
      {info.s1 && info.s2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {[
            { stock: info.s1, color: 'text-blue-400', border: 'border-blue-500/20' },
            { stock: info.s2, color: 'text-purple-400', border: 'border-purple-500/20' },
          ].map(({ stock, color, border }) => (
            <div key={stock.id} className={`bg-white/5 border ${border} rounded-2xl p-5`}>
              <h3 className={`${color} font-black text-lg mb-3 font-mono`}>
                {stock.symbol} — {isAr ? (stock.name_ar || stock.name_en) : (stock.name_en || stock.name_ar)}
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-slate-400">{isAr ? 'آخر سعر:' : 'Last Price:'}</span>
                  <span className="text-white font-bold font-mono">{stock.price?.toFixed(2)} EGP</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-slate-400">{isAr ? 'التغير اليومي:' : 'Daily Change:'}</span>
                  <span className={`font-bold font-mono ${stock.change > 0 ? 'text-green-400' : stock.change < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                    {stock.change > 0 ? '+' : ''}{stock.change?.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-slate-400">{isAr ? 'الإشارة الحالية:' : 'Current Signal:'}</span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    stock.stats?.signal_type === 'buy' ? 'bg-green-500/10 text-green-400' : stock.stats?.signal_type === 'sell' ? 'bg-red-500/10 text-red-400' : 'bg-slate-500/10 text-slate-400'
                  }`}>
                    {stock.stats?.signal_type?.toUpperCase() ?? '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-400">{isAr ? 'نسبة نجاح الإشارات:' : 'Signal Win Rate (TP1):'}</span>
                  <span className="text-white font-bold font-mono">{stock.stats?.win_rate_tp1 ? `${stock.stats.win_rate_tp1.toFixed(0)}%` : '—'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chart Panel */}
      {data.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-bold text-sm mb-4">
            {isAr ? 'الأداء النسبي التراكمي (آخر 90 يوم)' : 'Relative Performance Trend (Last 90 Days)'}
          </h3>
          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tickFormatter={v => `${v}%`} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  formatter={(v: any) => [`${v}%`, '']}
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey={sym1}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey={sym2}
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
