import { Decimal } from 'decimal.js';
export declare enum EGXSessionStatus {
    PRE_OPEN = "PRE_OPEN",// 09:30 - 10:00 Cairo Time
    OPEN = "OPEN",// 10:00 - 14:30 Cairo Time
    CLOSED = "CLOSED",// 14:30 - 09:30 Next Day
    HALTED = "HALTED"
}
export interface MarketSession {
    id: string;
    marketCode: string;
    status: EGXSessionStatus;
    sessionDate: string;
    startTime: string;
    endTime: string;
    updatedAt: string;
}
export interface CircuitBreakerEvent {
    id: string;
    marketCode: string;
    thresholdPercent: string;
    triggeredAt: string;
    resumedAt?: string;
    reason: string;
    reasonAr: string;
}
export interface AlphaCohortUser {
    id: string;
    userId: string;
    status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'REVOKED';
    joinedAt: string;
}
export declare class MarketSessionEvaluator {
    static readonly MAX_ALPHA_USERS = 100;
    static readonly CIRCUIT_BREAKER_LVL1: Decimal;
    static readonly CIRCUIT_BREAKER_LVL2: Decimal;
    /**
     * Determine EGX Session Status based on Cairo local time (UTC+2 / UTC+3 DST)
     * Cairo Trading Hours:
     * PRE_OPEN: 09:30 to 10:00
     * OPEN: 10:00 to 14:30
     * CLOSED: 14:30 onwards & weekends (Fri/Sat)
     */
    static evaluateEGXStatus(date: Date, isHalted?: boolean): EGXSessionStatus;
    /**
     * Check if index movement triggers a circuit breaker halt
     */
    static checkCircuitBreaker(indexChangePercent: string | number | Decimal): {
        triggered: boolean;
        level: 0 | 1 | 2;
        thresholdPercent: string;
        descriptionAr: string;
    };
    /**
     * Validate Alpha Launch User Cohort limit (Max 100 users)
     */
    static validateAlphaUserRegistration(currentCohortSize: number): {
        allowed: boolean;
        remainingSlots: number;
        messageAr: string;
    };
}
