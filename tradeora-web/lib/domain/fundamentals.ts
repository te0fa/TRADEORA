export interface FinancialStatement {
  statementId: string;
  ticker: string;
  period: 'Q1' | 'Q2' | 'Q3' | 'FY';
  fiscalYear: number;
  currency: string;
  revenue: string;
  netIncome: string;
  totalAssets: string;
  totalLiabilities: string;
  equity: string;
  operatingCashFlow: string;
  freeCashFlow: string;
  peRatio: string;
  pbRatio: string;
  roe: string;
  debtToEquity: string;
  availableFromTs: string;
  auditStandard: 'EAS' | 'IFRS';
}

export interface DCFValuationInput {
  ticker: string;
  currentPrice: string;
  wacc: string;
  terminalGrowthRate: string;
  projectionYears: number;
  baseFreeCashFlow: string;
  sharesOutstanding: string;
  netDebt: string;
}

export interface DCFSensitivityCell {
  wacc: string;
  terminalGrowthRate: string;
  intrinsicValuePerShare: string;
}

export interface DCFValuationResult {
  ticker: string;
  currentPrice: string;
  intrinsicValuePerShare: string;
  marginOfSafety: string;
  valuationStatus: 'UNDERVALUED' | 'FAIRLY_VALUED' | 'OVERVALUED';
  projectedCashFlows: string[];
  terminalValue: string;
  enterpriseValue: string;
  equityValue: string;
  sensitivityMatrix: DCFSensitivityCell[];
  calculatedAt: string;
  fraDisclaimerAr: string;
}

export interface NewsArticle {
  articleId: string;
  ticker?: string;
  source: 'Mubasher' | 'EGX Disclosures' | 'Enterprise Press' | 'Reuters EGP';
  titleAr: string;
  summaryAr: string;
  contentAr: string;
  publishedAt: string;
  url: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  impactScore: number;
  vectorId?: string;
  fraDisclaimerAr: string;
}
