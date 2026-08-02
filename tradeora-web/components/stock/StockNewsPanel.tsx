'use client';

import React, { useEffect, useState } from 'react';
import { Newspaper, TrendingUp, TrendingDown, Minus, ExternalLink, ShieldAlert, Sparkles } from 'lucide-react';
import { useLocale } from 'next-intl';

interface NewsItem {
  id: string;
  title: string;
  published_at: string;
  source: string;
  url?: string;
  source_url?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  impact_score: number;
  expected_impact_ar?: string;
  category: string;
  symbol?: string | null;
}

interface StockNewsPanelProps {
  companyId: string;
  symbol?: string;
}

export function StockNewsPanel({ companyId, symbol }: StockNewsPanelProps) {
  const locale = useLocale();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNews() {
      setLoading(true);
      try {
        let url = `/api/news?companyId=${companyId}&limit=10`;
        if (symbol) url = `/api/news?symbol=${symbol}&limit=10`;
        
        const res = await fetch(url);
        const data = await res.json();
        const items = data.news || [];
        setNews(items);
      } catch (e) {
        console.error('Failed to load stock news', e);
        setNews([]);
      } finally {
        setLoading(false);
      }
    }
    if (companyId || symbol) loadNews();
  }, [companyId, symbol]);

  if (loading) {
    return (
      <div className="glass-card p-6 rounded-2xl animate-pulse mb-6">
        <div className="h-6 w-48 bg-white/10 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-20 bg-white/5 rounded" />
          <div className="h-20 bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  if (!news || news.length === 0) {
    return (
      <div className="glass-card p-6 rounded-2xl mb-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-accent-blue/10 border border-accent-blue/20">
            <Newspaper className="w-5 h-5 text-accent-blue" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {locale === 'ar' ? 'الأخبار والإفصاحات' : 'News & Disclosures'}
          </h3>
        </div>
        <p className="text-sm text-zinc-500 text-center py-6">
          {locale === 'ar' ? 'لا توجد أخبار مسجلة لهذا السهم حالياً.' : 'No news found for this stock.'}
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-2xl mb-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-accent-blue/10 border border-accent-blue/20">
            <Newspaper className="w-5 h-5 text-accent-blue" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">
              {locale === 'ar' ? 'الأخبار والإفصاحات والتحليل الذكي' : 'AI News & Sentiment Intelligence'}
            </h3>
            <p className="text-xs text-text-secondary">
              {locale === 'ar' ? 'تتبع الأخبار والإفصاحات ورصد التأثير المتوقع على حركة السهم' : 'Live news sentiment and expected price impact prediction'}
            </p>
          </div>
        </div>
        <span className="text-xs text-zinc-500 font-mono">{news.length} {locale === 'ar' ? 'خبر' : 'items'}</span>
      </div>

      <div className="space-y-4">
        {news.map((item) => {
          const isPos = item.sentiment === 'positive';
          const isNeg = item.sentiment === 'negative';
          const newsUrl = item.url || item.source_url || '#';

          return (
            <div
              key={item.id || newsUrl}
              className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col gap-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                {newsUrl !== '#' ? (
                  <a
                    href={newsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-sm text-text-primary hover:text-accent-blue transition-colors flex items-center gap-1.5"
                  >
                    {item.title}
                    <ExternalLink className="w-3.5 h-3.5 text-text-secondary flex-shrink-0" />
                  </a>
                ) : (
                  <span className="font-bold text-sm text-text-primary">{item.title}</span>
                )}

                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 flex-shrink-0 ${
                    isPos
                      ? 'bg-up-green/10 text-up-green border border-up-green/20'
                      : isNeg
                      ? 'bg-down-red/10 text-down-red border border-down-red/20'
                      : 'bg-white/5 text-text-secondary border border-white/10'
                  }`}
                >
                  {isPos ? (
                    <>
                      <TrendingUp className="w-3.5 h-3.5" />
                      {locale === 'ar' ? 'إيجابي' : 'Positive'}
                    </>
                  ) : isNeg ? (
                    <>
                      <TrendingDown className="w-3.5 h-3.5" />
                      {locale === 'ar' ? 'سلبي' : 'Negative'}
                    </>
                  ) : (
                    <>
                      <Minus className="w-3.5 h-3.5" />
                      {locale === 'ar' ? 'محايد' : 'Neutral'}
                    </>
                  )}
                </span>
              </div>

              {item.expected_impact_ar && (
                <div className="flex items-start gap-2 text-xs bg-accent-blue/[0.04] border border-accent-blue/15 px-3 py-2 rounded-lg text-accent-blue">
                  <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black text-white block mb-0.5">💡 شرح التأثير:</span>
                    <span className="font-medium leading-relaxed">{item.expected_impact_ar}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                <span>
                  {item.source === 'egx' ? '🏛️ البورصة المصرية' :
                   item.source === 'almal' ? '📰 جريدة المال' :
                   item.source === 'mubasher' ? '📊 مباشر مصر' :
                   item.source === 'enterprise' ? '⚡ إنتربرايز' : item.source}
                </span>
                <span>{item.published_at ? new Date(item.published_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
