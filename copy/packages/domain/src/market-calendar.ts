import { Decimal } from 'decimal.js';

// Enforce strict Decimal configuration
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export enum EGXSessionStatus {
  PRE_OPEN = 'PRE_OPEN', // 09:30 - 10:00 Cairo Time
  OPEN = 'OPEN',         // 10:00 - 14:30 Cairo Time
  CLOSED = 'CLOSED',     // 14:30 - 09:30 Next Day
  HALTED = 'HALTED',     // Circuit Breaker / Regulatory Halt
}

export interface MarketSession {
  id: string;
  marketCode: string; // 'EGX'
  status: EGXSessionStatus;
  sessionDate: string; // YYYY-MM-DD
  startTime: string;   // HH:MM:SS
  endTime: string;     // HH:MM:SS
  updatedAt: string;
}

export interface CircuitBreakerEvent {
  id: string;
  marketCode: string;
  thresholdPercent: string; // Decimal string e.g. "5.0000" or "10.0000"
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
  public static readonly CIRCUIT_BREAKER_LVL1 = new Decimal('5.00'); // 5% EGX halt
  public static readonly CIRCUIT_BREAKER_LVL2 = new Decimal('10.00'); // 10% EGX day halt

  /**
   * Determine EGX Session Status based on Cairo local time (UTC+2 / UTC+3 DST)
   * Cairo Trading Hours:
   * PRE_OPEN: 09:30 to 10:00
   * OPEN: 10:00 to 14:30
   * CLOSED: 14:30 onwards & weekends (Fri/Sat)
   */
  public static evaluateEGXStatus(date: Date, isHalted: boolean = false): EGXSessionStatus {
    if (isHalted) {
      return EGXSessionStatus.HALTED;
    }

    // Convert to Cairo time offset
    const cairoDateString = date.toLocaleString('en-US', { timeZone: 'Africa/Cairo' });
    const cairoDate = new Date(cairoDateString);
    const dayOfWeek = cairoDate.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat

    // EGX Weekend: Friday (5) & Saturday (6)
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      return EGXSessionStatus.CLOSED;
    }

    const hours = cairoDate.getHours();
    const minutes = cairoDate.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    const preOpenStart = 9 * 60 + 30; // 09:30 (570)
    const openStart = 10 * 60;        // 10:00 (600)
    const closeTime = 14 * 60 + 30;   // 14:30 (870)

    if (totalMinutes >= preOpenStart && totalMinutes < openStart) {
      return EGXSessionStatus.PRE_OPEN;
    } else if (totalMinutes >= openStart && totalMinutes < closeTime) {
      return EGXSessionStatus.OPEN;
    } else {
      return EGXSessionStatus.CLOSED;
    }
  }

  /**
   * Check if index movement triggers a circuit breaker halt
   */
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

  /**
   * Validate Alpha Launch User Cohort limit (Max 100 users)
   */
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
