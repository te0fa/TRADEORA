'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Settings, Shield, User, Bell, Percent, CreditCard, Check } from 'lucide-react';

interface SettingsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = React.use(params);
  const router = useRouter();
  const isAr = locale === 'ar';

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // User Local Sizing Preferences
  const [capital, setCapital] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(2);

  // Notification states
  const [notifyWeb, setNotifyWeb] = useState<boolean>(true);
  const [notifyEmail, setNotifyEmail] = useState<boolean>(false);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace(`/${locale}/auth`);
        return;
      }
      setUser(user);

      // Fetch user profile role
      supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setProfile(data);
          else {
            // Default profile if not found
            setProfile({ full_name: user.email?.split('@')[0], role: 'user' });
          }
          setLoading(false);
        });
    });

    // Load LocalStorage states
    try {
      const savedCap = localStorage.getItem('user_capital');
      const savedRisk = localStorage.getItem('user_risk_percent');
      const savedNotifyWeb = localStorage.getItem('notify_web');
      const savedNotifyEmail = localStorage.getItem('notify_email');

      if (savedCap) setCapital(Number(savedCap));
      if (savedRisk) setRiskPercent(Number(savedRisk));
      if (savedNotifyWeb) setNotifyWeb(savedNotifyWeb === 'true');
      if (savedNotifyEmail) setNotifyEmail(savedNotifyEmail === 'true');
    } catch (e) {
      console.error('Error loading config from localStorage:', e);
    }
  }, [router, locale]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      localStorage.setItem('user_capital', String(capital));
      localStorage.setItem('user_risk_percent', String(riskPercent));
      localStorage.setItem('notify_web', String(notifyWeb));
      localStorage.setItem('notify_email', String(notifyEmail));

      setTimeout(() => {
        setSaving(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }, 500);
    } catch (err) {
      console.error('Error saving configurations:', err);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin"></div>
        <span className="text-xs text-slate-400">{isAr ? 'جاري تحميل الإعدادات...' : 'Loading settings...'}</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto font-sans text-text-primary">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white mb-1 flex items-center gap-2">
          <Settings className="w-6 h-6 text-accent-blue" />
          <span>{isAr ? '⚙️ الإعدادات الشخصية للمنصة' : 'Account Settings'}</span>
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          {isAr 
            ? 'تخصيص معايير محفظتك وإدارة المخاطر وتعديل تنبيهات تصفية الأهداف.'
            : 'Configure your default portfolio preferences, notifications and profile details.'}
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Sizing & Preferences */}
        <div className="md:col-span-2 space-y-6">
          {/* Sizing Card */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Percent className="w-4 h-4 text-accent-blue" />
              <span>{isAr ? 'حاسبة إدارة المخاطر الافتراضية' : 'Default Position Sizing'}</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  {isAr ? 'رأس المال الافتراضي للمحفظة (EGP)' : 'Default Available Capital (EGP)'}
                </label>
                <input
                  type="number"
                  value={capital}
                  onChange={e => setCapital(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs focus:border-accent-blue outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  {isAr ? 'نسبة المخاطرة لكل صفقة (%)' : 'Risk Percentage Per Trade (%)'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={riskPercent}
                  onChange={e => setRiskPercent(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs focus:border-accent-blue outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1.5 leading-normal">
                  {isAr 
                    ? '⚠️ ننصح بتثبيت نسبة المخاطرة عند 2% بحد أقصى لحماية محفظتك من تقلبات السوق المفاجئة.' 
                    : '⚠️ We recommend keeping risk at 2% or less per trade to safeguard capital.'}
                </p>
              </div>
            </div>
          </div>

          {/* Notifications Card */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-accent-blue" />
              <span>{isAr ? 'تنبيهات ضرب الأهداف والوقف' : 'Notification Preferences'}</span>
            </h2>

            <div className="space-y-3.5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyWeb}
                  onChange={e => setNotifyWeb(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-accent-blue focus:ring-accent-blue"
                />
                <div>
                  <span className="text-xs text-white block">{isAr ? 'إشعارات المتصفح الفورية (Push)' : 'Browser Push Notifications'}</span>
                  <span className="text-[10px] text-slate-400">{isAr ? 'تنبيه فوري على الشاشة عند ضرب الهدف الأول أو الثاني.' : 'Real-time pop-up notification when trade targets are hit.'}</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={e => setNotifyEmail(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-accent-blue focus:ring-accent-blue"
                />
                <div>
                  <span className="text-xs text-white block">{isAr ? 'تنبيهات البريد الإلكتروني' : 'Email Alerts'}</span>
                  <span className="text-[10px] text-slate-400">{isAr ? 'إرسال تقرير أسبوعي بملخص أرباح وخسائر محفظتك الشخصية.' : 'Receive a weekly email summarizing your personal portfolio performance.'}</span>
                </div>
              </label>
            </div>
          </div>

          {/* Save Action */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-accent-blue hover:bg-accent-blue/80 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              {saving ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-green-300 animate-bounce" />
                  <span>{isAr ? 'تم حفظ التغييرات!' : 'Changes Saved!'}</span>
                </>
              ) : (
                <span>{isAr ? 'حفظ إعدادات محفظتي' : 'Save Preferences'}</span>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: User Profile details */}
        <div className="space-y-6">
          {/* Profile Details Card */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-accent-blue" />
              <span>{isAr ? 'بيانات الحساب الشخصي' : 'Profile Details'}</span>
            </h2>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-slate-400">{isAr ? 'البريد الإلكتروني:' : 'Email Address:'}</span>
                <span className="text-white font-mono font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-slate-400">{isAr ? 'نوع الحساب:' : 'Account Role:'}</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold capitalize text-[10px]">
                  {profile?.role === 'admin' ? (isAr ? 'مشرف المنصة' : 'Admin') : profile?.role === 'premium' ? (isAr ? 'عميل مميز' : 'Premium') : (isAr ? 'مستخدم عادي' : 'Standard')}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-slate-400">{isAr ? 'اسم المستخدم:' : 'Name:'}</span>
                <span className="text-white">{profile?.full_name || user?.email?.split('@')[0]}</span>
              </div>
            </div>
          </div>

          {/* Premium Subscription Status Card */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-emerald-500/5 to-transparent relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl"></div>
            <h2 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'حالة اشتراك TRADEORA' : 'Subscription Status'}</span>
            </h2>

            {profile?.role === 'premium' || profile?.role === 'admin' ? (
              <div className="space-y-2">
                <p className="text-xs text-white leading-normal">
                  {isAr 
                    ? '🎉 حسابك مفعل بالباقة المميزة (Premium) وتتمتع بوصول كامل لإشارات الذكاء الاصطناعي والمؤشرات المتقدمة.'
                    : '🎉 Your account is active under the Premium plan with full access to indicators & ML recommendations.'}
                </p>
                {profile.subscription_end && (
                  <p className="text-[10px] text-slate-400 font-mono">
                    {isAr ? 'ينتهي في: ' : 'Expires: '}{new Date(profile.subscription_end).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-300 leading-normal">
                  {isAr 
                    ? 'أنت تستخدم الباقة المجانية. اشترك في الباقة المميزة لمتابعة التحليلات المتقدمة الفورية وفلاتر التداول.'
                    : 'You are currently using the Free plan. Upgrade to access premium features and ML filters.'}
                </p>
                <button
                  type="button"
                  onClick={() => alert(isAr ? 'سيتم تحويلك لبوابة الدفع قريباً 💳' : 'Redirecting to payment gateway...')}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {isAr ? '⚡ ترقية الحساب للمميز' : '⚡ Upgrade to Premium'}
                </button>
              </div>
            )}
          </div>
        </div>

      </form>
    </div>
  );
}
