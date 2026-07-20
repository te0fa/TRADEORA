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
import { motion } from 'framer-motion';
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
import { Button } from '@/components/ui/Button';

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
  
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

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

  const navLinks = [
    { href: `/${locale}`, icon: Home, label: isAr ? 'الرئيسية' : 'Home', exact: true },
    { href: `/${locale}/screener`, icon: Search, label: isAr ? 'الفرز' : 'Screener' },
    { href: `/${locale}/sectors`, icon: Briefcase, label: isAr ? 'القطاعات' : 'Sectors', color: 'text-blue-400' },
    { href: `/${locale}/compare`, icon: TrendingUp, label: isAr ? 'مقارنة' : 'Compare', color: 'text-purple-400' },
    { href: `/${locale}/watchlist`, icon: Star, label: isAr ? 'المراقبة' : 'Watchlist', color: 'text-accent-gold fill-accent-gold' },
    { href: `/${locale}/my-trades`, icon: Briefcase, label: isAr ? 'صفقاتي' : 'Trades' },
    { href: `/${locale}/performance`, icon: TrendingUp, label: isAr ? 'الأداء' : 'Performance' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-surface-elevated/80 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left Side: Logo & Main Navigation Links */}
        <div className="flex items-center gap-6 lg:gap-8">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
            <TradeoraLogo width={140} height={40} showSubtitle={false} />
          </Link>

          {/* Navigation Links (Visible only if logged in) */}
          {session && (
            <nav className="hidden lg:flex items-center gap-2 text-[13px] font-bold text-zinc-400">
              {navLinks.map((link) => {
                const isActive = link.exact 
                  ? pathname === link.href 
                  : pathname.includes(link.href.split('/').pop()!);
                
                return (
                  <Link 
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-300 relative group ${
                      isActive ? 'text-white' : 'hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="navIndicator" 
                        className="absolute inset-0 bg-white/10 rounded-xl"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <link.icon className={`w-4 h-4 z-10 transition-colors ${link.color || ''} ${isActive && !link.color ? 'text-accent-blue' : ''} group-hover:${link.color ? link.color.split(' ')[0] : 'text-accent-blue'}`} />
                    <span className="z-10">{link.label}</span>
                  </Link>
                );
              })}

              {userRole === 'admin' && (
                <Link 
                  href={`/${locale}/admin`}
                  className="px-3 py-2 rounded-xl bg-down-red/10 border border-down-red/20 text-down-red text-xs font-black hover:bg-down-red/20 transition-all flex items-center gap-1.5 ml-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>{isAr ? 'الإدارة' : 'Admin'}</span>
                </Link>
              )}

              <Link 
                href={`/${locale}/settings`}
                className={`flex items-center gap-1.5 hover:text-white px-3 py-2 rounded-xl transition-all ml-2 ${
                  pathname.includes('/settings') ? 'text-white bg-white/10' : ''
                }`}
              >
                <Settings className="w-4 h-4" />
              </Link>
            </nav>
          )}
        </div>

        {/* Right Side: Market Clock & User Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Live Status and Clock (Desktop) */}
          <div className="hidden xl:flex items-center gap-4 text-xs text-zinc-400 mr-2 bg-black/20 px-4 py-1.5 rounded-full border border-white/5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                {isOpen && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-up-green opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOpen ? 'bg-up-green' : 'bg-down-red'}`}></span>
              </span>
              <span className="font-bold tracking-wide">
                {isOpen ? (t('sessionStatus.open') || 'Session Open') : (t('sessionStatus.closed') || 'Session Closed')}
              </span>
            </div>
            <div className="w-[1px] h-3 bg-white/10" />
            <div className="flex items-center gap-1.5 font-mono font-bold text-zinc-300">
              <Clock className="w-4 h-4 text-accent-blue" />
              <span>{formattedTime}</span>
              <span className="text-[10px] text-zinc-500">({t('clockCairo') || 'Cairo'})</span>
            </div>
          </div>

          {/* Language Switcher */}
          <button
            onClick={toggleLocale}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5 transition-all duration-200 cursor-pointer"
            title={isAr ? 'Switch to English' : 'تحويل للغة العربية'}
          >
            <Globe className="w-4 h-4 text-accent-blue" />
            <span>{isAr ? 'EN' : 'عربي'}</span>
          </button>

          {/* User Profile & LogOut */}
          {session ? (
            <div className="flex items-center gap-3 border-l border-white/10 pl-3">
              {/* Notification Bell */}
              <button 
                className="p-2 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer relative"
                title={isAr ? 'التنبيهات' : 'Notifications'}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-blue rounded-full border-2 border-[#0B0F19]"></span>
              </button>

              {/* Username display */}
              <div className="hidden md:flex flex-col text-right ml-1 mr-2">
                <span className="text-[10px] text-zinc-500 font-medium leading-none">{isAr ? 'مرحباً،' : 'Welcome,'}</span>
                <span className="text-sm font-black text-white max-w-[100px] truncate leading-tight mt-0.5">{userName}</span>
              </div>

              {/* User Avatar / Profile Icon */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-blue to-purple-600 p-[1.5px] select-none shadow-lg shadow-accent-blue/20">
                <div className="w-full h-full bg-surface-dark rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="p-2 hover:bg-down-red/10 hover:text-down-red rounded-xl text-zinc-400 transition-colors cursor-pointer ml-1"
                title={isAr ? 'خروج' : 'Sign Out'}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            pathname !== `/${locale}/auth` && (
              <Button onClick={() => router.push(`/${locale}/auth`)}>
                {isAr ? 'تسجيل الدخول' : 'Sign In'}
              </Button>
            )
          )}
        </div>
      </div>
      
      {/* Mobile Clock & Status Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-black/40 border-t border-white/5 text-[11px] text-zinc-400 font-mono">
        <span className="font-bold flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-up-green animate-pulse' : 'bg-down-red'}`} />
          {isOpen ? (t('sessionStatus.open') || 'Session Open') : (t('sessionStatus.closed') || 'Session Closed')}
        </span>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-accent-blue" />
          <span className="text-white font-bold">{formattedTime}</span>
        </div>
      </div>

      {/* Mobile Navigation Links */}
      {session && (
        <div className="lg:hidden flex items-center justify-between border-t border-white/5 px-4 py-2 bg-surface-elevated/90 backdrop-blur-xl text-[10px] font-bold text-zinc-400 overflow-x-auto gap-4 scrollbar-none">
          {navLinks.map((link) => {
            const isActive = link.exact 
              ? pathname === link.href 
              : pathname.includes(link.href.split('/').pop()!);

            return (
              <Link 
                key={link.href}
                href={link.href} 
                className={`flex flex-col items-center gap-1 min-w-[50px] transition-colors ${isActive ? 'text-white' : 'hover:text-white'}`}
              >
                <link.icon className={`w-5 h-5 ${link.color || ''} ${isActive && !link.color ? 'text-accent-blue' : ''}`} />
                <span className={isActive ? 'text-accent-blue' : ''}>{link.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </header>
  );
}
