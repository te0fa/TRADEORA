import { Money } from './money';

export interface SecurityMaster {
  id: string;
  symbol: string; // e.g., 'COMI.CA', 'EAST.CA', 'FWRY.CA'
  nameEn: string;
  nameAr: string;
  isin: string;
  market: 'EGX' | 'FOREX' | 'CRYPTO';
  currency: string; // 'EGP' | 'USD' | 'EUR'
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
  quantity: string; // Decimal string representation
  unitPrice: string; // Decimal string representation
  amount: string; // Decimal string representation
  currency: string;
  fee: string; // Decimal string representation
  timestamp: string;
  notes?: string;
}

export interface Position {
  portfolioId: string;
  securitySymbol: string;
  quantity: string; // Decimal string
  averageCostBasis: string; // Decimal string per share
  totalCostBasis: string; // Decimal string
  currentPrice: string; // Decimal string
  marketValue: string; // Decimal string
  unrealizedPnl: string; // Decimal string
  unrealizedPnlPercent: string; // Decimal string
  currency: string;
  updatedAt: string;
}

export interface PortfolioSummary {
  portfolioId: string;
  userId: string;
  name: string;
  baseCurrency: string;
  totalMarketValue: string; // Decimal string in base currency
  cashBalance: string; // Decimal string in base currency
  totalPortfolioValue: string; // Decimal string
  unrealizedPnl: string; // Decimal string
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
  rate: string; // Decimal string
}

export interface PortfolioNAV {
  portfolioId: string;
  nav: string; // Decimal string
  cashBalance: string; // Decimal string
  investedValue: string; // Decimal string
  currency: string;
  timestamp: string;
}

export interface TWRCalculation {
  portfolioId: string;
  period: '1D' | '1W' | '1M' | '3M' | '1Y' | 'YTD' | 'ALL';
  twrReturnPercent: string; // Decimal string
  annualizedReturnPercent: string; // Decimal string
  subPeriodReturns: Array<{
    startDate: string;
    endDate: string;
    returnPercent: string; // Decimal string
    cashFlow: string; // Decimal string
  }>;
  calculatedAt: string;
}

export interface BenchmarkComparison {
  portfolioId: string;
  benchmarkSymbol: string; // 'EGX30' | 'EGX70' | 'EGX100'
  portfolioReturnPercent: string; // Decimal string
  benchmarkReturnPercent: string; // Decimal string
  alphaPercent: string; // Decimal string (Portfolio Return - Benchmark Return)
  period: string;
  calculatedAt: string;
}

export interface SectorHeatmapItem {
  sector: string;
  weightPercent: string; // Decimal string
  marketValue: string; // Decimal string
  unrealizedPnlPercent: string; // Decimal string
  topHoldingSymbol: string;
  holdingCount: number;
}

export interface SectorHeatmap {
  portfolioId: string;
  totalValue: string; // Decimal string
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

