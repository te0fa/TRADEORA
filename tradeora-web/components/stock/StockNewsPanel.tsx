'use client';

import React, { useEffect, useState } from 'react';
import { Newspaper, TrendingUp, TrendingDown, Minus, ExternalLink, ShieldAlert } from 'lucide-react';
import { useLocale } from 'next-intl';

interface NewsItem {
  id: string;
  title: string;
  published_at: string;
  source: string;
  url: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  impact_score: number;
  expected_impact_ar?: string;
  category: string;
}

interface StockNewsPanelProps {
  companyId: string;
}

export function StockNewsPanel({ companyId }: StockNewsPanelProps) {
  const locale = useLocale();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNews() {
      try {
        const res = await fetch(`/api/news-sentiment?companyId=${companyId}`);
        const data = await res.json();
        setNews(data.news || []);
      } catch (e) {
        console.error('Failed to load stock news sentiment', e);
      } finally {
        setLoading(false);
      }
    }
    if (companyId) loadNews();
  }, [companyId]);

  if (loading) {
    return (
      <div className="glass-card p-6 rounded-2xl animate-pulse mb-6">
        <div className="h-6 w-48 bg-white/10 rounded mb-4" />
        <div className="h-20 bg-white/5 rounded" />
      </div>
    );
  }

  if (!news || news.length === 0) {
    return null;
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
              {locale === 'ar' ? 'التحليل الإخباري والذكاء الجيوسياسي' : 'AI News & Sentiment Intelligence'}
            </h3>
            <p className="text-xs text-text-secondary">
              {locale === 'ar' ? 'تتبع الصفقات والأخبار ورصد التأثير المتوقع على حركة السهم' : 'Live news sentiment and expected price impact prediction'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {news.slice(0, 4).map((item) => {
          const isPos = item.sentiment === 'positive';
          const isNeg = item.sentiment === 'negative';

          return (
            <div
              key={item.id || item.url}
              className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col gap-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-sm text-text-primary hover:text-accent-blue transition-colors flex items-center gap-1.5"
                >
                  {item.title}
                  <ExternalLink className="w-3.5 h-3.5 text-text-secondary flex-shrink-0" />
                </a>

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
                <div className="flex items-center gap-2 text-xs bg-accent-blue/[0.04] border border-accent-blue/15 px-3 py-2 rounded-lg text-accent-blue">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{item.expected_impact_ar}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
