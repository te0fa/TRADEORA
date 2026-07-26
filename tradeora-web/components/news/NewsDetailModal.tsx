'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { 
  X, 
  ExternalLink, 
  Clock, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Newspaper
} from 'lucide-react';

interface NewsDetailModalProps {
  news: any | null;
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export function NewsDetailModal({ news, isOpen, onClose, locale }: NewsDetailModalProps) {
  const isAr = locale === 'ar';

  if (!isOpen || !news) return null;

  const getImpactBadge = () => {
    const score = news.impact_score || 0;
    if (score >= 0.25 || news.sentiment === 'positive') {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-bold">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{isAr ? 'تأثير إيجابي 🟩' : 'Positive Impact'}</span>
        </Badge>
      );
    } else if (score <= -0.25 || news.sentiment === 'negative') {
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
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl glass-card rounded-3xl p-6 flex flex-col gap-5 border border-cyan-500/30 text-slate-100 max-h-[90vh] overflow-y-auto font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <Newspaper className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-400 border border-cyan-500/20">
              {news.category === 'macro_fx' 
                ? (isAr ? '🌍 اقتصاد كلي وجيوسياسي' : 'Macro & Geopolitics') 
                : news.category === 'corporate' 
                  ? (isAr ? '🏢 إفصاح رسمى للشركة' : 'Corporate Disclosure')
                  : (isAr ? '🏗️ أخبار القطاع' : 'Sector News')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {getImpactBadge()}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-black text-white leading-snug">
          {news.title}
        </h2>

        {/* Timestamp & Source */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono border-b border-white/5 pb-3">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            {formatDate(news.published_at)}
          </span>
          <span>{isAr ? `المصدر: ${news.source || 'البورصة المصرية'}` : `Source: ${news.source}`}</span>
        </div>

        {/* Full Content */}
        {news.content && (
          <div className="text-sm text-slate-200 leading-relaxed bg-slate-900/40 p-4 rounded-2xl border border-white/5">
            {news.content}
          </div>
        )}

        {/* AI Impact Explanation */}
        {news.expected_impact_ar && (
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 leading-relaxed flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-white block mb-1 text-sm">
                💡 {isAr ? 'شرح وتحليل الذكاء الاصطناعي لتأثير الخبر على السهم للمستثمر:' : 'AI Impact Analysis:'}
              </span>
              <span>{news.expected_impact_ar}</span>
            </div>
          </div>
        )}

        {/* Source Link Footer */}
        {news.url && (
          <div className="pt-2 flex justify-end">
            <a
              href={news.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-all flex items-center gap-2"
            >
              <span>{isAr ? 'زيارة رابط الخبر الأصلي' : 'Visit Original Source'}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
