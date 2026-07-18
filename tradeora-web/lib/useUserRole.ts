'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useUserRole() {
  const [role, setRole] = useState<'user' | 'premium' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setRole('user');
          return;
        }

        const { data, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;
        setRole(data?.role ?? 'user');
      } catch (err) {
        console.error('Error fetching user role:', err);
        setRole('user');
      } finally {
        setLoading(false);
      }
    }
    checkRole();
  }, []);

  const isPremium = role === 'premium' || role === 'admin';
  const isAdmin   = role === 'admin';

  return { role, isPremium, isAdmin, loading };
}
