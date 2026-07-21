'use client';

import React from 'react';
import { X, TrendingUp, TrendingDown, ShieldAlert, Target, Award, Clock } from 'lucide-react';
import { useLocale } from 'next-intl';

interface ActiveTrade {
  id: string;
  symbol: string;
  company_name?: string;
  trade_type: 'BUY' | 'SELL';
  entry_price: number;
  current_price: number;
  target_price_1: number;
  target_price_2: number;
  stop_loss: number;
  ml_probability?: number;
  timeframe: string;
  rationale_ar?: string;
}

interface ActiveTradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: ActiveTrade[];
}

export function ActiveTradesModal({ isOpen, onClose, trades }: ActiveTradesModalProps) {
  const locale = useLocale();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="glass-card w-full max-w-4xl max-h-[85vh] rounded-3xl p-6 sm:p-8 flex flex-col gap-6 overflow-hidden border-white/10 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-accent-blue/10 border border-accent-blue/20">
              <Target className="w-6 h-6 text-accent-blue" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                {locale === 'ar' ? 'الصفقات الحالية المفتوحة في المنصة' : 'Active Live Platform Signals'}
              </h2>
              <p className="text-xs text-text-secondary">
                {locale === 'ar' ? 'متابعة أهداف الصفقات وسعر الدخول ونسبة الاقتراب من الهدف المخطط' : 'Real-time tracking of entry price, targets, and progress'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-text-secondary hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Active Trades List */}
        <div className="overflow-y-auto space-y-4 pr-1">
          {trades.length === 0 ? (
            <div className="py-12 text-center text-text-secondary">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>{locale === 'ar' ? 'لا توجد صفقات مفتوحة حالياً.' : 'No active trades currently.'}</p>
            </div>
          ) : (
            trades.map((t) => {
              const isBuy = t.trade_type === 'BUY';
              const current = t.current_price || t.entry_price;
              const tp1 = t.target_price_1;
              const sl = t.stop_loss;

              // Calculate Target 1 Progress %
              let progressPct = 0;
              if (isBuy) {
                const totalDist = tp1 - t.entry_price;
                const currentDist = current - t.entry_price;
                progressPct = totalDist > 0 ? Math.min(Math.max((currentDist / totalDist) * 100, 0), 100) : 0;
              } else {
                const totalDist = t.entry_price - tp1;
                const currentDist = t.entry_price - current;
                progressPct = totalDist > 0 ? Math.min(Math.max((currentDist / totalDist) * 100, 0), 100) : 0;
              }

              return (
                <div
                  key={t.id || t.symbol}
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all flex flex-col gap-3"
                >
                  {/* Top Symbol & Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-base text-accent-blue bg-accent-blue/10 border border-accent-blue/20 px-3 py-1 rounded-xl">
                        {t.symbol}
                      </span>
                      {t.company_name && (
                        <span className="font-bold text-sm text-text-primary">{t.company_name}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                          isBuy
                            ? 'bg-up-green/10 text-up-green border border-up-green/20'
                            : 'bg-down-red/10 text-down-red border border-down-red/20'
                        }`}
                      >
                        {isBuy ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {isBuy ? (locale === 'ar' ? 'شراء' : 'BUY') : (locale === 'ar' ? 'بيع' : 'SELL')}
                      </span>
                      {t.ml_probability && (
                        <span className="text-xs font-mono font-bold text-accent-gold bg-accent-gold/10 px-2.5 py-1 rounded-xl border border-accent-gold/20">
                          {Math.round(t.ml_probability * 100)}% {locale === 'ar' ? 'ثقة' : 'Confidence'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                    <div>
                      <span className="text-text-secondary block">{locale === 'ar' ? 'سعر الدخول' : 'Entry Price'}</span>
                      <span className="font-mono font-bold text-text-primary">{t.entry_price} EGP</span>
                    </div>
                    <div>
                      <span className="text-text-secondary block">{locale === 'ar' ? 'السعر الحالي' : 'Current Price'}</span>
                      <span className="font-mono font-bold text-accent-blue">{current} EGP</span>
                    </div>
                    <div>
                      <span className="text-text-secondary block">{locale === 'ar' ? 'الهدف الأول TP1' : 'Target 1'}</span>
                      <span className="font-mono font-bold text-up-green">{tp1} EGP</span>
                    </div>
                    <div>
                      <span className="text-text-secondary block">{locale === 'ar' ? 'الهدف الثاني TP2' : 'Target 2'}</span>
                      <span className="font-mono font-bold text-up-green">{t.target_price_2} EGP</span>
                    </div>
                    <div>
                      <span className="text-text-secondary block">{locale === 'ar' ? 'وقف الخسارة SL' : 'Stop Loss'}</span>
                      <span className="font-mono font-bold text-down-red">{sl} EGP</span>
                    </div>
                  </div>

                  {/* Target Proximity Progress Bar */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-text-secondary">
                        {locale === 'ar' ? 'الاقتراب من الهدف الأول TP1:' : 'Proximity to TP1:'}
                      </span>
                      <span className="font-mono font-bold text-up-green">{progressPct.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-accent-blue to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Rationale if present */}
                  {t.rationale_ar && (
                    <p className="text-xs text-text-secondary bg-white/5 p-2.5 rounded-xl border border-white/5">
                      💡 {t.rationale_ar}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
