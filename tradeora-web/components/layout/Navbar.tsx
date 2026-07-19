'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { TradeoraLogo } from '@/components/ui/TradeoraLogo';
import { useMarketStatus } from '@/hooks/useMarketStatus';
import { toEasternArabic } from '@/lib/formatters';
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import { 
  Globe, 
  Clock, 
  User, 
  LogOut, 
  Briefcase, 
  TrendingUp, 
  Settings, 
  Home, 
  BarChart2, 
  Bell,
  Search,
  Shield,
  Star
} from 'lucide-react';

interface NavbarProps {
  locale: string;
}

export function Navbar({ locale }: NavbarProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { cairoTime, isOpen } = useMarketStatus();

  const [session, setSession] = useState<any>(null);
  const [userName, setUserName] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');

  const isAr = locale === 'ar';
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Listen to Auth state changes
  useEffect(() => {
    const fetchRole = async (userId: string) => {
      try {
        const { data } = await supabase.from('user_profiles').select('role').eq('id', userId).maybeSingle();
        if (data) {
          setUserRole(data.role);
        } else {
          setUserRole('user');
        }
      } catch (err) {
        console.error('Error fetching role in Navbar:', err);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '');
        fetchRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '');
        fetchRole(session.user.id);
      } else {
        setUserName('');
        setUserRole('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push(`/${locale}/auth`);
  };

  // Swapping the locale prefix in the URL path
  const toggleLocale = () => {
    const nextLocale = locale === 'ar' ? 'en' : 'ar';
    const pathSegments = pathname.split('/');
    if (pathSegments[1] === 'ar' || pathSegments[1] === 'en') {
      pathSegments[1] = nextLocale;
    } else {
      pathSegments.splice(1, 0, nextLocale);
    }
    router.push(pathSegments.join('/') || '/');
  };

  const formattedTime = locale === 'ar' ? toEasternArabic(cairoTime) : cairoTime;

  return (
    <header className="sticky top-0 z-50 w-full glass-card border-b border-white/5 backdrop-blur-md font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left Side: Logo & Main Navigation Links */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <TradeoraLogo width={160} height={45} showSubtitle={false} />
          </Link>

          {/* Navigation Links (Visible only if logged in) */}
          {session && (
            <nav className="hidden lg:flex items-center gap-4 text-xs font-semibold text-text-secondary">
              <Link 
                href={`/${locale}`}
                className={`flex items-center gap-1 hover:text-text-primary px-2.5 py-1.5 rounded-lg transition-colors ${
                  pathname === `/${locale}` ? 'text-accent-blue bg-white/5' : ''
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>{isAr ? '🏠 الرئيسية' : 'Home'}</span>
              </Link>

              <Link 
                href={`/${locale}/screener`}
                className={`flex items-center gap-1 hover:text-text-primary px-2.5 py-1.5 rounded-lg transition-colors ${
                  pathname.includes('/stock') ? 'text-accent-blue bg-white/5' : ''
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>{isAr ? '📊 الأسهم' : 'Stocks'}</span>
              </Link>
              <Link 
                href={`/${locale}/screener`}
                className={`flex items-center gap-1 hover:text-text-primary px-2.5 py-1.5 rounded-lg transition-colors ${
                  pathname.includes('/screener') ? 'text-accent-blue bg-white/5' : ''
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isAr ? '🔍 فرز الأسهم' : 'Screener'}</span>
              </Link>

              <Link 
                href={`/${locale}/sectors`}
                className={`flex items-center gap-1 hover:text-text-primary px-2.5 py-1.5 rounded-lg transition-colors ${
                  pathname.includes('/sectors') ? 'text-accent-blue bg-white/5 font-bold' : ''
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                <span>{isAr ? '🏭 القطاعات' : 'Sectors'}</span>
              </Link>

              <Link 
                href={`/${locale}/compare`}
                className={`flex items-center gap-1 hover:text-text-primary px-2.5 py-1.5 rounded-lg transition-colors ${
                  pathname.includes('/compare') ? 'text-accent-blue bg-white/5 font-bold' : ''
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                <span>{isAr ? '⚖️ مقارنة' : 'Compare'}</span>
              </Link>

              <Link 
                href={`/${locale}/watchlist`}
                className={`flex items-center gap-1 hover:text-text-primary px-2.5 py-1.5 rounded-lg transition-colors ${
                  pathname.includes('/watchlist') ? 'text-accent-blue bg-white/5 font-bold' : ''
                }`}
              >
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span>{isAr ? '⭐ المراقبة' : 'Watchlist'}</span>
              </Link>

              <Link 
                href={`/${locale}/my-trades`}
                className={`flex items-center gap-1 hover:text-text-primary px-2.5 py-1.5 rounded-lg transition-colors ${
                  pathname.includes('/my-trades') ? 'text-accent-blue bg-white/5' : ''
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>{isAr ? '💼 صفقاتي' : 'My Trades'}</span>
              </Link>

              <Link 
                href={`/${locale}/performance`}
                className={`flex items-center gap-1 hover:text-text-primary px-2.5 py-1.5 rounded-lg transition-colors ${
                  pathname.includes('/performance') ? 'text-accent-blue bg-white/5' : ''
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{isAr ? '📈 الأداء' : 'Performance'}</span>
              </Link>

              {userRole === 'admin' && (
                <Link 
                  href={`/${locale}/admin`}
                  className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30 transition-all flex items-center gap-1"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{isAr ? '🛡️ الإدارة' : 'Admin'}</span>
                </Link>
              )}

              <Link 
                href={`/${locale}/settings`}
                className={`flex items-center gap-1 hover:text-text-primary px-2.5 py-1.5 rounded-lg transition-colors ${
                  pathname.includes('/settings') ? 'text-accent-blue bg-white/5 font-bold' : 'text-slate-300'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{isAr ? '⚙️ الإعدادات' : 'Settings'}</span>
              </Link>
            </nav>
          )}
        </div>

        {/* Right Side: Market Clock & User Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Live Status and Clock (Desktop) */}
          <div className="hidden xl:flex items-center gap-4 text-xs text-text-secondary mr-2">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="font-medium">
                {isOpen ? (t('sessionStatus.open') || 'Session Open') : (t('sessionStatus.closed') || 'Session Closed')}
              </span>
            </div>
            <div className="w-[1px] h-3 bg-white/10" />
            <div className="flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-accent-blue" />
              <span className="text-text-primary font-bold">{formattedTime}</span>
              <span className="text-[10px]">({t('clockCairo') || 'Cairo'})</span>
            </div>
          </div>

          {/* Watchlist Quick Link */}
          {session && (
            <Link 
              href={`/${locale}/watchlist`}
              className={`text-xs font-semibold text-text-secondary hover:text-text-primary px-2.5 py-1.5 rounded-lg border border-white/5 hover:border-white/10 transition-all duration-200 ${
                pathname.includes('/watchlist') ? 'border-accent-blue/30 text-accent-blue bg-accent-blue/5' : ''
              }`}
            >
              ⭐️ {isAr ? 'المتابعة' : 'Watchlist'}
            </Link>
          )}

          {/* Language Switcher */}
          <button
            onClick={toggleLocale}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary border border-white/5 transition-all duration-200 cursor-pointer"
            title={isAr ? 'Switch to English' : 'تحويل للغة العربية'}
          >
            <Globe className="w-3.5 h-3.5 text-accent-blue" />
            <span>{isAr ? 'EN' : 'عربي'}</span>
          </button>

          {/* User Profile & LogOut */}
          {session ? (
            <div className="flex items-center gap-2 border-l border-white/10 pl-2 sm:pl-3">
              {/* Notification Bell */}
              <button 
                className="p-1.5 hover:bg-white/5 rounded-lg text-text-secondary hover:text-text-primary transition-colors cursor-pointer relative"
                title={isAr ? 'التنبيهات' : 'Notifications'}
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-accent-blue rounded-full"></span>
              </button>

              {/* Username display */}
              <div className="hidden md:flex flex-col text-right ml-1">
                <span className="text-[10px] text-text-secondary">{isAr ? 'مرحباً،' : 'Welcome,'}</span>
                <span className="text-xs font-bold text-text-primary max-w-[90px] truncate">{userName}</span>
              </div>

              {/* User Avatar / Profile Icon */}
              <div className="w-8 h-8 rounded-full bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-accent-blue font-bold text-xs select-none">
                <User className="w-4 h-4" />
              </div>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-text-secondary transition-colors cursor-pointer"
                title={isAr ? 'خروج' : 'Sign Out'}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            pathname !== `/${locale}/auth` && (
              <Link
                href={`/${locale}/auth`}
                className="text-xs font-bold px-4 py-2 rounded-xl bg-accent-blue hover:bg-accent-blue/80 text-white transition-all shadow-md shadow-accent-blue/10"
              >
                {isAr ? 'تسجيل الدخول' : 'Sign In'}
              </Link>
            )
          )}
        </div>
      </div>
      
      {/* Mobile Clock & Status Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-black/20 border-t border-white/5 text-[10px] text-text-secondary font-mono">
        <span className="font-semibold flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          {isOpen ? (t('sessionStatus.open') || 'Session Open') : (t('sessionStatus.closed') || 'Session Closed')}
        </span>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-accent-blue" />
          <span className="text-text-primary font-bold">{formattedTime}</span>
          <span>({t('clockCairo') || 'Cairo'})</span>
        </div>
      </div>

      {/* Mobile Navigation Links */}
      {session && (
        <div className="lg:hidden flex items-center justify-around border-t border-white/5 px-2 py-1.5 bg-slate-900/40 text-[9px] font-semibold text-text-secondary overflow-x-auto gap-1">
          <Link href={`/${locale}`} className="flex flex-col items-center gap-0.5 hover:text-text-primary min-w-[45px]">
            <Home className="w-3.5 h-3.5" />
            <span>{isAr ? 'الرئيسية' : 'Home'}</span>
          </Link>
          <Link href={`/${locale}`} className="flex flex-col items-center gap-0.5 hover:text-text-primary min-w-[45px]">
            <BarChart2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'الأسهم' : 'Stocks'}</span>
          </Link>
          <Link href={`/${locale}/screener`} className="flex flex-col items-center gap-0.5 hover:text-text-primary min-w-[45px]">
            <Search className="w-3.5 h-3.5" />
            <span>{isAr ? 'الفرز' : 'Screener'}</span>
          </Link>
          <Link href={`/${locale}/sectors`} className="flex flex-col items-center gap-0.5 hover:text-text-primary min-w-[45px]">
            <Briefcase className="w-3.5 h-3.5 text-blue-400" />
            <span>{isAr ? 'القطاعات' : 'Sectors'}</span>
          </Link>
          <Link href={`/${locale}/compare`} className="flex flex-col items-center gap-0.5 hover:text-text-primary min-w-[45px]">
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            <span>{isAr ? 'مقارنة' : 'Compare'}</span>
          </Link>
          <Link href={`/${locale}/watchlist`} className="flex flex-col items-center gap-0.5 hover:text-text-primary min-w-[45px]">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span>{isAr ? 'المراقبة' : 'Watchlist'}</span>
          </Link>
          <Link href={`/${locale}/my-trades`} className="flex flex-col items-center gap-0.5 hover:text-text-primary min-w-[45px]">
            <Briefcase className="w-3.5 h-3.5" />
            <span>{isAr ? 'صفقاتي' : 'Trades'}</span>
          </Link>
          <Link href={`/${locale}/performance`} className="flex flex-col items-center gap-0.5 hover:text-text-primary min-w-[45px]">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{isAr ? 'الأداء' : 'Performance'}</span>
          </Link>
          <Link href={`/${locale}/settings`} className="flex flex-col items-center gap-0.5 hover:text-text-primary min-w-[45px]">
            <Settings className="w-3.5 h-3.5" />
            <span>{isAr ? 'الإعدادات' : 'Settings'}</span>
          </Link>
          {userRole === 'admin' && (
            <Link href={`/${locale}/admin`} className="flex flex-col items-center gap-0.5 hover:text-text-primary min-w-[45px] text-red-400">
              <Shield className="w-3.5 h-3.5" />
              <span>{isAr ? 'التحكم' : 'Admin'}</span>
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
