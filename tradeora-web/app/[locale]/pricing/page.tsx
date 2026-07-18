'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUserRole } from '@/lib/useUserRole';
import { Check, X, Shield, Zap, Sparkles, Star, Loader2 } from 'lucide-react';

interface Props {
  params: Promise<{
    locale: string;
  }>;
}

export default function PricingPage({ params }: Props) {
  const { locale } = React.use(params);
  const router = useRouter();
  const isAr = locale === 'ar';
  const { role, isPremium, loading: roleLoading } = useUserRole();

  const [loading, setLoading] = useState(false);

  const t = (ar: string, en: string) => (isAr ? ar : en);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Redirect to Auth if not logged in
        router.push(`/${locale}/auth`);
        return;
      }

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, email: user.email }),
      });
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(t('حدث خطأ أثناء الاتصال ببوابة الدفع.', 'Failed to establish payment session.'));
      }
    } catch (err) {
      console.error(err);
      alert(t('حدث خطأ غير متوقع.', 'Unexpected error occurred.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-10 sm:py-16 max-w-4xl mx-auto font-sans">
      
      {/* Title */}
      <div className="text-center mb-12 max-w-xl">
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">
          {t('خطط الاشتراك في TRADEORA', 'TRADEORA Pricing Plans')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          {t(
            'اختر الخطة المناسبة لحجم تداولاتك واحصل على تحليلات دقيقة معززة بالذكاء الاصطناعي.',
            'Choose the right plan to level up your technical analysis with our AI engine.'
          )}
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full px-4 sm:px-6">
        
        {/* Free Plan */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/5 bg-[#111E2E]/40 flex flex-col justify-between min-h-[460px] relative">
          <div>
            <h3 className="text-lg font-black text-white mb-1">
              {t('الخطة المجانية', 'Free Plan')}
            </h3>
            <p className="text-[11px] text-slate-400 mb-6">
              {t('أساسيات البورصة للمتداول المبتدئ.', 'Essential tools for beginner traders.')}
            </p>

            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-3xl font-black text-white font-mono">0</span>
              <span className="text-xs font-bold text-slate-400">
                {t('ج.م / شهرياً', 'EGP / month')}
              </span>
            </div>

            <ul className="space-y-4 text-xs font-semibold text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t('تحليل ومتابعة 5 أسهم فقط', 'Track up to 5 stocks')}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t('تحليل أساسي ومؤشرات TA بسيطة', 'Basic fundamental analysis')}</span>
              </li>
              <li className="flex items-center gap-2 text-slate-500">
                <X className="w-4 h-4 text-rose-500/50 shrink-0" />
                <span className="line-through">{t('مقياس الزخم الذكي AI Score', 'AI Scored Momentum')}</span>
              </li>
              <li className="flex items-center gap-2 text-slate-500">
                <X className="w-4 h-4 text-rose-500/50 shrink-0" />
                <span className="line-through">{t('تنبيهات فورية ومباشرة (TP/SL)', 'Instant Alerts (TP/SL)')}</span>
              </li>
              <li className="flex items-center gap-2 text-slate-500">
                <X className="w-4 h-4 text-rose-500/50 shrink-0" />
                <span className="line-through">{t('الفرز الذكي وتصفية القطاعات بالكامل', 'Advanced Stock Screener')}</span>
              </li>
              <li className="flex items-center gap-2 text-slate-500">
                <X className="w-4 h-4 text-rose-500/50 shrink-0" />
                <span className="line-through">{t('تصدير الصفقات بصيغة PDF', 'PDF Trade Reports')}</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/${locale}/screener`)}
            className="w-full mt-8 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all border border-white/10 cursor-pointer text-center"
          >
            {t('بدء الاستخدام المجاني', 'Start Free')}
          </button>
        </div>

        {/* Premium Plan */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-[#C9A84C]/40 bg-[#162030] flex flex-col justify-between min-h-[460px] relative shadow-2xl shadow-[#C9A84C]/5 overflow-hidden">
          
          {/* Badge */}
          <div className="absolute top-0 right-0 bg-gradient-to-l from-[#C9A84C] to-[#A07830] text-[#0D1B2A] text-[9px] font-extrabold px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider flex items-center gap-1">
            <Star className="w-2.5 h-2.5 fill-current" />
            <span>{t('موصى به', 'RECOMMENDED')}</span>
          </div>

          <div>
            <h3 className="text-lg font-black text-yellow-400 mb-1 flex items-center gap-1.5">
              <span>⭐ Premium</span>
            </h3>
            <p className="text-[11px] text-slate-400 mb-6">
              {t('التحليل الأذكى والأقوى للمحترفين.', 'Uncompromised features for professional traders.')}
            </p>

            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-3xl font-black text-white font-mono">99</span>
              <span className="text-xs font-bold text-slate-400">
                {t('ج.م / شهرياً', 'EGP / month')}
              </span>
            </div>

            <ul className="space-y-4 text-xs font-semibold text-slate-200">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#C9A84C] shrink-0" />
                <span>{t('تغطية وتحليل كافة الأسهم (314 سهم)', 'Analyze all 314 EGX stocks')}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#C9A84C] shrink-0" />
                <span>{t('مقياس الاتجاه واختبار الذكاء الاصطناعي AI + Backtest', 'AI Trend Score & Backtest')}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#C9A84C] shrink-0" />
                <span>{t('تنبيهات فورية (إيميل، تيليجرام، وبش)', 'Instant alerts (Email, TG, Push)')}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#C9A84C] shrink-0" />
                <span>{t('الفرز الذكي وتصفية القطاعات بالكامل', 'Advanced Stock Screener')}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#C9A84C] shrink-0" />
                <span>{t('تصدير تقرير الصفقات بصيغة PDF', 'PDF Trade Reports')}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#C9A84C] shrink-0" />
                <span>{t('دعم فني ذو أولوية 24/7', '24/7 Priority Support')}</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            disabled={loading || roleLoading}
            onClick={handleSubscribe}
            className="w-full mt-8 py-3.5 rounded-2xl btn-gold text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#C9A84C]/10 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#0D1B2A]" />
            ) : isPremium ? (
              t('الخطة مفعلة بالفعل 🎉', 'Premium Active 🎉')
            ) : (
              t('🚀 اشترك الآن', '🚀 Upgrade Now')
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
