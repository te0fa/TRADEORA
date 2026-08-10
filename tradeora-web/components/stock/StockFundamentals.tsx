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
    last_dividend_amount?: number | null;
    book_value: number | null;
    book_value_ps?: number | null;
    fair_value: number | null;
    fair_value_source?: string | null;
    upside_potential?: number | null;
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

  const formatVal = (val: number | null | undefined, suffix = '', decimals = 2) => {
    if (val === null || val === undefined || isNaN(Number(val))) {
      return isAr ? 'غير متوفر' : 'N/A';
    }
    const numVal = Number(val);
    const formatted = numVal.toFixed(decimals);
    return isAr ? `${toEasternArabic(formatted)}${suffix}` : `${formatted}${suffix}`;
  };

  const getPEStatus = (pe: number | null) => {
    if (pe === null || isNaN(Number(pe))) return null;
    if (pe <= 0) return { label: isAr ? 'سالب' : 'Negative', color: 'danger' };
    if (pe < 10) return { label: isAr ? 'ممتاز' : 'Excellent', color: 'success' };
    if (pe < 20) return { label: isAr ? 'متوسط' : 'Moderate', color: 'warning' };
    return { label: isAr ? 'مرتفع' : 'High', color: 'danger' };
  };

  const getDEStatus = (de: number | null) => {
    if (de === null || isNaN(Number(de))) return null;
    if (de <= 0.5) return { label: isAr ? 'منخفض (آمن)' : 'Low (Safe)', color: 'success' };
    if (de <= 1.5) return { label: isAr ? 'متوسط' : 'Moderate', color: 'warning' };
    return { label: isAr ? 'مرتفع (مخاطرة)' : 'High (Risky)', color: 'danger' };
  };

  const getDividendStatus = (yieldVal: number | null) => {
    if (yieldVal === null || yieldVal === 0 || isNaN(Number(yieldVal))) return null;
    if (yieldVal >= 8) return { label: isAr ? 'توزيعات سخية جداً' : 'Superb Yield', color: 'success' };
    if (yieldVal >= 4) return { label: isAr ? 'توزيعات جذابة' : 'Attractive Yield', color: 'primary' };
    return { label: isAr ? 'توزيعات منخفضة' : 'Low Yield', color: 'glass' };
  };

  const getFairValueStatus = (fv: number | null, price: number) => {
    if (!fv || fv <= 0 || !price || price <= 0 || isNaN(Number(price))) return null;
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

  const calculatedPE = fundamentals.pe_ratio != null 
    ? Number(fundamentals.pe_ratio)
    : ((fundamentals.eps && fundamentals.eps > 0 && currentPrice > 0)
        ? (currentPrice / fundamentals.eps)
        : null);

  const peStatus = getPEStatus(calculatedPE);
  const deStatus = getDEStatus(fundamentals.debt_equity);
  const divStatus = getDividendStatus(fundamentals.dividend_yield);
  const fvStatus = getFairValueStatus(fundamentals.fair_value, currentPrice);

  const renderDividendVal = () => {
    if (fundamentals.dividend_yield === null || fundamentals.dividend_yield === undefined) {
      return isAr ? 'غير متوفر' : 'N/A';
    }
    const yieldStr = formatVal(fundamentals.dividend_yield, '%');
    if (fundamentals.last_dividend_amount != null) {
      return `${yieldStr} (${formatVal(fundamentals.last_dividend_amount, ' EGP')})`;
    }
    return yieldStr;
  };

  const renderFairVal = () => {
    if (fundamentals.fair_value === null || fundamentals.fair_value === undefined) {
      return isAr ? 'غير متوفر' : 'N/A';
    }
    const fvStr = formatVal(fundamentals.fair_value, ' EGP');
    if (fundamentals.upside_potential !== null && fundamentals.upside_potential !== undefined) {
      const sign = fundamentals.upside_potential > 0 ? '+' : '';
      return `${fvStr} (${sign}${formatVal(fundamentals.upside_potential, '%')})`;
    }
    return fvStr;
  };

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
      value: fundamentals.eps != null ? formatVal(fundamentals.eps, ' EGP') : (isAr ? 'غير متوفر' : 'N/A'),
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
      status: fundamentals.profit_margin != null && fundamentals.profit_margin > 20 ? { label: isAr ? 'ربحية قوية' : 'Highly Profitable', color: 'success' } : null,
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
      status: fundamentals.revenue_growth != null && fundamentals.revenue_growth > 10 ? { label: isAr ? 'نمو سريع' : 'Fast Growth', color: 'success' } : null,
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
      status: fundamentals.earnings_growth != null && fundamentals.earnings_growth > 15 ? { label: isAr ? 'نمو ربحي ممتاز' : 'Great Growth', color: 'success' } : null,
      explanation: isAr
        ? 'معدل التغير السنوي لصافي أرباح الشركة بعد الضرائب والفوائد.'
        : 'YoY percentage change in net profits.',
      impact: isAr
        ? 'نمو صافي الأرباح هو المحرك الأساسي للقيمة الاستثمارية للسهم وصعوده المستمر.'
        : 'Net earnings growth is the key driver of fundamental equity value.',
      icon: '💰'
    },
    {
      title: isAr ? 'عائد وآخر توزيع نقدي (Dividend Yield)' : 'Dividend Yield & Last Payout',
      value: renderDividendVal(),
      status: divStatus,
      explanation: isAr
        ? `نسبة التوزيع السنوي مقارنة بالسعر الحالي. ${fundamentals.last_dividend_amount ? `آخر توزيع نقدي مسجل: ${formatVal(fundamentals.last_dividend_amount, ' ج.م/سهم')}` : ''}`
        : `Annual dividend yield vs market price. ${fundamentals.last_dividend_amount ? `Last dividend payout: ${formatVal(fundamentals.last_dividend_amount, ' EGP/share')}` : ''}`,
      impact: isAr
        ? 'التوزيعات النقدية توفر دخلاً ثابتاً وتعتبر صمام أمان يدعم سعر السهم ويمنع هبوطه الحاد.'
        : 'Reliable dividends offer steady income and establish a strong price floor.',
      icon: '🎁'
    },
    {
      title: isAr ? 'السعر العادل والهامش (Fair Value & Upside)' : 'Fair Value & Upside',
      value: renderFairVal(),
      status: fvStatus,
      explanation: isAr
        ? `التقييم الجوهري للسهم (${fundamentals.fair_value_source === 'analyst_consensus' ? 'متوسط تحليلات الخبراء' : 'نموذج جراهام والأنصبة'}).`
        : `Intrinsic value estimate (${fundamentals.fair_value_source === 'analyst_consensus' ? 'Analyst Consensus' : 'Graham & Book Value model'}).`,
      impact: isAr
        ? 'إذا كان سعر السهم الحالي أقل من السعر العادل، فهذا يمثل هامش أمان ويعزز احتمالية صعود السعر في التوصيات.'
        : 'Trading below fair value provides a margin of safety and boosts AI Buy signal confidence.',
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
          <span className="text-[11px] text-text-muted bg-surface-muted px-2.5 py-1 rounded-full border border-border-subtle self-start sm:self-auto">
            {isAr ? `تحديث القوائم: ${fundamentals.last_updated}` : `Financials updated: ${fundamentals.last_updated}`}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => (
          <div key={idx} className="bg-surface-subtle p-4 rounded-xl border border-border-subtle flex flex-col justify-between hover:border-border-muted transition-colors">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xl">{m.icon}</span>
                {m.status && (
                  <Badge variant={m.status.color as any} size="sm">
                    {m.status.label}
                  </Badge>
                )}
              </div>
              <p className="text-xs font-semibold text-text-secondary mb-1">{m.title}</p>
              <p className="text-base font-bold text-text-primary font-mono">{m.value}</p>
            </div>
            
            <div className="mt-3 pt-3 border-t border-border-subtle/50 text-[11px] text-text-muted leading-relaxed">
              <p>{m.explanation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
