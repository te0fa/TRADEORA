'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface AuthPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function AuthPage({ params }: AuthPageProps) {
  const { locale } = React.use(params);
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [refCode, setRefCode] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const code = new URLSearchParams(window.location.search).get('ref') || '';
      setRefCode(code.toUpperCase());
    }
  }, []);

  const isAr = locale === 'ar';

  // Check if user is already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = `/${locale}/screener`;
      }
    });
  }, [locale]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isLogin) {
        // Sign In
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        
        setSuccessMsg(isAr ? 'تم تسجيل الدخول بنجاح! جاري تحويلك...' : 'Logged in successfully! Redirecting...');
        setTimeout(() => {
          window.location.href = `/${locale}/screener`;
        }, 1500);
      } else {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });
        if (error) throw error;

        // Create profile in user_profiles
        if (data.user) {
          const { error: profileError } = await supabase.from('user_profiles').upsert({
            id: data.user.id,
            full_name: fullName,
            role: 'user',
            created_at: new Date().toISOString()
          });
          if (profileError) {
            console.error('Error creating user profile:', profileError);
          }

          // Apply referral rewards if refCode is present
          if (refCode) {
            try {
              await fetch('/api/referral/use', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  referral_code: refCode,
                  new_user_id: data.user.id,
                })
              });
            } catch (refErr) {
              console.error('Failed to consume referral code:', refErr);
            }
          }
        }

        setSuccessMsg(
          isAr 
            ? 'تم إنشاء الحساب بنجاح! تم تسجيل دخولك.'
            : 'Account created successfully! Logging you in.'
        );
        setTimeout(() => {
          window.location.href = `/${locale}/screener`;
        }, 2000);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || (isAr ? 'حدث خطأ غير متوقع. حاول مرة أخرى.' : 'An error occurred. Please try again.'));
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg(isAr ? 'الرجاء إدخال البريد الإلكتروني أولاً لإعادة تعيين كلمة المرور.' : 'Please enter your email first to reset password.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/${locale}/auth/reset`
      });
      if (error) throw error;
      setSuccessMsg(isAr ? 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني.' : 'Reset password link sent to your email.');
    } catch (err: any) {
      setErrorMsg(err.message || (isAr ? 'فشل إرسال البريد.' : 'Failed to send email.'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0B1120] font-sans relative overflow-hidden">
      
      {/* ABSOLUTE BRANDING TOP LEFT */}
      <div className="absolute top-6 left-8 z-50 flex items-center gap-3" dir="ltr">
        <span className="text-2xl font-black tracking-tight text-white select-none">
          <span className="text-accent-blue">TRADE</span>
          <span className="bg-gradient-to-r from-accent-blue to-emerald-400 bg-clip-text text-transparent">ORA</span>
        </span>
      </div>

      {/* LEFT COLUMN: PRO TRADING SCREEN MOCKUP */}
      <div className="hidden lg:flex w-1/2 relative bg-black/40 overflow-hidden items-center justify-center border-r border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/10 to-emerald-500/10 mix-blend-overlay z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-transparent to-transparent z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1120]/10 via-transparent to-[#0B1120] z-10"></div>
        
        <Image 
          src="/trading-mockup.jpg" 
          alt="Professional Trading Interface" 
          fill
          className="object-cover opacity-80 scale-105 hover:scale-110 hover:opacity-100 transition-all duration-1000 ease-in-out"
          priority
        />

        {/* Floating elements on top of image to make it look active */}
        <div className="absolute z-20 bottom-12 left-12 right-12 p-8 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl translate-y-4 hover:translate-y-0 transition-transform duration-500">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-blue to-emerald-500 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h4 className="text-white font-bold text-xl">{isAr ? 'تحليل احترافي' : 'Professional Analysis'}</h4>
              <p className="text-emerald-400 text-sm font-medium">+24.5% {isAr ? 'هذا الأسبوع' : 'This Week'}</p>
            </div>
          </div>
          <p className="text-text-secondary/80 text-sm leading-relaxed mt-4">
            {isAr 
              ? 'انضم الآن إلى المنصة الأكثر تطوراً لتداول الأسهم والمتابعة اللحظية بأدوات تحليل تعتمد على الذكاء الاصطناعي.' 
              : 'Join the most advanced stock trading and real-time tracking platform with AI-powered analysis tools.'}
          </p>
        </div>
      </div>
      
      {/* RIGHT COLUMN: AUTH FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10 flex-col">
        
        {/* Decorative background glows for form side */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-accent-blue/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="w-full max-w-[440px] flex flex-col">
          {/* HEADER MESSAGING */}
          <div className="flex flex-col items-center mb-10">
            <h2 className="text-3xl font-bold text-white text-center mb-3">
              {isAr 
                ? (isLogin ? 'مرحباً بك مجدداً' : 'إنشاء حساب جديد') 
                : (isLogin ? 'Welcome Back' : 'Create Account')}
            </h2>
            <p className="text-sm text-text-secondary/70 text-center font-medium">
              {isAr ? 'المنصة الذكية المتكاملة لتحليل الأسهم وإدارة الصفقات' : 'Smart Platform for Stock Analysis & Trade Management'}
            </p>
          </div>

          {/* SUCCESS STATE - REPLACES FORM ENTIRELY */}
          {successMsg ? (
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500 text-center">
              <div className="w-20 h-20 mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <svg className="w-10 h-10 text-emerald-400 animate-[bounce_2s_infinite]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {isAr ? 'مرحباً بك!' : 'Welcome!'}
              </h3>
              <p className="text-emerald-400 font-medium mb-6">{successMsg}</p>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-accent-blue to-emerald-400 animate-[pulse_1.5s_infinite] w-full origin-left"></div>
              </div>
            </div>
          ) : (
            /* FORM STATE */
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl">

              {errorMsg && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="flex-1">{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-1.5 group">
                    <label className="text-xs text-text-secondary/90 font-semibold uppercase tracking-wider ml-1">
                      {isAr ? 'الاسم الكامل' : 'Full Name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={isAr ? 'ادخل اسمك بالكامل' : 'Enter your full name'}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white focus:border-accent-blue focus:bg-black/40 focus:ring-1 focus:ring-accent-blue/50 outline-none transition-all placeholder:text-text-secondary/40"
                    />
                  </div>
                )}

                <div className="space-y-1.5 group">
                  <label className="text-xs text-text-secondary/90 font-semibold uppercase tracking-wider ml-1">
                    {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white focus:border-accent-blue focus:bg-black/40 focus:ring-1 focus:ring-accent-blue/50 outline-none transition-all placeholder:text-text-secondary/40"
                  />
                </div>

                <div className="space-y-1.5 group">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs text-text-secondary/90 font-semibold uppercase tracking-wider">
                      {isAr ? 'كلمة السر' : 'Password'}
                    </label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-xs text-accent-blue hover:text-emerald-400 transition-colors font-medium cursor-pointer"
                      >
                        {isAr ? 'نسيت كلمة السر؟' : 'Forgot password?'}
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white focus:border-accent-blue focus:bg-black/40 focus:ring-1 focus:ring-accent-blue/50 outline-none transition-all placeholder:text-text-secondary/40"
                  />
                </div>

                {!isLogin && (
                  <div className="space-y-1.5 group">
                    <label className="text-xs text-text-secondary/90 font-semibold uppercase tracking-wider ml-1">
                      {isAr ? 'كود الإحالة (اختياري)' : 'Referral Code (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={refCode}
                      onChange={(e) => setRefCode(e.target.value.toUpperCase())}
                      placeholder="TRA-XXXXX"
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white focus:border-accent-blue focus:bg-black/40 focus:ring-1 focus:ring-accent-blue/50 outline-none transition-all placeholder:text-text-secondary/40"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 rounded-xl font-bold text-sm text-white mt-8 bg-gradient-to-r from-accent-blue to-emerald-500 hover:from-[#3B82F6] hover:to-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer ${
                    loading ? 'opacity-70 pointer-events-none' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>{isAr ? 'جاري المعالجة...' : 'Processing...'}</span>
                    </>
                  ) : (
                    <span>
                      {isAr 
                        ? (isLogin ? 'تسجيل الدخول' : 'تسجيل حساب جديد')
                        : (isLogin ? 'Sign In' : 'Sign Up')}
                    </span>
                  )}
                </button>
              </form>

              <div className="mt-8 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-sm text-text-secondary hover:text-white transition-colors cursor-pointer group flex items-center gap-1"
                >
                  {isAr
                    ? (isLogin ? 'ليس لديك حساب؟ ' : 'لديك حساب بالفعل؟ ')
                    : (isLogin ? "Don't have an account? " : 'Already have an account? ')}
                  <span className="text-accent-blue group-hover:text-emerald-400 transition-colors font-semibold">
                    {isAr
                      ? (isLogin ? 'إنشاء حساب جديد' : 'تسجيل الدخول')
                      : (isLogin ? 'Sign Up' : 'Sign In')}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
}
