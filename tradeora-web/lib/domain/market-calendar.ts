import { Decimal } from 'decimal.js';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export enum EGXSessionStatus {
  PRE_OPEN = 'PRE_OPEN',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  HALTED = 'HALTED',
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

export class MarketSessionEvaluator {
  public static readonly MAX_ALPHA_USERS = 100;
  public static readonly CIRCUIT_BREAKER_LVL1 = new Decimal('5.00');
  public static readonly CIRCUIT_BREAKER_LVL2 = new Decimal('10.00');

  public static evaluateEGXStatus(date: Date, isHalted: boolean = false): EGXSessionStatus {
    if (isHalted) {
      return EGXSessionStatus.HALTED;
    }

    const cairoDateString = date.toLocaleString('en-US', { timeZone: 'Africa/Cairo' });
    const cairoDate = new Date(cairoDateString);
    const dayOfWeek = cairoDate.getDay();

    if (dayOfWeek === 5 || dayOfWeek === 6) {
      return EGXSessionStatus.CLOSED;
    }

    const hours = cairoDate.getHours();
    const minutes = cairoDate.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    const preOpenStart = 9 * 60 + 30;
    const openStart = 10 * 60;
    const closeTime = 14 * 60 + 30;

    if (totalMinutes >= preOpenStart && totalMinutes < openStart) {
      return EGXSessionStatus.PRE_OPEN;
    } else if (totalMinutes >= openStart && totalMinutes < closeTime) {
      return EGXSessionStatus.OPEN;
    } else {
      return EGXSessionStatus.CLOSED;
    }
  }

  public static checkCircuitBreaker(indexChangePercent: string | number | Decimal): {
    triggered: boolean;
    level: 0 | 1 | 2;
    thresholdPercent: string;
    descriptionAr: string;
  } {
    const absChange = new Decimal(indexChangePercent).abs();

    if (absChange.gte(this.CIRCUIT_BREAKER_LVL2)) {
      return {
        triggered: true,
        level: 2,
        thresholdPercent: this.CIRCUIT_BREAKER_LVL2.toFixed(4),
        descriptionAr: 'تعليق التداول الكلي للسوق بنسبة 10% لحين نهاية الجلسة',
      };
    } else if (absChange.gte(this.CIRCUIT_BREAKER_LVL1)) {
      return {
        triggered: true,
        level: 1,
        thresholdPercent: this.CIRCUIT_BREAKER_LVL1.toFixed(4),
        descriptionAr: 'إيقاف مؤقت للتداول لمدة 30 دقيقة عند تراجع المؤشر 5%',
      };
    }

    return {
      triggered: false,
      level: 0,
      thresholdPercent: '0.0000',
      descriptionAr: 'السوق يعمل بشكل طبيعي',
    };
  }

  public static validateAlphaUserRegistration(currentCohortSize: number): {
    allowed: boolean;
    remainingSlots: number;
    messageAr: string;
  } {
    if (currentCohortSize >= this.MAX_ALPHA_USERS) {
      return {
        allowed: false,
        remainingSlots: 0,
        messageAr: 'تم التوصل إلى الحد الأقصى للمرحلة الأولية (100 مستخدم)',
      };
    }

    return {
      allowed: true,
      remainingSlots: this.MAX_ALPHA_USERS - currentCohortSize - 1,
      messageAr: 'تم قبول التسجيل في المرحلة الأولية Alpha',
    };
  }
}
