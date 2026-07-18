'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Star } from 'lucide-react';

interface Props {
  companyId: string;
  symbol:    string;
}

export function WatchlistButton({ companyId, symbol }: Props) {
  const [watching, setWatching] = useState(false);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    checkWatchlist();
  }, [companyId]);

  async function checkWatchlist() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('watchlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .maybeSingle();
      setWatching(!!data);
    } catch (e) {
      console.error('Error checking watchlist status:', e);
    }
  }

  async function toggle() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('سجّل دخولك أولاً لتفعيل قائمة المراقبة');
        setLoading(false);
        return;
      }
      if (watching) {
        await supabase.from('watchlists')
          .delete()
          .eq('user_id', user.id)
          .eq('company_id', companyId);
        setWatching(false);
      } else {
        await supabase.from('watchlists')
          .insert([{ user_id: user.id, company_id: companyId, symbol }]);
        setWatching(true);
      }
    } catch (e) {
      console.error('Error toggling watchlist status:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
        watching
          ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/30'
          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Star className={`w-3.5 h-3.5 ${watching ? 'fill-yellow-400 text-yellow-400' : ''}`} />
      <span>{loading ? '...' : watching ? 'في المراقبة' : 'أضف للمراقبة'}</span>
    </button>
  );
}
