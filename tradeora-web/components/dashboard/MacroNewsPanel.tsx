'use client';

import React, { useEffect, useState } from 'react';
import { Globe, ShieldAlert, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
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

export function MacroNewsPanel() {
  const locale = useLocale();
  const [macroNews, setMacroNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMacroNews() {
      try {
        const res = await fetch('/api/news-sentiment');
        const data = await res.json();
        setMacroNews(data.macro_news || data.news || []);
      } catch (e) {
        console.error('Failed to load macro news', e);
      } finally {
        setLoading(false);
      }
    }
    loadMacroNews();
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-6 rounded-2xl animate-pulse mb-6">
        <div className="h-6 w-56 bg-white/10 rounded mb-4" />
        <div className="h-24 bg-white/5 rounded" />
      </div>
    );
  }

  if (!macroNews || macroNews.length === 0) return null;

  return (
    <div className="glass-card p-6 rounded-2xl mb-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-accent-gold/10 border border-accent-gold/20">
            <Globe className="w-5 h-5 text-accent-gold" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">
              {locale === 'ar' ? 'موجز الأخبار السياسية والجيوسياسية وأخبار الاقتصاد' : 'Macro & Geopolitical News Feed'}
            </h3>
            <p className="text-xs text-text-secondary">
              {locale === 'ar' ? 'رصد أحدث التطورات الإقليمية، صفقات الدولة، وأسعار الفائدة وتأثيرها على القطاعات' : 'Live tracking of regional war news, macro FX, and sector impacts'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {macroNews.slice(0, 6).map((item) => {
          const isPos = item.sentiment === 'positive';
          const isNeg = item.sentiment === 'negative';

          return (
            <div
              key={item.id || item.url}
              className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between gap-3"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold text-text-secondary bg-white/5 px-2 py-0.5 rounded border border-white/5">
                    {item.source}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                      isPos ? 'bg-up-green/10 text-up-green' : isNeg ? 'bg-down-red/10 text-down-red' : 'bg-white/5 text-text-secondary'
                    }`}
                  >
                    {isPos ? <TrendingUp className="w-3 h-3" /> : isNeg ? <TrendingDown className="w-3 h-3" /> : null}
                    {item.sentiment.toUpperCase()}
                  </span>
                </div>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-sm text-text-primary hover:text-accent-blue transition-colors flex items-center gap-1.5"
                >
                  {item.title}
                  <ExternalLink className="w-3.5 h-3.5 text-text-secondary flex-shrink-0" />
                </a>
              </div>

              {item.expected_impact_ar && (
                <div className="flex items-center gap-2 text-xs bg-accent-gold/[0.05] border border-accent-gold/20 px-3 py-2 rounded-lg text-accent-gold">
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
