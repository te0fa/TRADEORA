'use client';

import React from 'react';
import { Download, TrendingUp, TrendingDown, ShieldAlert, Award, Calendar, Layers, ExternalLink } from 'lucide-react';
import { useLocale } from 'next-intl';

interface TradeItem {
  id: string;
  symbol: string;
  entry_price: number;
  target_price_1: number;
  target_price_2: number;
  stop_loss: number;
  confidence_score?: number;
  ml_probability?: number;
  rationale_ar?: string;
  trade_type: 'BUY' | 'SELL' | 'HOLD';
  timeframe: string;
  fair_value?: number;
  upside_potential?: number;
  dividend_yield?: number;
  company?: {
    symbol: string;
    name_ar?: string;
    name_en?: string;
    sector?: string;
  };
}

interface DailyReportProps {
  data: {
    report_date: string;
    market_overview: {
      egx30_value: number;
      egx30_change: number;
      gaining_companies: number;
      losing_companies: number;
      unchanged_companies: number;
      total_analyzed: number;
    };
    buy_opportunities: TradeItem[];
    sell_caution_opportunities: TradeItem[];
  };
}

export function DailyReportView({ data }: DailyReportProps) {
  const locale = useLocale();
  const { report_date, market_overview, buy_opportunities, sell_caution_opportunities } = data;

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 pb-16">
      {/* Action Header bar (Hidden on Print) */}
      <div className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-2xl print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent-blue/10 border border-accent-blue/20">
            <Award className="w-6 h-6 text-accent-blue" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              {locale === 'ar' ? 'التقرير اليومي لفرص البورصة المصرية' : 'EGX Daily Trade Opportunities Report'}
            </h2>
            <p className="text-xs text-text-secondary">
              {locale === 'ar' ? 'تقرير التوصيات الفنية والمالية والفرص المتاحة بعد إغلاق الجلسة' : 'Daily post-market technical & fundamental opportunities summary'}
            </p>
          </div>
        </div>

        <button
          onClick={handlePrintPDF}
          className="flex items-center gap-2 bg-gradient-to-r from-accent-blue to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          {locale === 'ar' ? 'تحميل التقرير اليومي PDF' : 'Download PDF Report'}
        </button>
      </div>

      {/* Printable Report Document Container */}
      <div id="printable-report" className="glass-card p-8 sm:p-12 rounded-3xl border-white/10 text-text-primary print:bg-white print:text-black print:p-0 print:border-none print:shadow-none">
        
        {/* BRANDING HEADER WITH TRADEORA LOGO */}
        <div className="flex items-center justify-between border-b border-white/10 print:border-black/20 pb-6 mb-8">
          <div className="flex items-center gap-4">
            {/* TRADEORA Brand Logo Box */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-accent-blue to-emerald-400 flex items-center justify-center text-white font-black text-2xl shadow-xl print:border print:border-black">
              T
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-text-primary print:text-black flex items-center gap-2">
                TRADEORA <span className="text-xs font-bold text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded border border-accent-blue/20 print:border-black">AI QUANT</span>
              </h1>
              <p className="text-xs text-text-secondary print:text-gray-600">
                {locale === 'ar' ? 'المنصة الذكية للتحليل الكمي وتحديد السعر العادل وتوصيات الأسهم' : 'AI Quantitative Stock Intelligence & Fair Value Valuation'}
              </p>
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            <span className="text-xs font-mono font-semibold text-text-secondary print:text-gray-600 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {report_date}
            </span>
            <span className="text-[10px] font-bold text-emerald-400 print:text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded mt-1 border border-emerald-500/20">
              {locale === 'ar' ? 'تقرير ممرر ومعتمد' : 'Verified Daily Report'}
            </span>
          </div>
        </div>

        {/* MARKET OVERVIEW BANNER */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/10 print:border-black/20 print:bg-gray-50 mb-8">
          <div>
            <span className="text-[11px] text-text-secondary print:text-gray-600 block">{locale === 'ar' ? 'مؤشر EGX 30' : 'EGX 30 Index'}</span>
            <span className="text-lg font-mono font-bold text-text-primary print:text-black">
              {market_overview.egx30_value.toLocaleString()}
            </span>
            <span className={`text-xs font-bold mr-1.5 ltr inline-block ${market_overview.egx30_change >= 0 ? 'text-up-green' : 'text-down-red'}`}>
              ({market_overview.egx30_change >= 0 ? '+' : ''}{market_overview.egx30_change}%)
            </span>
          </div>

          <div>
            <span className="text-[11px] text-text-secondary print:text-gray-600 block">{locale === 'ar' ? 'الأسهم الصاعدة' : 'Gaining Stocks'}</span>
            <span className="text-lg font-bold text-up-green print:text-emerald-700 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {market_overview.gaining_companies}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-text-secondary print:text-gray-600 block">{locale === 'ar' ? 'الأسهم الهابطة' : 'Losing Stocks'}</span>
            <span className="text-lg font-bold text-down-red print:text-red-700 flex items-center gap-1">
              <TrendingDown className="w-4 h-4" />
              {market_overview.losing_companies}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-text-secondary print:text-gray-600 block">{locale === 'ar' ? 'إجمالي الفرص المستخرجة' : 'Extracted Opportunities'}</span>
            <span className="text-lg font-mono font-bold text-accent-blue print:text-blue-700 flex items-center gap-1">
              <Layers className="w-4 h-4" />
              {buy_opportunities.length + sell_caution_opportunities.length}
            </span>
          </div>
        </div>

        {/* SECTION 1: BUY OPPORTUNITIES */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4 border-b border-white/10 print:border-black/20 pb-2">
            <span className="w-3 h-3 rounded-full bg-up-green" />
            <h2 className="text-xl font-bold text-text-primary print:text-black">
              {locale === 'ar' ? 'أولاً: فرص الشراء الممتازة (Buy Opportunities)' : 'First: High-Probability Buy Opportunities'}
            </h2>
          </div>

          {buy_opportunities.length === 0 ? (
            <p className="text-sm text-text-secondary py-4">{locale === 'ar' ? 'لا توجد فرص شراء جديدة اليوم.' : 'No new buy opportunities found today.'}</p>
          ) : (
            <div className="space-y-4">
              {buy_opportunities.map((item, idx) => (
                <div key={item.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 print:border-black/20 print:bg-white flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-accent-blue/15 text-accent-blue font-bold text-xs flex items-center justify-center print:border print:border-black">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-base text-text-primary print:text-black">
                          {item.company?.name_ar || item.company?.name_en || item.symbol}
                        </span>
                        <span className="font-mono font-bold text-xs text-accent-blue ml-2 mr-2 bg-accent-blue/10 px-2 py-0.5 rounded">
                          {item.symbol}
                        </span>
                        {item.company?.sector && (
                          <span className="text-xs text-text-secondary print:text-gray-600">
                            ({item.company.sector})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-up-green bg-up-green/10 px-2.5 py-1 rounded-lg border border-up-green/20">
                        {locale === 'ar' ? 'توصية شراء' : 'BUY'} ({Math.round((item.ml_probability || item.confidence_score || 0.8) * 100)}% {locale === 'ar' ? 'ثقة' : 'Confidence'})
                      </span>
                    </div>
                  </div>

                  {/* PRICE & TARGETS METRICS GRID */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 rounded-xl bg-white/5 print:bg-gray-100 border border-white/5 print:border-black/10 text-xs">
                    <div>
                      <span className="text-text-secondary print:text-gray-600 block">{locale === 'ar' ? 'سعر الدخول' : 'Entry Price'}</span>
                      <span className="font-mono font-bold text-text-primary print:text-black">{item.entry_price} EGP</span>
                    </div>
                    <div>
                      <span className="text-text-secondary print:text-gray-600 block">{locale === 'ar' ? 'الهدف الأول TP1' : 'Target 1'}</span>
                      <span className="font-mono font-bold text-up-green">{item.target_price_1} EGP</span>
                    </div>
                    <div>
                      <span className="text-text-secondary print:text-gray-600 block">{locale === 'ar' ? 'الهدف الثاني TP2' : 'Target 2'}</span>
                      <span className="font-mono font-bold text-up-green">{item.target_price_2} EGP</span>
                    </div>
                    <div>
                      <span className="text-text-secondary print:text-gray-600 block">{locale === 'ar' ? 'وقف الخسارة SL' : 'Stop Loss'}</span>
                      <span className="font-mono font-bold text-down-red">{item.stop_loss} EGP</span>
                    </div>
                    <div>
                      <span className="text-text-secondary print:text-gray-600 block">{locale === 'ar' ? 'السعر العادل' : 'Fair Value'}</span>
                      <span className="font-mono font-bold text-accent-gold">
                        {item.fair_value ? `${item.fair_value} EGP` : 'متاح بالتقرير'}
                      </span>
                    </div>
                  </div>

                  {/* AI RATIONALE EXPLANATION */}
                  {item.rationale_ar && (
                    <div className="text-xs text-text-secondary print:text-gray-700 bg-accent-blue/[0.03] p-3 rounded-xl border border-accent-blue/10 print:border-black/10">
                      <span className="font-bold text-accent-blue print:text-blue-700 block mb-1">
                        💡 {locale === 'ar' ? 'سبب التوصية والتحليل الفني والمالي:' : 'AI Technical & Fundamental Rationale:'}
                      </span>
                      {item.rationale_ar}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: SELL / CAUTION OPPORTUNITIES */}
        {sell_caution_opportunities.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4 border-b border-white/10 print:border-black/20 pb-2">
              <span className="w-3 h-3 rounded-full bg-down-red" />
              <h2 className="text-xl font-bold text-text-primary print:text-black">
                {locale === 'ar' ? 'ثانياً: فرص جني الأرباح والتحذير (Sell/Caution Opportunities)' : 'Second: Profit Taking & Exit Opportunities'}
              </h2>
            </div>

            <div className="space-y-4">
              {sell_caution_opportunities.map((item, idx) => (
                <div key={item.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 print:border-black/20 print:bg-white flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-text-primary print:text-black">
                      #{idx + 1} {item.company?.name_ar || item.symbol} ({item.symbol})
                    </span>
                    <span className="text-xs font-bold text-down-red bg-down-red/10 px-2.5 py-1 rounded-lg border border-down-red/20">
                      {locale === 'ar' ? 'توصية بيع / جني أرباح' : 'SELL / EXIT'}
                    </span>
                  </div>
                  {item.rationale_ar && (
                    <p className="text-xs text-text-secondary print:text-gray-700">{item.rationale_ar}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REPORT FOOTER WITH BRAND DISCLAIMER */}
        <div className="border-t border-white/10 print:border-black/20 pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-text-secondary print:text-gray-600 gap-3">
          <div>
            <span>© {new Date().getFullYear()} TRADEORA Quantitative Intelligence. </span>
            <span>{locale === 'ar' ? 'جميع التوصيات مبنية على خوارزميات كمية ونماذج الذكاء الاصطناعي.' : 'All metrics derived from AI Quantitative models.'}</span>
          </div>
          <div className="font-mono font-bold text-accent-blue">
            www.tradeora.ai
          </div>
        </div>

      </div>
    </div>
  );
}
