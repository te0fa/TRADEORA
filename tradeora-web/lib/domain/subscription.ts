import { Decimal } from 'decimal.js';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export enum SubscriptionTier {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  WEALTH = 'WEALTH',
  INSTITUTIONAL = 'INSTITUTIONAL',
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface SubscriptionEntitlements {
  maxPortfolios: number;
  aiRecommendationsPerDay: number;
  priceAlertsLimit: number;
  historicalDataYears: number;
  realTimeData: boolean;
  apiAccess: boolean;
  customReports: boolean;
}

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  nameAr: string;
  nameEn: string;
  monthlyPriceEgp: string;
  annualPriceEgp: string;
  entitlements: SubscriptionEntitlements;
}

export interface UserSubscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
}

export interface SubscriptionOrder {
  orderId: string;
  userId: string;
  targetTier: SubscriptionTier;
  billingCycle: BillingCycle;
  baseAmountEgp: string;
  vatAmountEgp: string;
  totalAmountEgp: string;
  paymentMethod: 'FAWRY' | 'MEEZA' | 'BANK_TRANSFER';
  status: OrderStatus;
  createdAt: string;
}

export interface BillingReceipt {
  receiptId: string;
  orderId: string;
  userId: string;
  invoiceNumber: string;
  baseAmountEgp: string;
  vatRate: string;
  vatAmountEgp: string;
  totalAmountEgp: string;
  issuedAt: string;
  minioWormPath: string;
}

export interface PDPLConsent {
  id: string;
  userId: string;
  consentType: string;
  granted: boolean;
  grantedAt: string;
  ipAddress: string;
}

export class VATCalculator {
  private static readonly VAT_RATE = new Decimal('0.14');

  public static calculate(basePriceEgp: string | number | Decimal): {
    basePrice: string;
    vatRate: string;
    vatAmount: string;
    total: string;
  } {
    const baseDec = new Decimal(basePriceEgp);
    const vatDec = baseDec.times(this.VAT_RATE).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const totalDec = baseDec.plus(vatDec).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    return {
      basePrice: baseDec.toFixed(2),
      vatRate: '14%',
      vatAmount: vatDec.toFixed(2),
      total: totalDec.toFixed(2),
    };
  }
}

export class EntitlementEvaluator {
  public static getEntitlements(tier: SubscriptionTier): SubscriptionEntitlements {
    switch (tier) {
      case SubscriptionTier.FREE:
        return {
          maxPortfolios: 1,
          aiRecommendationsPerDay: 10,
          priceAlertsLimit: 5,
          historicalDataYears: 1,
          realTimeData: false,
          apiAccess: false,
          customReports: false,
        };
      case SubscriptionTier.PREMIUM:
        return {
          maxPortfolios: 5,
          aiRecommendationsPerDay: 100,
          priceAlertsLimit: 25,
          historicalDataYears: 5,
          realTimeData: true,
          apiAccess: false,
          customReports: false,
        };
      case SubscriptionTier.WEALTH:
        return {
          maxPortfolios: 20,
          aiRecommendationsPerDay: -1,
          priceAlertsLimit: 100,
          historicalDataYears: 10,
          realTimeData: true,
          apiAccess: true,
          customReports: true,
        };
      case SubscriptionTier.INSTITUTIONAL:
        return {
          maxPortfolios: -1,
          aiRecommendationsPerDay: -1,
          priceAlertsLimit: -1,
          historicalDataYears: -1,
          realTimeData: true,
          apiAccess: true,
          customReports: true,
        };
      default:
        return this.getEntitlements(SubscriptionTier.FREE);
    }
  }
}
