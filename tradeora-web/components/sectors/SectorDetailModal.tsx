'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  X, 
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface SectorDetailModalProps {
  sector: any | null;
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export function SectorDetailModal({ sector, isOpen, onClose, locale }: SectorDetailModalProps) {
  const isAr = locale === 'ar';
  const [sectorStocks, setSectorStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sector?.sector) return;
    setLoading(true);
    fetch(`/api/screener`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const matched = data.filter((s: any) => s.sector === sector.sector);
          setSectorStocks(matched);
        }
      })
      .catch(err => console.error('Error fetching sector stocks:', err))
      .finally(() => setLoading(false));
  }, [sector]);

  if (!isOpen || !sector) return null;

  const formattedAvgChange = (sector.avg_change ?? 0) >= 0 
    ? `+${(sector.avg_change ?? 0).toFixed(2)}%` 
    : `${(sector.avg_change ?? 0).toFixed(2)}%`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-3xl glass-card rounded-3xl p-6 flex flex-col gap-5 border border-cyan-500/30 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <Building2 className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-black text-white">{sector.sector}</h2>
              <span className="text-xs text-slate-400">
                {isAr ? `${sector.total} سهم نشط بالقطاع` : `${sector.total} Active Stocks`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={(sector.avg_change ?? 0) >= 0 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}>
              {formattedAvgChange}
            </Badge>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sector Quick Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col items-center">
            <span className="text-xs text-slate-400 font-bold">{isAr ? 'الأسهم الصاعدة' : 'Rising'}</span>
            <span className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{sector.rising} 🟢</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col items-center">
            <span className="text-xs text-slate-400 font-bold">{isAr ? 'الأسهم الهابطة' : 'Falling'}</span>
            <span className="text-lg font-bold text-rose-400 font-mono mt-0.5">{sector.falling} 🔴</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col items-center">
            <span className="text-xs text-slate-400 font-bold">{isAr ? 'نسبة نجاح التوصيات' : 'Win Rate'}</span>
            <span className="text-lg font-bold text-cyan-400 font-mono mt-0.5">{sector.win_rate ?? 65}%</span>
          </div>
        </div>

        {/* Sector Stocks List */}
        <div>
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>{isAr ? `أسهم قطاع ${sector.sector}` : `Stocks in ${sector.sector}`}</span>
          </h3>

          {loading ? (
            <div className="p-6 text-center text-slate-400 text-xs">{isAr ? 'جاري تحميل الأسهم...' : 'Loading stocks...'}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
              {sectorStocks.map(stock => {
                const stockChangeStr = (stock.change ?? 0) >= 0 ? `+${(stock.change ?? 0).toFixed(2)}%` : `${(stock.change ?? 0).toFixed(2)}%`;
                return (
                  <Link
                    key={stock.id}
                    href={`/${locale}/stock/${stock.symbol}`}
                    onClick={onClose}
                    className="p-3 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-cyan-500/40 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors block">
                        {stock.symbol}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate max-w-[140px] block">
                        {stock.name_ar}
                      </span>
                    </div>
                    <div className="text-left font-mono">
                      <span className="text-xs font-extrabold text-white block">
                        {stock.price} ج.م
                      </span>
                      <span className={`text-[11px] font-bold ${stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {stockChangeStr}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
