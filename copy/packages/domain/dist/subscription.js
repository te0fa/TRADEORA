"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntitlementEvaluator = exports.VATCalculator = exports.OrderStatus = exports.BillingCycle = exports.SubscriptionTier = void 0;
const decimal_js_1 = require("decimal.js");
// Enforce strict Decimal configuration
decimal_js_1.Decimal.set({ precision: 28, rounding: decimal_js_1.Decimal.ROUND_HALF_UP });
var SubscriptionTier;
(function (SubscriptionTier) {
    SubscriptionTier["FREE"] = "FREE";
    SubscriptionTier["PREMIUM"] = "PREMIUM";
    SubscriptionTier["WEALTH"] = "WEALTH";
    SubscriptionTier["INSTITUTIONAL"] = "INSTITUTIONAL";
})(SubscriptionTier || (exports.SubscriptionTier = SubscriptionTier = {}));
var BillingCycle;
(function (BillingCycle) {
    BillingCycle["MONTHLY"] = "MONTHLY";
    BillingCycle["ANNUAL"] = "ANNUAL";
})(BillingCycle || (exports.BillingCycle = BillingCycle = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "PENDING";
    OrderStatus["ACTIVE"] = "ACTIVE";
    OrderStatus["FAILED"] = "FAILED";
    OrderStatus["CANCELLED"] = "CANCELLED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
class VATCalculator {
    static calculate(basePriceEgp) {
        const baseDec = new decimal_js_1.Decimal(basePriceEgp);
        const vatDec = baseDec.times(this.VAT_RATE).toDecimalPlaces(2, decimal_js_1.Decimal.ROUND_HALF_UP);
        const totalDec = baseDec.plus(vatDec).toDecimalPlaces(2, decimal_js_1.Decimal.ROUND_HALF_UP);
        return {
            basePrice: baseDec.toFixed(2),
            vatRate: '14%',
            vatAmount: vatDec.toFixed(2),
            total: totalDec.toFixed(2),
        };
    }
}
exports.VATCalculator = VATCalculator;
VATCalculator.VAT_RATE = new decimal_js_1.Decimal('0.14'); // 14% Egypt VAT
class EntitlementEvaluator {
    static getEntitlements(tier) {
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
                    aiRecommendationsPerDay: -1, // Unlimited
                    priceAlertsLimit: 100,
                    historicalDataYears: 10,
                    realTimeData: true,
                    apiAccess: true,
                    customReports: true,
                };
            case SubscriptionTier.INSTITUTIONAL:
                return {
                    maxPortfolios: -1, // Unlimited
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
exports.EntitlementEvaluator = EntitlementEvaluator;
