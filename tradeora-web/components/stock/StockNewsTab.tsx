'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Newspaper, ExternalLink, TrendingUp, TrendingDown, Minus, Clock, ShieldAlert, Sparkles } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  content: string | null;
  published_at: string;
  source: string;
  url: string;
  category: string;
  sentiment: string;
  confidence: number;
  expected_impact_ar: string | null;
  impact_score: number | null;
  sector_name: string | null;
}

interface StockNewsTabProps {
  symbol: string;
  companyId?: string;
  locale: string;
}

export function StockNewsTab({ symbol, companyId, locale }: StockNewsTabProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isAr = locale === 'ar';

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    fetch(`/api/news?symbol=${encodeURIComponent(symbol)}&limit=15`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNews(data.news || []);
        }
      })
      .catch(err => console.error('Error loading stock news:', err))
      .finally(() => setLoading(false));
  }, [symbol]);

  const getImpactBadge = (item: NewsItem) => {
    const score = item.impact_score || 0;
    if (score >= 0.25 || item.sentiment === 'positive') {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-bold">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{isAr ? 'تأثير إيجابي 🟩' : 'Positive Impact'}</span>
        </Badge>
      );
    } else if (score <= -0.25 || item.sentiment === 'negative') {
      return (
        <Badge className="bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1 font-bold">
          <TrendingDown className="w-3.5 h-3.5" />
          <span>{isAr ? 'تأثير سلبي 🔴' : 'Negative Impact'}</span>
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-bold">
        <Minus className="w-3.5 h-3.5" />
        <span>{isAr ? 'تأثير محايد 🟡' : 'Neutral Impact'}</span>
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-24 w-full bg-white/5 rounded-2xl" />
        <Skeleton className="h-24 w-full bg-white/5 rounded-2xl" />
        <Skeleton className="h-24 w-full bg-white/5 rounded-2xl" />
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <Card className="p-8 text-center glass-panel">
        <Newspaper className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-60" />
        <h3 className="text-base font-bold text-white mb-1">
          {isAr ? `لا توجد إفصاحات أو أخبار حديثة مسجلة لـ ${symbol}` : `No recent disclosures for ${symbol}`}
        </h3>
        <p className="text-xs text-slate-400">
          {isAr ? 'يتم متابعة إفصاحات البورصة المصرية ومصادر الأخبار المالية لحظياً.' : 'Monitoring EGX official disclosures in real time.'}
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4 font-sans text-slate-100">
      <div className="flex items-center justify-between px-1 mb-1">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <span>{isAr ? `الأخبار والإفصاحات وتأثيرها الذكي على ${symbol}` : `AI News & Disclosures for ${symbol}`}</span>
        </h3>
        <span className="text-xs text-slate-400 font-mono">
          {news.length} {isAr ? 'خبر / إفصاح' : 'items'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {news.map((item) => (
          <Card key={item.id} className="p-5 glass-card flex flex-col gap-3 relative overflow-hidden group">
            {/* Header / Category & Impact */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-400 border border-cyan-500/20">
                  {item.category === 'macro_fx' 
                    ? (isAr ? '🌍 اقتصاد وسياسة' : 'Macro & Geopolitics') 
                    : item.category === 'corporate' 
                      ? (isAr ? '🏢 إفصاح شركة' : 'Corporate Disclosure')
                      : (isAr ? '🏗️ أخبار القطاع' : 'Sector News')}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(item.published_at)}
                </span>
              </div>
              <div>{getImpactBadge(item)}</div>
            </div>

            {/* Title & Content */}
            <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
              {item.title}
            </h4>

            {item.content && (
              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                {item.content}
              </p>
            )}

            {/* AI Explanation of Expected Impact */}
            {item.expected_impact_ar && (
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 leading-normal flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block mb-0.5">
                    {isAr ? '💡 شرح تأثير الخبر على السهم للمستثمر:' : 'AI Impact Explanation:'}
                  </span>
                  <span>{item.expected_impact_ar}</span>
                </div>
              </div>
            )}

            {/* Footer Source Link */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
              <span>{isAr ? `المصدر: ${item.source}` : `Source: ${item.source}`}</span>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-cyan-400 hover:underline font-bold"
                >
                  <span>{isAr ? 'قراءة الخبر الاصلي' : 'Read Full Source'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
