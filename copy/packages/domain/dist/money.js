"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Money = void 0;
const decimal_js_1 = require("decimal.js");
// Enforce strict Decimal configuration (ROUND_HALF_UP)
decimal_js_1.Decimal.set({ precision: 28, rounding: decimal_js_1.Decimal.ROUND_HALF_UP });
class Money {
    constructor(amount, currency = 'EGP') {
        if (typeof amount === 'number') {
            // Prevent float precision loss by insisting on string/Decimal representation or checking integer
            if (!Number.isInteger(amount)) {
                throw new Error('Float values not permitted in Money construction. Use string or Decimal.');
            }
        }
        this.amountDecimal = new decimal_js_1.Decimal(amount);
        this.currencyCode = currency.toUpperCase();
    }
    get amount() {
        return this.amountDecimal;
    }
    get currency() {
        return this.currencyCode;
    }
    add(other) {
        this.ensureSameCurrency(other);
        return new Money(this.amountDecimal.plus(other.amountDecimal), this.currencyCode);
    }
    subtract(other) {
        this.ensureSameCurrency(other);
        return new Money(this.amountDecimal.minus(other.amountDecimal), this.currencyCode);
    }
    multiply(factor) {
        const factorDec = new decimal_js_1.Decimal(factor);
        return new Money(this.amountDecimal.times(factorDec), this.currencyCode);
    }
    divide(divisor) {
        const divDec = new decimal_js_1.Decimal(divisor);
        if (divDec.isZero()) {
            throw new Error('Division by zero in Money calculation.');
        }
        return new Money(this.amountDecimal.dividedBy(divDec), this.currencyCode);
    }
    toString() {
        return `${this.amountDecimal.toFixed(4)} ${this.currencyCode}`;
    }
    toJSON() {
        return {
            amount: this.amountDecimal.toString(),
            currency: this.currencyCode,
        };
    }
    ensureSameCurrency(other) {
        if (this.currencyCode !== other.currencyCode) {
            throw new Error(`Currency mismatch: ${this.currencyCode} vs ${other.currencyCode}`);
        }
    }
}
exports.Money = Money;
