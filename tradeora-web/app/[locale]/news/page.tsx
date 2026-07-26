'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  Newspaper, 
  Globe, 
  Building2, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Sparkles, 
  ExternalLink,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';

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

export default function NewsHubPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'corporate' | 'macro_fx'>('all');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/news?category=${activeTab}&limit=40`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNews(data.news || []);
        }
      })
      .catch(err => console.error('Error fetching news hub:', err))
      .finally(() => setLoading(false));
  }, [activeTab]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-EG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getImpactBadge = (item: NewsItem) => {
    const score = item.impact_score || 0;
    if (score >= 0.25 || item.sentiment === 'positive') {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-bold">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>تأثير إيجابي 🟩</span>
        </Badge>
      );
    } else if (score <= -0.25 || item.sentiment === 'negative') {
      return (
        <Badge className="bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1 font-bold">
          <TrendingDown className="w-3.5 h-3.5" />
          <span>تأثير سلبي 🔴</span>
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-bold">
        <Minus className="w-3.5 h-3.5" />
        <span>تأثير محايد 🟡</span>
      </Badge>
    );
  };

  return (
    <div className="w-full font-sans text-slate-100 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Top Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4"
      >
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3 mb-2">
            <span className="p-2 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <Newspaper className="w-7 h-7" />
            </span>
            <span>مركز الأخبار والإفصاحات والتحليل الذكي</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            متابعة حية وشاملة لإفصاحات البورصة المصرية، الأخبار الاقتصادية الكلية، الفائدة، والتوترات الجيوسياسية المرفقة بشرح الذكاء الاصطناعي لكشف تأثير كل خبر على حركة الأسهم.
          </p>
        </div>

        {/* Category Pill Tabs */}
        <div className="flex p-1 bg-slate-900/80 border border-white/10 rounded-2xl backdrop-blur-md">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'all' ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25' : 'text-slate-400 hover:text-white'
            }`}
          >
            جميع الأخبار الإفصاحات
          </button>
          <button
            onClick={() => setActiveTab('corporate')}
            className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'corporate' ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25' : 'text-slate-400 hover:text-white'
            }`}
          >
            إفصاحات الشركات
          </button>
          <button
            onClick={() => setActiveTab('macro_fx')}
            className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'macro_fx' ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25' : 'text-slate-400 hover:text-white'
            }`}
          >
            اقتصاد كلي وجيوسياسي
          </button>
        </div>
      </motion.div>

      {/* Disclosures Countdown Highlight Banner */}
      <Card className="p-6 mb-8 glass-panel border-l-4 border-l-cyan-400">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Calendar className="w-6 h-6" />
            </span>
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">أجندة الإفصاحات الرسمية القادمة</span>
              <h3 className="text-base font-black text-white mt-0.5">
                متابعة مواعيد نتائج الأعمال Q2 وتوزيعات الأرباح للشركات النشطة
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-3 font-mono">
            <span className="text-xs text-slate-400">توقع قبل الإفصاح ⏳</span>
            <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-cyan-400 border border-cyan-500/20 text-xs font-bold">
              تحديث آلي مستمر
            </span>
          </div>
        </div>
      </Card>

      {/* Main News List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 w-full bg-white/5 rounded-2xl" />
          <Skeleton className="h-48 w-full bg-white/5 rounded-2xl" />
          <Skeleton className="h-48 w-full bg-white/5 rounded-2xl" />
          <Skeleton className="h-48 w-full bg-white/5 rounded-2xl" />
        </div>
      ) : news.length === 0 ? (
        <Card className="p-12 text-center glass-panel">
          <Newspaper className="w-16 h-16 text-slate-500 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-white mb-2">لا توجد أخبار مسجلة في التبويب الحالي</h3>
          <p className="text-xs text-slate-400">يتم سحب وتحديث الأخبار والإفصاحات من البورصة المصرية ومصادر الأخبار المالية تلقائياً.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {news.map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6 glass-card h-full flex flex-col justify-between gap-4 group">
                <div className="flex flex-col gap-3">
                  {/* Top Bar: Category & Impact */}
                  <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-3">
                    <span className="text-[11px] font-extrabold px-3 py-1 rounded-xl bg-slate-800 text-cyan-400 border border-cyan-500/20">
                      {item.sector_name ? `📰 قطاع ${item.sector_name}` : (item.category === 'macro_fx' ? '🌍 اقتصاد كلي وجيوسياسي' : '🏢 إفصاح رسمى للشركة')}
                    </span>
                    <div>{getImpactBadge(item)}</div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-black text-white group-hover:text-cyan-300 transition-colors leading-snug">
                    {item.title}
                  </h3>

                  {/* Content snippet */}
                  {item.content && (
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {item.content}
                    </p>
                  )}

                  {/* AI Explanation Box */}
                  {item.expected_impact_ar && (
                    <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 leading-normal flex items-start gap-3 mt-1">
                      <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-black text-white block mb-1">💡 شرح التأثير للمستثمر:</span>
                        <span>{item.expected_impact_ar}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Metadata */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-white/5 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(item.published_at)}
                  </span>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-cyan-400 hover:underline font-bold"
                    >
                      <span>قراءة المصدر</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
