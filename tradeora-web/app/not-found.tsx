import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0D1B2A] flex flex-col items-center justify-center p-6 text-center">

      {/* Logo */}
      <Image
        src="/logo.png"
        alt="TRADEORA"
        width={160}
        height={52}
        className="mb-8 opacity-80"
      />

      {/* 404 */}
      <div className="relative mb-6">
        <p
          className="text-[120px] font-black leading-none select-none animate-pulse"
          style={{
            background: 'linear-gradient(135deg, #C9A84C, #F0D080, #A07830)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          404
        </p>
        <p className="absolute inset-0 flex items-center justify-center text-[120px] font-black leading-none blur-2xl opacity-20 text-yellow-500 select-none">
          404
        </p>
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">
        الصفحة غير موجودة
      </h1>
      <p className="text-slate-400 mb-8 max-w-sm">
        يبدو أن هذا السهم خرج من البورصة 😅
        الصفحة التي تبحث عنها غير موجودة
      </p>

      {/* Animated Chart Line */}
      <div className="w-64 h-16 mb-8 relative">
        <svg viewBox="0 0 256 64" className="w-full h-full">
          <polyline
            points="0,50 40,30 80,45 120,10 160,25 200,5 256,20"
            fill="none"
            stroke="url(#goldLine)"
            strokeWidth="2"
            className="animate-pulse"
          />
          <defs>
            <linearGradient id="goldLine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C9A84C" stopOpacity="0" />
              <stop offset="50%" stopColor="#F0D080" />
              <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="flex gap-3">
        <Link
          href="/"
          className="px-6 py-3 rounded-xl font-bold text-[#0D1B2A] transition hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#C9A84C,#A07830)' }}
        >
          🏠 الصفحة الرئيسية
        </Link>
        <Link
          href="/ar/screener"
          className="px-6 py-3 rounded-xl font-bold border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 transition-all"
        >
          🔍 استكشف الأسهم
        </Link>
      </div>
    </div>
  );
}
