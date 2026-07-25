import { Money } from './money';

export interface SecurityMaster {
  id: string;
  symbol: string;
  nameEn: string;
  nameAr: string;
  isin: string;
  market: 'EGX' | 'FOREX' | 'CRYPTO';
  currency: string;
  sector: string;
  lotSize: number;
  isTradable: boolean;
}

export type TransactionType = 'BUY' | 'SELL' | 'DIVIDEND' | 'FX_CONVERT' | 'DEPOSIT' | 'WITHDRAW';

export interface PortfolioTransaction {
  id: string;
  portfolioId: string;
  securitySymbol?: string;
  transactionType: TransactionType;
  quantity: string;
  unitPrice: string;
  amount: string;
  currency: string;
  fee: string;
  timestamp: string;
  notes?: string;
}

export interface Position {
  portfolioId: string;
  securitySymbol: string;
  quantity: string;
  averageCostBasis: string;
  totalCostBasis: string;
  currentPrice: string;
  marketValue: string;
  unrealizedPnl: string;
  unrealizedPnlPercent: string;
  currency: string;
  updatedAt: string;
}

export interface PortfolioSummary {
  portfolioId: string;
  userId: string;
  name: string;
  baseCurrency: string;
  totalMarketValue: string;
  cashBalance: string;
  totalPortfolioValue: string;
  unrealizedPnl: string;
  positions: Position[];
  updatedAt: string;
}

export interface CreatePortfolioDto {
  userId: string;
  name: string;
  baseCurrency?: string;
}

export interface RecordTransactionDto {
  portfolioId: string;
  securitySymbol?: string;
  transactionType: TransactionType;
  quantity: string;
  unitPrice: string;
  currency?: string;
  fee?: string;
  notes?: string;
}

export interface FXRateDto {
  fromCurrency: string;
  toCurrency: string;
  rate: string;
}

export interface PortfolioNAV {
  portfolioId: string;
  nav: string;
  cashBalance: string;
  investedValue: string;
  currency: string;
  timestamp: string;
}

export interface TWRCalculation {
  portfolioId: string;
  period: '1D' | '1W' | '1M' | '3M' | '1Y' | 'YTD' | 'ALL';
  twrReturnPercent: string;
  annualizedReturnPercent: string;
  subPeriodReturns: Array<{
    startDate: string;
    endDate: string;
    returnPercent: string;
    cashFlow: string;
  }>;
  calculatedAt: string;
}

export interface BenchmarkComparison {
  portfolioId: string;
  benchmarkSymbol: string;
  portfolioReturnPercent: string;
  benchmarkReturnPercent: string;
  alphaPercent: string;
  period: string;
  calculatedAt: string;
}

export interface SectorHeatmapItem {
  sector: string;
  weightPercent: string;
  marketValue: string;
  unrealizedPnlPercent: string;
  topHoldingSymbol: string;
  holdingCount: number;
}

export interface SectorHeatmap {
  portfolioId: string;
  totalValue: string;
  currency: string;
  sectors: SectorHeatmapItem[];
  updatedAt: string;
}

export interface BetaUserProvisioning {
  userId: string;
  portfolioId: string;
  cohort: string;
  rateLimitTier: 'BETA_STANDARD' | 'BETA_VIP';
  maxPortfolios: number;
  featuresEnabled: string[];
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  provisionedAt: string;
}
