'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Award, TrendingUp, ShieldCheck, DollarSign, BarChart2, Info, ArrowUpRight } from 'lucide-react';

interface InvestmentGem {
  id: string;
  symbol: string;
  name_ar: string;
  name_en: string;
  sector: string;
  current_price: number;
  fair_value: number;
  upside_potential: number;
  dividend_yield: number;
  pe_ratio: number | null;
  pb_ratio: number | null;
  investment_score: number;
  badges: Array<{ id: string; text_ar: string; text_en: string }>;
  target_price_1: number;
  target_price_2: number;
  stop_loss: number;
  trade_style_ar: string;
}

export default function LongTermInvestmentPage() {
  const [gems, setGems] = useState<InvestmentGem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'dividend' | 'value'>('all');

  useEffect(() => {
    setLoading(true);
    fetch('/api/long-term-investments')
      .then((res) => res.json())
      .then((data) => {
        setGems(data.gems || []);
        setStats(data.stats || null);
      })
      .catch((err) => console.error('Error fetching long term gems:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredGems = gems.filter((g) => {
    if (filter === 'dividend') return g.dividend_yield >= 6.0;
    if (filter === 'value') return g.upside_potential >= 25.0;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* Header Banner */}
      <div className="max-w-7xl mx-mx-auto mb-8 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/60 border border-emerald-500/20 rounded-2xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 font-mono text-xs">
                🏛️ Multi-Factor Engine (1W & 1M)
              </Badge>
              <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 py-1 font-mono text-xs">
                أفق طويل الأجل (6 - 24 شهر)
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              جواهر الاستثمار طويل الأجل <span className="text-emerald-400">Value & Dividend Gems</span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base mt-2 max-w-2xl">
              تصفية فائقة الذكاء تعتمد على هامش الأمان للسعر العادل (Fair Value Margin of Safety)، توزيعات الأرباح، معنويات الأخبار، والتأكيد الفني على الشمعات الأسبوعية والشهرية.
            </p>
          </div>

          {/* Stats Box */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full md:w-auto">
            <Card className="bg-slate-900/80 border-slate-800 p-4 text-center">
              <div className="text-slate-400 text-xs font-semibold mb-1">الفرص المتاحة</div>
              <div className="text-2xl font-black text-emerald-400">{stats?.total_gems || gems.length}</div>
            </Card>

            <Card className="bg-slate-900/80 border-slate-800 p-4 text-center">
              <div className="text-slate-400 text-xs font-semibold mb-1">متوسط التوزيعات</div>
              <div className="text-2xl font-black text-cyan-400">
                {stats?.avg_dividend_yield ? `${stats.avg_dividend_yield}%` : '—'}
              </div>
            </Card>

            <Card className="bg-slate-900/80 border-slate-800 p-4 text-center col-span-2 md:col-span-1">
              <div className="text-slate-400 text-xs font-semibold mb-1">أعلى نمو متوقع</div>
              <div className="text-2xl font-black text-yellow-400">
                {stats?.top_upside_percent ? `+${stats.top_upside_percent}%` : '—'}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="max-w-7xl mx-auto mb-6 flex items-center gap-3 border-b border-slate-800 pb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            filter === 'all'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          كل الجواهر (All Gems)
        </button>

        <button
          onClick={() => setFilter('value')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            filter === 'value'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          💎 أعلى هامش أمان (Fair Value)
        </button>

        <button
          onClick={() => setFilter('dividend')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            filter === 'dividend'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          💰 أعلى توزيعات أرباح (Dividend Yield)
        </button>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-slate-900/60 border-slate-800 p-6 h-64 animate-pulse" />
            ))}
          </div>
        ) : filteredGems.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
            <Info className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-300">لا توجد صفقات استثمارية مطابقة حالياً</h3>
            <p className="text-slate-500 text-sm mt-1">جارِ تحديث البيانات والتقييمات المالية بانتظام.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGems.map((gem) => (
              <Card
                key={gem.id}
                className="bg-slate-900/80 border-slate-800 hover:border-emerald-500/40 transition-all p-6 relative flex flex-col justify-between group shadow-xl"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-white">{gem.symbol}</span>
                        <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                          {gem.sector || 'EGX'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{gem.name_ar || gem.name_en}</div>
                    </div>

                    {/* Investment Score Badge */}
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">تقييم الاستثمار</div>
                      <div className="text-xl font-black text-emerald-400 font-mono">{gem.investment_score}/100</div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {gem.badges.map((b) => (
                      <Badge
                        key={b.id}
                        className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] px-2 py-0.5"
                      >
                        {b.text_ar}
                      </Badge>
                    ))}
                  </div>

                  {/* Financial Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-950/60 rounded-xl p-3 mb-4 border border-slate-800/80">
                    <div>
                      <div className="text-[11px] text-slate-400">السعر الحالي</div>
                      <div className="text-base font-bold text-white font-mono">{gem.current_price} ج.م</div>
                    </div>

                    <div>
                      <div className="text-[11px] text-slate-400">السعر العادل</div>
                      <div className="text-base font-bold text-yellow-400 font-mono">{gem.fair_value || '—'} ج.م</div>
                    </div>

                    <div>
                      <div className="text-[11px] text-slate-400">هامش الصعود (Upside)</div>
                      <div className="text-sm font-bold text-emerald-400 font-mono">
                        {gem.upside_potential > 0 ? `+${gem.upside_potential}%` : '—'}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] text-slate-400">عائد التوزيعات</div>
                      <div className="text-sm font-bold text-cyan-400 font-mono">
                        {gem.dividend_yield > 0 ? `${gem.dividend_yield}%` : '0%'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">{gem.trade_style_ar}</span>
                  <Link
                    href={`/stock/${gem.symbol}`}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold transition-all"
                  >
                    تحليل السهم <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
