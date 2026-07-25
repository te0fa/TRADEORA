import { Decimal } from 'decimal.js';
export declare enum SubscriptionTier {
    FREE = "FREE",
    PREMIUM = "PREMIUM",
    WEALTH = "WEALTH",
    INSTITUTIONAL = "INSTITUTIONAL"
}
export declare enum BillingCycle {
    MONTHLY = "MONTHLY",
    ANNUAL = "ANNUAL"
}
export declare enum OrderStatus {
    PENDING = "PENDING",
    ACTIVE = "ACTIVE",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
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
export declare class VATCalculator {
    private static readonly VAT_RATE;
    static calculate(basePriceEgp: string | number | Decimal): {
        basePrice: string;
        vatRate: string;
        vatAmount: string;
        total: string;
    };
}
export declare class EntitlementEvaluator {
    static getEntitlements(tier: SubscriptionTier): SubscriptionEntitlements;
}
