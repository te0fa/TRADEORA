import { Decimal } from 'decimal.js';
export declare class Money {
    private readonly amountDecimal;
    private readonly currencyCode;
    constructor(amount: string | number | Decimal, currency?: string);
    get amount(): Decimal;
    get currency(): string;
    add(other: Money): Money;
    subtract(other: Money): Money;
    multiply(factor: string | number | Decimal): Money;
    divide(divisor: string | number | Decimal): Money;
    toString(): string;
    toJSON(): {
        amount: string;
        currency: string;
    };
    private ensureSameCurrency;
}
