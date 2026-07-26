'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  X, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'tp_hit' | 'sl_hit' | 'disclosure' | 'macro';
  symbol?: string;
  time: string;
  read: boolean;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export function NotificationCenter({ isOpen, onClose, locale }: NotificationCenterProps) {
  const isAr = locale === 'ar';
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch real recent disclosures and notifications
    fetch('/api/news?limit=5')
      .then(res => res.json())
      .then(data => {
        if (data?.success && Array.isArray(data.news) && data.news.length > 0) {
          const items: NotificationItem[] = data.news.map((n: any, idx: number) => ({
            id: n.id || String(idx),
            title: isAr ? `📋 إفصاح رسمى: ${n.title}` : `Disclosure: ${n.title}`,
            message: n.content ? (n.content.slice(0, 90) + '...') : (isAr ? 'تابع تفاصيل الإفصاح المباشر بالمنصة' : 'View disclosure details'),
            type: 'disclosure',
            time: isAr ? 'أحدث إفصاح' : 'Latest',
            read: false
          }));
          setNotifications(items);
        } else {
          setNotifications([]);
        }
      })
      .catch(err => {
        console.error('Error fetching notifications:', err);
        setNotifications([]);
      })
      .finally(() => setLoading(false));
  }, [isOpen, isAr]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="absolute left-4 top-16 w-80 sm:w-96 z-50 glass-card p-4 rounded-2xl shadow-2xl border border-cyan-500/30 text-slate-100 font-sans"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Bell className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-white">
              {isAr ? 'الإشعارات والتنبيهات الحية' : 'Live Notifications'}
            </h3>
            {unreadCount > 0 && (
              <Badge className="bg-cyan-500 text-slate-950 font-bold text-[10px] px-1.5 py-0.2">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
              >
                {isAr ? 'تحديد الكل كمقروء' : 'Mark all read'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
          {loading ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              {isAr ? 'جاري التحقق من التنبيهات الحية...' : 'Checking live alerts...'}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Bell className="w-8 h-8 text-slate-500 opacity-40" />
              <span>{isAr ? 'لا توجد أهداف أرباح جديدة محققة الآن (البورصة مغلقة مغلق الجلسة)' : 'No new notifications right now (Market Closed)'}</span>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition-all flex flex-col gap-1.5 ${
                  item.read 
                    ? 'bg-slate-900/40 border-white/5 opacity-80' 
                    : 'bg-cyan-500/10 border-cyan-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-white leading-snug">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {item.time}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-normal">
                  {item.message}
                </p>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
