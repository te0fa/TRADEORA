'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, X } from 'lucide-react';

interface Props {
  companyId:    string;
  symbol:       string;
  currentPrice: number;
  locale:       string;
  onClose:      () => void;
}

export function PriceAlertModal({
  companyId, symbol, currentPrice,
  locale, onClose
}: Props) {
  const [price, setPrice]     = useState(currentPrice);
  const [condition, setCond]  = useState<'above' | 'below'>('above');
  const [saving, setSaving]   = useState(false);
  const isAr = locale === 'ar';

  async function save() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert(isAr ? 'سجّل دخولك أولاً لضبط التنبيهات' : 'Please log in first to set alerts');
        setSaving(false);
        return;
      }

      const { error } = await supabase.from('price_alerts').insert([{
        user_id:      user.id,
        company_id:   companyId,
        symbol,
        target_price: price,
        condition,
      }]);

      if (error) throw error;

      alert(isAr ? `✅ تم ضبط التنبيه عند ${price} EGP` : `✅ Alert set successfully at ${price} EGP`);
      onClose();
    } catch (e) {
      console.error('Error saving price alert:', e);
      alert(isAr ? '❌ فشل ضبط التنبيه، تأكد من تسجيل الدخول' : '❌ Failed to set alert, check authentication');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1E293B] rounded-2xl p-6 border border-white/10 w-80 shadow-2xl relative font-sans text-text-primary" onClick={e => e.stopPropagation()}>
        
        <button onClick={onClose} className="absolute top-4 left-4 text-slate-400 hover:text-white transition cursor-pointer">
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
          <Bell className="w-4 h-4 text-accent-blue" />
          <span>{isAr ? 'ضبط تنبيه سعر' : 'Set Price Alert'}</span>
        </h3>
        
        <p className="text-slate-400 text-xs mb-4">
          {symbol} — {isAr ? `السعر الحالي: ${currentPrice.toFixed(2)} EGP` : `Current Price: ${currentPrice.toFixed(2)} EGP`}
        </p>

        {/* Condition selection */}
        <div className="flex gap-2 mb-4">
          {(['above', 'below'] as const).map(c => (
            <button key={c}
              type="button"
              onClick={() => setCond(c)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                condition === c
                  ? c === 'above'
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : 'bg-red-500/20 border-red-500/50 text-red-400'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              {c === 'above'
                ? (isAr ? '▲ فوق' : '▲ Above')
                : (isAr ? '▼ تحت' : '▼ Below')}
            </button>
          ))}
        </div>

        {/* Price Input */}
        <div className="mb-4">
          <label className="text-[10px] text-slate-400 mb-1 block">
            {isAr ? 'السعر المستهدف (EGP)' : 'Target Price (EGP)'}
          </label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={e => setPrice(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-accent-blue outline-none text-base font-mono text-center"
          />
        </div>

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 text-xs font-bold transition cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs disabled:opacity-50 transition-all cursor-pointer"
          >
            {saving ? '...' : (isAr ? '🔔 تفعيل' : '🔔 Set Alert')}
          </button>
        </div>
      </div>
    </div>
  );
}
