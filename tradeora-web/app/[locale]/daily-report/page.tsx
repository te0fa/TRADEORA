'use client';

import React, { useEffect, useState } from 'react';
import { DailyReportView } from '@/components/report/DailyReportView';
import { useLocale } from 'next-intl';

export default function DailyReportPage() {
  const locale = useLocale();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await fetch('/api/daily-report');
        const data = await res.json();
        setReportData(data);
      } catch (e) {
        console.error('Failed to load daily report:', e);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, []);

  if (loading) {
    return (
      <div className="w-full py-32 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-white/10 border-t-accent-blue rounded-full animate-spin" />
        <span className="text-sm text-text-secondary font-medium">
          {locale === 'ar' ? 'جاري إعداد التقرير اليومي وتجميع الصفقات والفرص...' : 'Compiling EOD Daily Trade Report...'}
        </span>
      </div>
    );
  }

  if (!reportData || reportData.error) {
    return (
      <div className="w-full py-20 text-center text-text-secondary">
        <p>{locale === 'ar' ? 'عفواً، لم يتم العثور على تقرير تداول اليوم.' : 'Failed to load today report.'}</p>
      </div>
    );
  }

  return <DailyReportView data={reportData} />;
}
