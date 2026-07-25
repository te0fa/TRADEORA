/**
 * Tradeora Financial Operating System
 * Domain Contracts: Fundamental Analysis & News Intelligence Service
 * Release: R2.0 (Beta) | Sprint: S-R2.4
 */

export interface FinancialStatement {
  statementId: string;
  ticker: string;
  period: 'Q1' | 'Q2' | 'Q3' | 'FY';
  fiscalYear: number;
  currency: string;
  revenue: string; // Decimal string representation
  netIncome: string; // Decimal string representation
  totalAssets: string;
  totalLiabilities: string;
  equity: string;
  operatingCashFlow: string;
  freeCashFlow: string;
  peRatio: string;
  pbRatio: string;
  roe: string;
  debtToEquity: string;
  availableFromTs: string; // ISO-8601 string (Rule 40 look-ahead bias protection)
  auditStandard: 'EAS' | 'IFRS';
}

export interface DCFValuationInput {
  ticker: string;
  currentPrice: string;
  wacc: string; // Discount rate (e.g., "0.1850" = 18.5%)
  terminalGrowthRate: string; // (e.g., "0.0500" = 5.0%)
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
  marginOfSafety: string; // Percentage difference e.g., "+25.40%" or "-10.50%"
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
  impactScore: number; // 0.00 to 1.00
  vectorId?: string; // Qdrant point UUID
  fraDisclaimerAr: string;
}
