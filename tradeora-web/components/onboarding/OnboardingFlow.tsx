'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { usePushNotifications } from '@/lib/usePushNotifications';
import { Bell, ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';

interface Props {
  onComplete: () => void;
  locale: string;
}

export function OnboardingFlow({ onComplete, locale }: Props) {
  const isAr = locale === 'ar';
  const push = usePushNotifications();

  const [step, setStep] = useState(1);
  
  // Data State
  const [fullName, setFullName] = useState('');
  const [capital, setCapital] = useState(10000);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Sector options
  const sectorsList = [
    { id: 'banks', ar: '🏦 البنوك', en: '🏦 Banks' },
    { id: 'construction', ar: '🏗️ التشييد', en: '🏗️ Construction' },
    { id: 'energy', ar: '⚡ الطاقة', en: '⚡ Energy' },
    { id: 'retail', ar: '🛒 التجزئة', en: '🛒 Retail' },
    { id: 'telecom', ar: '📡 الاتصالات', en: '📡 Telecom' },
    { id: 'healthcare', ar: '🏥 الصحة', en: '🏥 Healthcare' },
    { id: 'food', ar: '🌾 الغذاء', en: '🌾 Food' },
    { id: 'industrial', ar: '🏭 الصناعة', en: '🏭 Industrial' },
  ];

  const handleToggleSector = (id: string) => {
    if (selectedSectors.includes(id)) {
      setSelectedSectors(prev => prev.filter(x => x !== id));
    } else {
      setSelectedSectors(prev => [...prev, id]);
    }
  };

  const handleNext = async () => {
    if (step < 4) {
      setStep(prev => prev + 1);
    } else {
      // Step 4: Final save to Supabase
      setSaving(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Upsert data to user_profiles
          await supabase.from('user_profiles').upsert([{
            id: user.id,
            full_name: fullName,
            default_capital: capital,
            preferred_sectors: selectedSectors,
          }]);

          // Also save in localStorage for client consistency
          localStorage.setItem('user_capital', String(capital));
        }
      } catch (err) {
        console.error('Error saving onboarding data:', err);
      } finally {
        setSaving(false);
        onComplete();
      }
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep(prev => prev - 1);
  };

  const t = (ar: string, en: string) => (isAr ? ar : en);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#0D1B2A]/90 backdrop-blur-md font-sans">
      <div className="bg-[#111E2E] border border-[#C9A84C]/25 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative flex flex-col justify-between min-h-[420px] text-center">
        
        {/* Progress Bar */}
        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-6 flex">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`h-full flex-1 transition-all duration-300 border-r border-slate-900/10 ${
                s <= step
                  ? 'bg-gradient-to-r from-[#C9A84C] to-[#A07830]'
                  : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* ── STEP 1: Welcome ── */}
        {step === 1 && (
          <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
            <Image
              src="/logo.png"
              alt="TRADEORA"
              width={160}
              height={55}
              className="object-contain mb-4 filter drop-shadow-[0_0_15px_rgba(201,168,76,0.15)]"
              priority
            />
            <h3 className="text-lg font-black text-white mb-1.5">
              {t('مرحباً بك في TRADEORA 🎉', 'Welcome to TRADEORA 🎉')}
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              {t('منصة التحليل الفني الأذكى لأسهم البورصة المصرية (EGX).', 'The smartest technical analysis platform for Egypt stock market.')}
            </p>
            
            <div className="w-full text-start">
              <label className="text-[10px] text-slate-400 block mb-1">
                {t('ما اسمك؟', 'What is your name?')}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder={t('اسمك الكريم', 'Your name')}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs focus:border-[#C9A84C] outline-none"
              />
            </div>
          </div>
        )}

        {/* ── STEP 2: Sizing Capital ── */}
        {step === 2 && (
          <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
            <h3 className="text-sm font-bold text-white mb-2">
              {t('كم رأس مالك المتاح للتداول؟', 'What is your available trading capital?')}
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              {t('يُستخدم لحساب أحجام صفقات المحفظة المقترحة تلقائياً في الشارت.', 'Used to calculate suggest shares in your stock risk helper.')}
            </p>

            {/* Quick selectors */}
            <div className="grid grid-cols-2 gap-2 w-full mb-4">
              {[
                { label: '< 10,000 EGP', val: 10000 },
                { label: '10k - 50,000 EGP', val: 30000 },
                { label: '50k - 100k EGP', val: 75000 },
                { label: '+100,000 EGP', val: 150000 },
              ].map(opt => (
                <button
                  type="button"
                  key={opt.val}
                  onClick={() => setCapital(opt.val)}
                  className={`py-2 rounded-xl text-[10px] font-bold border transition cursor-pointer ${
                    capital === opt.val
                      ? 'bg-[#C9A84C]/20 border-[#C9A84C]/50 text-yellow-400'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="w-full text-start">
              <label className="text-[10px] text-slate-400 block mb-1">
                {t('أو أدخل رقماً مخصصاً (EGP)', 'Or enter custom amount (EGP)')}
              </label>
              <input
                type="number"
                value={capital}
                onChange={e => setCapital(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs focus:border-[#C9A84C] outline-none text-center font-mono"
              />
            </div>
          </div>
        )}

        {/* ── STEP 3: Sectors Preferences ── */}
        {step === 3 && (
          <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
            <h3 className="text-sm font-bold text-white mb-2">
              {t('اختار القطاعات التي تهتم بها:', 'Select sectors you are interested in:')}
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              {t('يمكنك اختيار أكثر من قطاع لتخصيص فرز الأسهم وتوصيات الـ AI.', 'You can select multiple to customize AI recommendations.')}
            </p>

            <div className="grid grid-cols-2 gap-2 w-full max-h-48 overflow-y-auto pr-1">
              {sectorsList.map(sec => {
                const isSelected = selectedSectors.includes(sec.id);
                return (
                  <button
                    type="button"
                    key={sec.id}
                    onClick={() => handleToggleSector(sec.id)}
                    className={`py-2 px-3 rounded-xl text-[10px] font-bold border transition cursor-pointer text-start flex justify-between items-center ${
                      isSelected
                        ? 'bg-[#C9A84C]/20 border-[#C9A84C]/50 text-yellow-400'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <span>{t(sec.ar, sec.en)}</span>
                    {isSelected && <Check className="w-3 h-3 text-[#C9A84C]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 4: Push Alerts / Final ── */}
        {step === 4 && (
          <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
            <div className="w-12 h-12 bg-white/5 border border-[#C9A84C]/25 rounded-full flex items-center justify-center mb-3 animate-bounce">
              <Bell className="w-6 h-6 text-yellow-400" />
            </div>
            
            <h3 className="text-sm font-bold text-white mb-1.5">
              {t('تفعيل الإشعارات لمتابعة صفقاتك؟', 'Enable push alerts to monitor trades?')}
            </h3>
            <p className="text-xs text-slate-400 mb-6 max-w-xs mx-auto leading-relaxed">
              {t('ستصلك تنبيهات كسر وقف الخسارة وتحقيق الأهداف الفورية مباشرة على هاتفك أو حاسوبك.', 'Receive real-time alerts on target hit or stop loss levels.')}
            </p>

            <div className="flex gap-3 w-full mb-4">
              <button
                type="button"
                onClick={() => {
                  push.subscribe();
                  handleNext();
                }}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-blue-600/10 flex items-center justify-center gap-1"
              >
                <span>🔔</span>
                <span>{t('تفعيل الآن', 'Enable Now')}</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-bold transition-all cursor-pointer"
              >
                {t('لاحقاً', 'Later')}
              </button>
            </div>

            <span className="text-[10px] text-slate-500 font-mono">
              {t('ستصلك تنبيهات TP1/SL مباشرة', 'Instant TP1/SL web alerts')}
            </span>
          </div>
        )}

        {/* Navigation Action Footer */}
        <div className="flex justify-between items-center gap-4 mt-6 pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 1 || saving}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('رجوع', 'Back')}</span>
          </button>
          
          <button
            type="button"
            onClick={handleNext}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-xs font-bold btn-gold flex items-center gap-1.5 cursor-pointer"
          >
            <span>{step === 4 ? t('🚀 ابدأ الآن', '🚀 Finish') : t('التالي', 'Next')}</span>
            {step < 4 && <ArrowRight className="w-3.5 h-3.5 text-slate-900" />}
          </button>
        </div>

      </div>
    </div>
  );
}
