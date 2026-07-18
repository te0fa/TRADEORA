'use client';

import Image from 'next/image';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="min-h-screen bg-[#0D1B2A] flex flex-col items-center justify-center p-6 text-center">

      <Image
        src="/logo.png"
        alt="TRADEORA"
        width={160}
        height={52}
        className="mb-8 opacity-80"
      />

      <div className="text-6xl mb-4 animate-bounce">⚠️</div>

      <h1 className="text-2xl font-bold text-white mb-2">
        حدث خطأ غير متوقع
      </h1>
      <p className="text-slate-400 mb-2 max-w-sm">
        وقف الخسارة تفعّل على الصفحة دي 😅
        ولكن لا تقلق، النظام بيحاول يتعافى
      </p>
      <p className="text-slate-500 text-xs mb-8 font-mono max-w-sm bg-black/20 p-3 rounded-lg border border-white/5 break-all">
        {error.message || 'Unknown internal system error'}
      </p>

      <button
        onClick={reset}
        className="px-6 py-3 rounded-xl font-bold text-[#0D1B2A] transition hover:opacity-90 cursor-pointer shadow-lg shadow-[#C9A84C]/15"
        style={{ background: 'linear-gradient(135deg,#C9A84C,#A07830)' }}
      >
        🔄 حاول مرة أخرى
      </button>
    </div>
  );
}
