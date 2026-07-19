'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { toEasternArabic } from '@/lib/formatters';

interface StockFundamentalsProps {
  fundamentals: {
    pe_ratio: number | null;
    eps: number | null;
    debt_equity: number | null;
    profit_margin: number | null;
    revenue_growth: number | null;
    earnings_growth: number | null;
    dividend_yield: number | null;
    book_value: number | null;
    fair_value: number | null;
    last_updated: string | null;
  } | null;
  currentPrice: number;
  locale: string;
}

export function StockFundamentals({ fundamentals, currentPrice, locale }: StockFundamentalsProps) {
  const isAr = locale === 'ar';

  if (!fundamentals) {
    return (
      <div className="glass-card p-6 rounded-2xl mb-6">
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <span>📊</span>
          <span>{isAr ? 'التحليل المالي الأساسي (Fundamentals)' : 'Financial Fundamentals'}</span>
        </h2>
        <p className="text-sm text-text-secondary text-center py-6">
          {isAr
            ? 'البيانات المالية الأساسية غير متوفرة حالياً لهذا السهم.'
            : 'Financial fundamental metrics are not available for this stock yet.'}
        </p>
      </div>
    );
  }

  const formatVal = (val: number | null, suffix = '', decimals = 2) => {
    if (val === null || val === undefined) return '-';
    const formatted = val.toFixed(decimals);
    return isAr ? `${toEasternArabic(formatted)}${suffix}` : `${formatted}${suffix}`;
  };

  const getPEStatus = (pe: number | null) => {
    if (pe === null) return null;
    if (pe <= 0) return { label: isAr ? 'سالب' : 'Negative', color: 'danger' };
    if (pe < 10) return { label: isAr ? 'ممتاز' : 'Excellent', color: 'success' };
    if (pe < 20) return { label: isAr ? 'متوسط' : 'Moderate', color: 'warning' };
    return { label: isAr ? 'مرتفع' : 'High', color: 'danger' };
  };

  const getDEStatus = (de: number | null) => {
    if (de === null) return null;
    if (de <= 0.5) return { label: isAr ? 'منخفض (آمن)' : 'Low (Safe)', color: 'success' };
    if (de <= 1.5) return { label: isAr ? 'متوسط' : 'Moderate', color: 'warning' };
    return { label: isAr ? 'مرتفع (مخاطرة)' : 'High (Risky)', color: 'danger' };
  };

  const getDividendStatus = (yieldVal: number | null) => {
    if (yieldVal === null || yieldVal === 0) return null;
    if (yieldVal >= 8) return { label: isAr ? 'توزيعات سخية جداً' : 'Superb Yield', color: 'success' };
    if (yieldVal >= 4) return { label: isAr ? 'توزيعات جذابة' : 'Attractive Yield', color: 'primary' };
    return { label: isAr ? 'توزيعات منخفضة' : 'Low Yield', color: 'glass' };
  };

  const getFairValueStatus = (fv: number | null, price: number) => {
    if (!fv || fv <= 0) return null;
    if (price < fv) {
      const discount = ((fv - price) / fv) * 100;
      return {
        label: isAr 
          ? `أقل من السعر العادل بـ ${discount.toFixed(0)}% (فرصة شراء)` 
          : `Undervalued by ${discount.toFixed(0)}% (Buy Opportunity)`,
        color: 'success'
      };
    } else {
      const premium = ((price - fv) / fv) * 100;
      return {
        label: isAr 
          ? `أعلى من السعر العادل بـ ${premium.toFixed(0)}%` 
          : `Overvalued by ${premium.toFixed(0)}%`,
        color: 'danger'
      };
    }
  };

  const calculatedPE = fundamentals.pe_ratio ?? (
    (fundamentals.eps && fundamentals.eps > 0 && currentPrice > 0)
      ? (currentPrice / fundamentals.eps)
      : null
  );

  const peStatus = getPEStatus(calculatedPE);
  const deStatus = getDEStatus(fundamentals.debt_equity);
  const divStatus = getDividendStatus(fundamentals.dividend_yield);
  const fvStatus = getFairValueStatus(fundamentals.fair_value, currentPrice);

  const metrics = [
    {
      title: isAr ? 'مكرر الربحية (P/E Ratio)' : 'P/E Ratio',
      value: formatVal(calculatedPE),
      status: peStatus,
      explanation: isAr
        ? 'يقيس النسبة بين سعر السهم السوقي الحالي وصافي أرباح السهم السنوية.'
        : 'Measures current stock price relative to its annual earnings per share.',
      impact: isAr
        ? 'المكرر المنخفض يدل على رخص السهم وتفضيل استثماري، والمكرر المرتفع جداً أو السالب قد يدل على تضخم سعري أو ضعف أرباح.'
        : 'Low ratio suggests undervaluation; high or negative indicates overvaluation or earnings stress.',
      icon: '🏷️'
    },
    {
      title: isAr ? 'ربحية السهم (EPS)' : 'Earnings Per Share (EPS)',
      value: formatVal(fundamentals.eps, ' EGP'),
      status: null,
      explanation: isAr
        ? 'حصة السهم الواحد من صافي أرباح الشركة المحققة خلال الفترة الماضية.'
        : 'The portion of a company\'s profit allocated to each outstanding share.',
      impact: isAr
        ? 'الارتفاع والنمو المستمر في ربحية السهم يدعم بشكل مباشر صعود السعر على المدى المتوسط والطويل.'
        : 'Consistent growth directly fuels medium-to-long term price appreciation.',
      icon: '💵'
    },
    {
      title: isAr ? 'نسبة الدين لحقوق الملكية (Debt/Equity)' : 'Debt to Equity',
      value: formatVal(fundamentals.debt_equity, '', 2),
      status: deStatus,
      explanation: isAr
        ? 'تقيس نسبة التمويل بالديون والقروض إلى حقوق مساهمي الشركة.'
        : 'Compares total liabilities/debts to shareholders\' equity.',
      impact: isAr
        ? 'النسبة المنخفضة تزيد من استقرار الشركة المالي في الأزمات، والنسبة المرتفعة تشكل ضغط فوائد يهدد الأرباح وسعر السهم.'
        : 'Lower ratio means stability; higher ratio signals leverage risk and interest expense pressure.',
      icon: '⚖️'
    },
    {
      title: isAr ? 'هامش الربح التشغيلي (Profit Margin)' : 'Operating Margin',
      value: formatVal(fundamentals.profit_margin, '%'),
      status: fundamentals.profit_margin && fundamentals.profit_margin > 20 ? { label: isAr ? 'ربحية قوية' : 'Highly Profitable', color: 'success' } : null,
      explanation: isAr
        ? 'النسبة المئوية لإجمالي الإيرادات المتبقية بعد دفع مصاريف التشغيل المتغيرة.'
        : 'The percentage of revenue left after paying for variable costs of production.',
      impact: isAr
        ? 'الهامش المرتفع يعكس كفاءة تشغيلية ممتازة وقدرة تسعيرية قوية تحمي السعر من تقلبات السوق.'
        : 'Higher margins display robust pricing power and operational efficiency.',
      icon: '📈'
    },
    {
      title: isAr ? 'معدل نمو الإيرادات (Revenue Growth)' : 'Revenue Growth',
      value: formatVal(fundamentals.revenue_growth, '%'),
      status: fundamentals.revenue_growth && fundamentals.revenue_growth > 10 ? { label: isAr ? 'نمو سريع' : 'Fast Growth', color: 'success' } : null,
      explanation: isAr
        ? 'معدل التغير في المبيعات والإيرادات السنوية للشركة مقارنة بالفترة السابقة.'
        : 'YoY percentage change in total revenues.',
      impact: isAr
        ? 'النمو الإيجابي يدل على توسع أعمال الشركة وحصتها السوقية مما يجذب السيولة ويرفع السعر.'
        : 'Positive growth demonstrates business expansion, drawing buyers to the stock.',
      icon: '🚀'
    },
    {
      title: isAr ? 'نمو الأرباح (Earnings Growth)' : 'Earnings Growth',
      value: formatVal(fundamentals.earnings_growth, '%'),
      status: fundamentals.earnings_growth && fundamentals.earnings_growth > 15 ? { label: isAr ? 'نمو ربحي ممتاز' : 'Great Growth', color: 'success' } : null,
      explanation: isAr
        ? 'معدل التغير السنوي لصافي أرباح الشركة بعد الضرائب والفوائد.'
        : 'YoY percentage change in net profits.',
      impact: isAr
        ? 'نمو صافي الأرباح هو المحرك الأساسي للقيمة الاستثمارية للسهم وصعوده المستمر.'
        : 'Net earnings growth is the key driver of fundamental equity value.',
      icon: '💰'
    },
    {
      title: isAr ? 'عائد التوزيعات (Dividend Yield)' : 'Dividend Yield',
      value: formatVal(fundamentals.dividend_yield, '%'),
      status: divStatus,
      explanation: isAr
        ? 'نسبة أرباح الأسهم الموزعة نقدياً سنوياً منسوبة إلى السعر الحالي للسهم.'
        : 'Annual dividend payout per share divided by the current stock price.',
      impact: isAr
        ? 'التوزيعات النقدية توفر دخل ثابت وتعتبر صمام أمان يدعم سعر السهم ويمنع هبوطه الحاد.'
        : 'Reliable dividends offer steady income and establish a strong price floor.',
      icon: '🎁'
    },
    {
      title: isAr ? 'السعر العادل (Fair Value)' : 'Fair Value',
      value: formatVal(fundamentals.fair_value, ' EGP'),
      status: fvStatus,
      explanation: isAr
        ? 'التقييم الجوهري للسهم المحسوب وفقاً لمعادلة بنجامين جراهام القياسية.'
        : 'The intrinsic value calculated using the standard Benjamin Graham formula.',
      impact: isAr
        ? 'إذا كان سعر السهم الحالي أقل من السعر العادل، فهذا يمثل هامش أمان ويعزز احتمالية صعود السعر بشكل كبير.'
        : 'Trading below fair value provides a margin of safety and increases probability of appreciation.',
      icon: '🎯'
    }
  ];

  return (
    <div className="glass-card p-6 rounded-2xl mb-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6">
        <div>
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <span>📊</span>
            <span>{isAr ? 'التحليل المالي الأساسي (Fundamentals)' : 'Financial Fundamentals'}</span>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            {isAr 
              ? 'مؤشرات التحليل الأساسي لتقييم صحة الشركة المالية والاستثمارية متوسطة/طويلة الأجل' 
              : 'Key fundamental ratios to evaluate corporate financial health and medium/long term valuation'}
          </p>
        </div>
        {fundamentals.last_updated && (
          <div className="text-[10px] text-text-secondary bg-white/5 px-2.5 py-1 rounded-md self-start sm:self-center font-sans">
            {isAr ? 'آخر تحديث: ' : 'Updated: '}
            {new Date(fundamentals.last_updated).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((m, i) => (
          <div 
            key={i} 
            className="flex flex-col p-4 rounded-xl border border-white/5 bg-white/[0.005] hover:bg-white/[0.015] hover:border-white/10 transition-all duration-200"
          >
            <div className="flex justify-between items-start gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{m.icon}</span>
                <span className="text-sm font-bold text-text-primary">{m.title}</span>
              </div>
              {m.status && (
                <Badge variant={m.status.color as any}>
                  {m.status.label}
                </Badge>
              )}
            </div>

            <div className="text-xl font-mono font-bold text-accent-blue my-1.5">
              {m.value}
            </div>

            <div className="text-xs text-text-secondary leading-relaxed mb-2 border-b border-white/5 pb-2">
              <span className="font-semibold text-text-primary">{isAr ? 'الوصف: ' : 'Definition: '}</span>
              {m.explanation}
            </div>

            <div className="text-[11px] text-text-secondary leading-relaxed bg-white/[0.01] p-2 rounded-lg border border-white/[0.02]">
              <span className="font-semibold text-text-primary">{isAr ? '⚡ التأثير على السعر: ' : '⚡ Price Impact: '}</span>
              {m.impact}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
