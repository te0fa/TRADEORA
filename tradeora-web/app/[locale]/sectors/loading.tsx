import React from 'react';

export default function Loading() {
  return (
    <div className="w-full py-20 flex flex-col items-center justify-center gap-3 font-sans">
      <div className="w-8 h-8 border-3 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin"></div>
      <span className="text-xs text-slate-400">Analyzing sectors...</span>
    </div>
  );
}
