'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Settings, Shield, User, Bell, Percent, CreditCard, Check, Send } from 'lucide-react';

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

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [capital, setCapital] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(2);

  // Notification states
  const [notifyTP1, setNotifyTP1] = useState(true);
  const [notifyTP2, setNotifyTP2] = useState(true);
  const [notifySL, setNotifySL] = useState(true);
  const [notifyPriceAlerts, setNotifyPriceAlerts] = useState(true);

  // Telegram Info
  const [telegramInfo, setTelegramInfo] = useState<any>(null);
  const [showTelegramLink, setShowTelegramLink] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace(`/${locale}/auth`);
        return;
      }
      setUser(user);

      // Fetch user profile role and telegram info in parallel
      Promise.all([
        supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('user_telegram')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
      ]).then(([profileRes, telegramRes]) => {
        if (profileRes.data) {
          setProfile(profileRes.data);
          setFullName(profileRes.data.full_name || '');
        } else {
          setProfile({ full_name: user.email?.split('@')[0], role: 'user' });
          setFullName(user.email?.split('@')[0] || '');
        }

        if (telegramRes.data) {
          setTelegramInfo(telegramRes.data);
        }

        setLoading(false);
      });
    });

    // Load LocalStorage states
    try {
      const savedCap = localStorage.getItem('user_capital');
      const savedRisk = localStorage.getItem('user_risk_percent');
      
      const savedNotifyTP1 = localStorage.getItem('notify_tp1');
      const savedNotifyTP2 = localStorage.getItem('notify_tp2');
      const savedNotifySL = localStorage.getItem('notify_sl');
      const savedNotifyPriceAlerts = localStorage.getItem('notify_price_alerts');

      if (savedCap) setCapital(Number(savedCap));
      if (savedRisk) setRiskPercent(Number(savedRisk));
      
      if (savedNotifyTP1) setNotifyTP1(savedNotifyTP1 === 'true');
      if (savedNotifyTP2) setNotifyTP2(savedNotifyTP2 === 'true');
      if (savedNotifySL) setNotifySL(savedNotifySL === 'true');
      if (savedNotifyPriceAlerts) setNotifyPriceAlerts(savedNotifyPriceAlerts === 'true');
    } catch (e) {
      console.error('Error loading config from localStorage:', e);
    }
  }, [router, locale]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      // 1. Save profile name to database
      if (user) {
        await supabase
          .from('user_profiles')
          .update({ full_name: fullName })
          .eq('id', user.id);
      }

      // 2. Save sizing and notifications to LocalStorage
      localStorage.setItem('user_capital', String(capital));
      localStorage.setItem('user_risk_percent', String(riskPercent));
      localStorage.setItem('notify_tp1', String(notifyTP1));
      localStorage.setItem('notify_tp2', String(notifyTP2));
      localStorage.setItem('notify_sl', String(notifySL));
      localStorage.setItem('notify_price_alerts', String(notifyPriceAlerts));

      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
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
          <span>{isAr ? '⚙️ إعدادات الحساب وإدارة المخاطر' : 'Account Settings'}</span>
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          {isAr 
            ? 'تخصيص معايير محفظتك وإدارة المخاطر وتعديل تنبيهات تيليجرام.'
            : 'Configure your default portfolio preferences, telegram bot linking and notifications.'}
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Sizing & Preferences */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Profile Name card */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-accent-blue" />
              <span>{isAr ? 'تحديث الملف الشخصي' : 'Update Profile'}</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  {isAr ? 'الاسم بالكامل' : 'Full Name'}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs focus:border-accent-blue outline-none"
                />
              </div>
            </div>
          </div>

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
              <span>{isAr ? 'تنبيهات صفقات المحفظة والأسعار' : 'Signal & Price Alerts'}</span>
            </h2>

            <div className="space-y-3.5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyTP1}
                  onChange={e => setNotifyTP1(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-accent-blue focus:ring-accent-blue"
                />
                <div>
                  <span className="text-xs text-white block">{isAr ? 'تنبيهات الهدف الأول (TP1)' : 'Notify Target 1 (TP1) hit'}</span>
                  <span className="text-[10px] text-slate-400">{isAr ? 'تنبيه فوري عند ضرب السعر للهدف الأول لتصفية 50% من الصفقة.' : 'Instant alert when TP1 is hit to secure partial profits.'}</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyTP2}
                  onChange={e => setNotifyTP2(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-accent-blue focus:ring-accent-blue"
                />
                <div>
                  <span className="text-xs text-white block">{isAr ? 'تنبيهات الهدف الثاني (TP2)' : 'Notify Target 2 (TP2) hit'}</span>
                  <span className="text-[10px] text-slate-400">{isAr ? 'تنبيه فوري عند وصول السعر للهدف الثاني وإغلاق الصفقة بالكامل.' : 'Instant alert when TP2 is hit to close trade at maximum profits.'}</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifySL}
                  onChange={e => setNotifySL(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-accent-blue focus:ring-accent-blue"
                />
                <div>
                  <span className="text-xs text-white block">{isAr ? 'تنبيهات وقف الخسارة (Stop Loss)' : 'Notify Stop Loss'}</span>
                  <span className="text-[10px] text-slate-400">{isAr ? 'تنبيه طارئ فوري عند كسر وقف الخسارة لحماية رأس مالك.' : 'Emergency alert when stop loss level is breached.'}</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyPriceAlerts}
                  onChange={e => setNotifyPriceAlerts(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-accent-blue focus:ring-accent-blue"
                />
                <div>
                  <span className="text-xs text-white block">{isAr ? 'تنبيهات الأسعار المخصصة' : 'Notify Price Alerts'}</span>
                  <span className="text-[10px] text-slate-400">{isAr ? 'تنبيهك عند وصول الأسهم لمستويات الدعم/المقاومة التي حددتها.' : 'Alerts triggered by your customized target prices.'}</span>
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

        {/* Right Column: Telegram & Account Info */}
        <div className="space-y-6">
          
          {/* Telegram Linking Card */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-blue-500/5 to-transparent relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-16 h-16 bg-blue-500/10 rounded-full blur-xl"></div>
            
            <h2 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-400" />
              <span>✈️ ربط حساب تيليجرام (Telegram)</span>
            </h2>

            {telegramInfo && telegramInfo.verified ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{isAr ? 'حسابك مرتبك وموثق!' : 'Telegram linked successfully!'}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono space-y-1">
                  <div className="flex justify-between">
                    <span>{isAr ? 'معرف الدردشة:' : 'Chat ID:'}</span>
                    <span className="text-white font-bold">{telegramInfo.chat_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isAr ? 'تاريخ الربط:' : 'Linked at:'}</span>
                    <span className="text-white">{new Date(telegramInfo.linked_at).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm(isAr ? 'هل تريد إلغاء ربط بوت تيليجرام؟' : 'Are you sure you want to unlink Telegram?')) return;
                    await supabase.from('user_telegram').delete().eq('user_id', user.id);
                    setTelegramInfo(null);
                  }}
                  className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-[10px] font-bold transition cursor-pointer"
                >
                  {isAr ? 'إلغاء ربط الحساب' : 'Unlink Account'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-300 leading-normal">
                  {isAr 
                    ? 'قم بربط حسابك ببوت تيليجرام لتلقي إشارات البيع والهدف الفوري وتنبيهات كسر الوقف مباشرة في جيبك.'
                    : 'Link your account to our Telegram bot to receive live signals and target alerts directly.'}
                </p>
                
                {showTelegramLink ? (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <p className="text-[10px] text-slate-400 leading-normal">
                      {isAr 
                        ? '1. اضغط على الرابط بالأسفل لفتح البوت.' 
                        : '1. Click the link below to open the bot.'}
                    </p>
                    <a
                      href={`https://t.me/TradeORA_EGX_bot?start=${user?.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent-blue font-bold hover:underline block break-all font-mono"
                    >
                      t.me/TradeORA_EGX_bot?start={user?.id}
                    </a>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      {isAr 
                        ? '2. اضغط على زر البدء (/start) في تيليجرام وسيتم توثيق وربط حسابك فورياً!'
                        : '2. Press Start (/start) inside Telegram and your account will link instantly!'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        // Refresh to check if verified now
                        setLoading(true);
                        supabase
                          .from('user_telegram')
                          .select('*')
                          .eq('user_id', user.id)
                          .maybeSingle()
                          .then(({ data }) => {
                            if (data) setTelegramInfo(data);
                            setLoading(false);
                          });
                      }}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                    >
                      {isAr ? '🔄 تحديث حالة التوثيق' : '🔄 Refresh Link Status'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowTelegramLink(true)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isAr ? '🔗 ربط حساب تيليجرام' : '🔗 Link Telegram Account'}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Account Profile info */}
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
