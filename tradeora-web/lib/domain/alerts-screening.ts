export type AlertType = 'PRICE_ABOVE' | 'PRICE_BELOW' | 'VOLATILITY_SPIKE' | 'PERCENT_CHANGE';

export type AlertStatus = 'ACTIVE' | 'TRIGGERED' | 'DISABLED' | 'CANCELLED';

export interface PriceAlert {
  alertId: string;
  userId: string;
  symbol: string;
  alertType: AlertType;
  targetValue: string;
  condition: string;
  status: AlertStatus;
  createdAt: string;
  triggeredAt?: string;
}

export interface AlertTriggerEvent {
  eventId: string;
  alertId: string;
  userId: string;
  symbol: string;
  triggerPrice: string;
  triggeredAt: string;
  message: string;
}

export interface ScreenerFilter {
  field: 'marketCap' | 'peRatio' | 'rsi' | 'volume' | 'price' | 'dividendYield';
  operator: 'GREATER_THAN' | 'LESS_THAN' | 'BETWEEN' | 'EQUALS';
  value: string;
}

export interface ScreenerRule {
  ruleId: string;
  userId: string;
  name: string;
  filters: ScreenerFilter[];
  createdAt: string;
}

export interface ScreenerResult {
  symbol: string;
  nameAr: string;
  nameEn: string;
  price: string;
  changePercent: string;
  marketCap: string;
  peRatio?: string;
  volume: number;
}

export interface UniversalSearchQuery {
  query: string;
  limit?: number;
  category?: 'EQUITY' | 'FOREX' | 'NEWS' | 'ALL';
}

export interface UniversalSearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'EQUITY' | 'FOREX' | 'NEWS_ARTICLE' | 'SCREENER_RULE';
  score: number;
  metadata: Record<string, unknown>;
}
