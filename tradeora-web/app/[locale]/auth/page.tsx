'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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

  const isAr = locale === 'ar';

  // Check if user is already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace(`/${locale}`);
      }
    });
  }, [router, locale]);

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
        
        setSuccessMsg(isAr ? '🔓 تم تسجيل الدخول بنجاح! جاري تحويلك...' : '🔓 Logged in successfully! Redirecting...');
        setTimeout(() => {
          router.replace(`/${locale}`);
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
        }

        setSuccessMsg(
          isAr 
            ? '✅ تم إنشاء الحساب بنجاح! تم تسجيل دخولك.'
            : '✅ Account created successfully! Logging you in.'
        );
        setTimeout(() => {
          router.replace(`/${locale}`);
        }, 2000);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || (isAr ? 'حدث خطأ غير متوقع. حاول مرة أخرى.' : 'An error occurred. Please try again.'));
    } finally {
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
      setSuccessMsg(isAr ? '📧 تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني.' : '📧 Reset password link sent to your email.');
    } catch (err: any) {
      setErrorMsg(err.message || (isAr ? 'فشل إرسال البريد.' : 'Failed to send email.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0F172A] to-[#1E293B] px-4 font-sans relative overflow-hidden">
      {/* Dynamic Glow Circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-blue/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-[420px] bg-slate-900/60 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl relative z-10">
        {/* LOGO */}
        <div className="flex flex-col items-center mb-8">
          <div className="text-3xl font-black tracking-tight text-white mb-2 flex items-center gap-2 select-none">
            <span className="text-accent-blue">TRADE</span>
            <span className="bg-gradient-to-r from-accent-blue to-emerald-400 bg-clip-text text-transparent">ORA</span>
          </div>
          <p className="text-xs text-text-secondary/60 text-center">
            {isAr ? 'المنصة الذكية المتكاملة لتحليل الأسهم وإدارة الصفقات' : 'Smart Platform for Stock Analysis & Trade Management'}
          </p>
        </div>

        <h2 className="text-xl font-bold text-white text-center mb-6">
          {isAr 
            ? (isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد') 
            : (isLogin ? 'Sign In' : 'Create Account')}
        </h2>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-start gap-2">
            <span>⚠️</span>
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-start gap-2">
            <span>✓</span>
            <span className="flex-1">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="text-xs text-text-secondary/80 block mb-1.5 font-medium">
                {isAr ? 'الاسم الكامل' : 'Full Name'}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={isAr ? 'ادخل اسمك بالكامل' : 'Enter your full name'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-blue outline-none transition-colors placeholder:text-text-secondary/30"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-text-secondary/80 block mb-1.5 font-medium">
              {isAr ? 'البريد الإلكتروني' : 'Email Address'}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-blue outline-none transition-colors placeholder:text-text-secondary/30"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs text-text-secondary/80 font-medium">
                {isAr ? 'كلمة السر' : 'Password'}
              </label>
              {isLogin && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[10px] text-accent-blue hover:underline cursor-pointer"
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
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-blue outline-none transition-colors placeholder:text-text-secondary/30"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-sm text-white mt-4 bg-gradient-to-r from-accent-blue to-[#2563EB] hover:shadow-lg hover:shadow-accent-blue/15 transition-all flex items-center justify-center gap-2 cursor-pointer ${
              loading ? 'opacity-50 cursor-wait' : ''
            }`}
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>{isAr ? 'جاري التحميل...' : 'Loading...'}</span>
              </>
            ) : (
              <span>
                {isAr 
                  ? (isLogin ? 'تسجيل الدخول 🔐' : 'تسجيل حساب جديد ✨')
                  : (isLogin ? 'Sign In 🔐' : 'Sign Up ✨')}
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/5 flex flex-col items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="text-text-secondary/60 hover:text-white transition-colors cursor-pointer"
          >
            {isAr
              ? (isLogin ? 'ليس لديك حساب؟ إنشاء حساب جديد' : 'لديك حساب بالفعل؟ تسجيل الدخول')
              : (isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In')}
          </button>
        </div>
      </div>
    </div>
  );
}
