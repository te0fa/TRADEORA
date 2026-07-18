'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { usePushNotifications } from '@/lib/usePushNotifications';
import { Settings, Shield, User, Bell, Percent, CreditCard, Check, Send } from 'lucide-react';

export default function SettingsPage() {
  const { locale } = useParams();
  const router = useRouter();
  const push = usePushNotifications();
  const isAr = locale === 'ar';

  const t = (ar: string, en: string) => (isAr ? ar : en);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [capital, setCapital] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(2);

  // Telegram Info
  const [telegramInfo, setTelegramInfo] = useState<any>(null);
  const [showTelegramLink, setShowTelegramLink] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace(`/${locale}/auth`);
        return;
      }
      setUser(user);

      // Fetch user profile and telegram info
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
          setCapital(Number(profileRes.data.default_capital ?? 10000));
          setRiskPercent(Number(profileRes.data.default_risk_pct ?? 2));
        } else {
          setProfile({ full_name: user.email?.split('@')[0], role: 'user' });
          setFullName(user.email?.split('@')[0] || '');
        }

        if (telegramRes.data) {
          setTelegramInfo(telegramRes.data);
        }

        // Show upgrade success toast if redirected from Stripe
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          if (params.get('upgraded') === '1') {
            setToastMessage(isAr ? '🎉 تهانينا! تم ترقية حسابك للباقة المميزة بنجاح!' : '🎉 Congratulations! Account upgraded to Premium successfully!');
            // Clean URL query params without reloading
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
          }
        }

        setLoading(false);
      });
    });
  }, [router, locale, isAr]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      if (user) {
        await supabase
          .from('user_profiles')
          .upsert([{
            id: user.id,
            full_name: fullName,
            default_capital: capital,
            default_risk_pct: riskPercent,
          }]);
      }

      // Also sync to localStorage for client-side instant computations
      localStorage.setItem('user_capital', String(capital));
      localStorage.setItem('user_risk_percent', String(riskPercent));

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
    <div className="w-full max-w-4xl mx-auto font-sans text-text-primary" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white mb-1 flex items-center gap-2">
          <Settings className="w-6 h-6 text-accent-blue" />
          <span>{t('⚙️ الإعدادات', 'Settings')}</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Sizing & Preferences */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Profile Name card */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-accent-blue" />
              <span>{t('👤 الملف الشخصي', 'Profile')}</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  {t('الاسم بالكامل', 'Full Name')}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder={t('اسمك الكامل', 'Your name')}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs focus:border-accent-blue outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  {t('البريد الإلكتروني', 'Email')}
                </label>
                <input
                  type="text"
                  value={user?.email ?? ''}
                  disabled
                  className="w-full bg-white/3 border border-white/5 rounded-xl px-4 py-2.5 text-slate-500 text-xs cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Sizing Card */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Percent className="w-4 h-4 text-accent-blue" />
              <span>{t('💰 إعدادات التداول وإدارة المخاطر', 'Trading & Position Sizing Settings')}</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  {t('رأس المال الافتراضي (EGP)', 'Default Capital (EGP)')}
                </label>
                <input
                  type="number"
                  value={capital}
                  onChange={e => setCapital(Number(e.target.value))}
                  step={1000}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs focus:border-accent-blue outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  {t('يُستخدم تلقائياً في حاسبة إدارة المخاطر المخصصة صمن الرسم البياني.', 'Used automatically in the stock position risk calculator.')}
                </p>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs text-slate-400">
                    {t('نسبة المخاطرة الافتراضية', 'Default Risk %')}
                  </label>
                  <span className={`text-sm font-bold ${
                    riskPercent <= 2 ? 'text-green-400'
                    : riskPercent <= 4 ? 'text-yellow-400'
                    : 'text-red-400'
                  }`}>
                    {riskPercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5} max={5} step={0.5}
                  value={riskPercent}
                  onChange={e => setRiskPercent(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>{t('محافظ 0.5%', 'Conservative 0.5%')}</span>
                  <span>{t('متوسط 2%', 'Moderate 2%')}</span>
                  <span>{t('عالي 5%', 'High 5%')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Card */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-accent-blue" />
              <span>{t('🔔 إشعارات النظام المتقدمة', 'System Notifications Settings')}</span>
            </h2>

            <div className="space-y-4">
              {/* Push notifications switch panel */}
              <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <div>
                  <p className="text-white text-xs font-semibold">
                    📱 {t('إشعارات المتصفح الفورية (Push)', 'Browser Push Notifications')}
                  </p>
                  <p className="text-slate-400 text-[10px] mt-0.5 leading-normal">
                    {t('استقبل تنبيهات الأهداف ووقف الخسارة مباشرة على شاشتك فوراً.', 'Receive TP1/SL alerts directly on screen in real-time.')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {push.subscribed && (
                    <span className="text-green-400 text-xs font-bold font-mono">
                      ✓ {t('مفعّل', 'Active')}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={push.subscribed ? push.unsubscribe : push.subscribe}
                    disabled={!push.supported || push.loading}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      push.subscribed
                        ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
                    } disabled:opacity-40`}
                  >
                    {push.loading ? '...' : push.subscribed ? t('إلغاء', 'Disable') : t('تفعيل', 'Enable')}
                  </button>
                </div>
              </div>

              {!push.supported && (
                <p className="text-yellow-400 text-[10px] bg-yellow-400/10 rounded-lg p-2 leading-normal">
                  ⚠️ {t('متصفحك الحالي لا يدعم إشعارات المتصفح الفورية.', 'Your current browser does not support push notifications.')}
                </p>
              )}

              {/* Telegram Link panel */}
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white text-xs font-semibold">
                      ✈️ {t('إشعارات بوت تيليجرام (Telegram)', 'Telegram Alerts')}
                    </p>
                    <p className="text-slate-400 text-[10px] mt-0.5 leading-normal">
                      {telegramInfo?.verified ? t('مرتبط وموثق ✓', 'Connected & Verified ✓') : t('غير مرتبط', 'Not connected')}
                    </p>
                  </div>
                  {telegramInfo?.verified && (
                    <span className="text-green-400 text-xs bg-green-400/10 px-2 py-0.5 rounded-full font-bold">
                      ✓ {t('نشط', 'Active')}
                    </span>
                  )}
                </div>

                {!telegramInfo?.verified ? (
                  <div className="space-y-3">
                    <p className="text-slate-400 text-[10px] leading-normal">
                      {t('لربط وتفعيل إشعارات تيليجرام على هاتفك، اضغط أدناه لإرسال كود التوثيق للبوت:', 'To enable telegram alerts, open the bot link and press start:')}
                    </p>
                    <div className="bg-black/30 rounded-lg p-3 font-mono text-[10px] text-blue-400 select-all break-all text-center">
                      {user ? `t.me/TradeORA_EGX_bot?start=${user.id}` : '...'}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (user) {
                          window.open(`https://t.me/TradeORA_EGX_bot?start=${user.id}`, '_blank');
                          setShowTelegramLink(true);
                        }
                      }}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/15"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{t('افتح تيليجرام واربط الحساب', 'Open Telegram')}</span>
                    </button>
                    
                    {showTelegramLink && (
                      <button
                        type="button"
                        onClick={() => {
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
                        className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg text-[10px] font-bold transition cursor-pointer"
                      >
                        {t('🔄 تحديث حالة الربط', '🔄 Refresh Link Status')}
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm(t('هل تريد إلغاء ربط بوت تيليجرام؟', 'Are you sure you want to unlink Telegram?'))) return;
                      await supabase.from('user_telegram').delete().eq('user_id', user.id);
                      setTelegramInfo(null);
                    }}
                    className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-[10px] font-bold transition cursor-pointer"
                  >
                    {t('إلغاء ربط تيليجرام', 'Unlink Telegram')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Save Action button */}
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
              saveSuccess
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {saving ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-green-300 animate-bounce" />
                <span>{t('✅ تم حفظ التغييرات!', '✅ Saved!')}</span>
              </>
            ) : (
              <span>{t('💾 حفظ الإعدادات المفضلة', '💾 Save Settings')}</span>
            )}
          </button>
        </div>

        {/* Right Column: Security, Admin & Subscription Info */}
        <div className="space-y-6">
          
          {/* Security details section */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <span>🔐</span>
              <span>{t('الأمان وتغيير المرور', 'Security')}</span>
            </h2>
            
            <button
              type="button"
              onClick={async () => {
                try {
                  await supabase.auth.resetPasswordForEmail(user?.email ?? '', {
                    redirectTo: `${window.location.origin}/auth/reset`
                  });
                  alert(t('تم إرسال رابط إعادة تعيين كلمة السر لبريدك بنجاح ✅', 'Password reset link sent to your email ✅'));
                } catch (e) {
                  alert(t('فشل إرسال الرابط، يرجى المحاولة لاحقاً.', 'Failed to send reset link, try again later.'));
                }
              }}
              className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs hover:bg-white/10 transition cursor-pointer"
            >
              🔑 {t('إعادة تعيين كلمة السر', 'Reset Password')}
            </button>
          </div>

          {/* 🎁 Referral Program Card */}
          <div className="card-gold rounded-2xl p-6 mb-5 relative overflow-hidden bg-gradient-to-br from-yellow-500/5 to-transparent border border-[#C9A84C]/25">
            <h2 className="font-bold mb-4 text-yellow-400 text-sm flex items-center gap-1.5">
              <span>🎁</span>
              <span>{t('برنامج الإحالة والمكافآت', 'Referral Program')}</span>
            </h2>

            <div className="bg-black/20 rounded-xl p-4 mb-4">
              <p className="text-slate-400 text-[10px] mb-2">
                {t('كود الإحالة الخاص بك:', 'Your referral code:')}
              </p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-yellow-400 font-extrabold text-xl tracking-widest font-mono">
                  {profile?.referral_code ?? '...'}
                </p>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/${locale}/auth?ref=${profile?.referral_code}`
                      );
                      alert(t('✅ تم نسخ رابط الإحالة بنجاح!', '✅ Referral link copied!'));
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-[10px] font-bold hover:bg-white/20 transition cursor-pointer"
                >
                  {t('📋 نسخ', '📋 Copy')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-center">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-slate-400 text-[10px]">{t('أحضرت', 'Invited')}</p>
                <p className="text-xl font-black text-yellow-400 font-sans">
                  {profile?.referral_count ?? 0}
                </p>
                <p className="text-slate-500 text-[9px]">{t('صديق', 'friends')}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-slate-400 text-[10px]">{t('ربحت', 'Earned')}</p>
                <p className="text-xl font-black text-green-400 font-sans">
                  {profile?.referral_months ?? 0}
                </p>
                <p className="text-slate-500 text-[9px]">{t('شهر مجاني', 'free months')}</p>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-[10px] text-yellow-400 leading-relaxed mb-4">
              {t(
                '🎁 لكل صديق يسجل بكودك: تحصل أنت وصديقك على شهر Premium كامل مجاناً لفك قفل جميع الأسهم والإشارات!',
                '🎁 For every friend who signs up using your code: Both of you will instantly receive 1 Free Month of Premium access!'
              )}
            </div>

            {/* Share Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    const url = `${window.location.origin}/${locale}/auth?ref=${profile?.referral_code}`;
                    const text = t(
                      `انضم لـ TRADEORA وحلل أسهم البورصة المصرية بالذكاء الاصطناعي! 📊\n${url}`,
                      `Join TRADEORA and analyze EGX stocks with AI! 📊\n${url}`
                    );
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/30 transition-all cursor-pointer text-center"
              >
                {t('📱 واتساب', '📱 WhatsApp')}
              </button>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    const url = `${window.location.origin}/${locale}/auth?ref=${profile?.referral_code}`;
                    const text = t('انضم لـ TRADEORA!', 'Join TRADEORA!');
                    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#229ED9]/20 text-[#60C8F5] text-xs font-bold hover:bg-[#229ED9]/30 transition-all cursor-pointer text-center"
              >
                {t('✈️ تيليجرام', '✈️ Telegram')}
              </button>
            </div>
          </div>

          {/* Premium Subscription Card */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-emerald-500/5 to-transparent relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl"></div>
            <h2 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
              <span>💳</span>
              <span>{t('حالة اشتراك الحساب', 'Subscription Status')}</span>
            </h2>

            {profile?.role === 'premium' || profile?.role === 'admin' ? (
              <div className="space-y-2 text-xs">
                <p className="text-white leading-normal">
                  {t('🎉 أنت مشترك بالباقة المميزة (Premium) وتتمتع بوصول كامل لإشارات الذكاء الاصطناعي والمؤشرات المتقدمة.', '🎉 You are a Premium user with full access to indicators & recommendations.')}
                </p>
                {profile.subscription_end && (
                  <p className="text-[10px] text-slate-400 font-mono">
                    {t('ينتهي في: ', 'Expires: ')}{new Date(profile.subscription_end).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-slate-300 leading-normal">
                  {t('أنت تستخدم الباقة المجانية. اشترك في المميز لتلقي التنبيهات وإشارات التداول الفنية الفورية.', 'Upgrade to get real-time recommendations and signal alerts.')}
                </p>
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/pricing`)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {t('⚡ ترقية الحساب للمميز', 'Upgrade to Premium')}
                </button>
              </div>
            )}
          </div>

          {/* Danger zone */}
          <div className="glass-card p-6 rounded-2xl border border-red-500/10 bg-gradient-to-br from-red-500/[0.01] to-transparent">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <span>⚠️</span>
              <span>{t('منطقة الخطر', 'Danger Zone')}</span>
            </h2>

            <button
              type="button"
              onClick={async () => {
                if (!confirm(t('هل أنت متأكد من تسجيل الخروج؟', 'Are you sure you want to sign out?'))) return;
                await supabase.auth.signOut();
                router.push(`/${locale}/auth`);
              }}
              className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition cursor-pointer font-bold"
            >
              🚪 {t('تسجيل الخروج', 'Sign Out')}
            </button>
          </div>
        </div>

      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border border-yellow-500/20 bg-[#0A0F1E]/95 text-yellow-400 text-xs font-semibold shadow-2xl backdrop-blur-md animate-fade-in font-sans">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-3 text-slate-400 hover:text-white cursor-pointer font-bold text-xs p-1">
            ✕
          </button>
        </div>
      )}

    </div>
  );
}
