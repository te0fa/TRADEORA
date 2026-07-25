import { Decimal } from 'decimal.js';

// Enforce strict Decimal configuration (ROUND_HALF_UP)
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export class Money {
  private readonly amountDecimal: Decimal;
  private readonly currencyCode: string;

  constructor(amount: string | number | Decimal, currency = 'EGP') {
    if (typeof amount === 'number') {
      // Prevent float precision loss by insisting on string/Decimal representation or checking integer
      if (!Number.isInteger(amount)) {
        throw new Error('Float values not permitted in Money construction. Use string or Decimal.');
      }
    }
    this.amountDecimal = new Decimal(amount);
    this.currencyCode = currency.toUpperCase();
  }

  public get amount(): Decimal {
    return this.amountDecimal;
  }

  public get currency(): string {
    return this.currencyCode;
  }

  public add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amountDecimal.plus(other.amountDecimal), this.currencyCode);
  }

  public subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amountDecimal.minus(other.amountDecimal), this.currencyCode);
  }

  public multiply(factor: string | number | Decimal): Money {
    const factorDec = new Decimal(factor);
    return new Money(this.amountDecimal.times(factorDec), this.currencyCode);
  }

  public divide(divisor: string | number | Decimal): Money {
    const divDec = new Decimal(divisor);
    if (divDec.isZero()) {
      throw new Error('Division by zero in Money calculation.');
    }
    return new Money(this.amountDecimal.dividedBy(divDec), this.currencyCode);
  }

  public toString(): string {
    return `${this.amountDecimal.toFixed(4)} ${this.currencyCode}`;
  }

  public toJSON(): { amount: string; currency: string } {
    return {
      amount: this.amountDecimal.toString(),
      currency: this.currencyCode,
    };
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currencyCode !== other.currencyCode) {
      throw new Error(`Currency mismatch: ${this.currencyCode} vs ${other.currencyCode}`);
    }
  }
}
