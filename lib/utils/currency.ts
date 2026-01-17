/**
 * Currency utilities for precise financial calculations
 * Uses Decimal.js to avoid floating point precision errors
 */

import Decimal from 'decimal.js';
import {
  getCurrency,
  getCurrencySymbol,
  getCurrencyOptions,
  getSupportedCurrencies,
  formatCurrencyAmount as formatWithConfig,
  isSupportedCurrency,
} from '@/lib/config/currencies';

// Configure Decimal for currency (20 digits precision, round half up)
Decimal.config({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

// Re-export currency configuration utilities
export {
  getCurrency,
  getCurrencySymbol,
  getCurrencyOptions,
  getSupportedCurrencies,
  isSupportedCurrency,
};

/**
 * Safely add currency amounts
 * @example add(0.1, 0.2) // Returns 0.3 (not 0.30000000000000004)
 */
export function add(...amounts: number[]): number {
  return amounts.reduce((sum, amount) => {
    return new Decimal(sum).plus(amount).toNumber();
  }, 0);
}

/**
 * Safely subtract currency amounts
 */
export function subtract(a: number, b: number): number {
  return new Decimal(a).minus(b).toNumber();
}

/**
 * Safely multiply currency amount
 */
export function multiply(amount: number, multiplier: number): number {
  return new Decimal(amount).times(multiplier).toNumber();
}

/**
 * Safely divide currency amount
 */
export function divide(amount: number, divisor: number): number {
  if (divisor === 0) return 0;
  return new Decimal(amount).dividedBy(divisor).toNumber();
}

/**
 * Round currency amount to 2 decimal places
 */
export function round(amount: number, decimals: number = 2): number {
  return new Decimal(amount).toDecimalPlaces(decimals).toNumber();
}

/**
 * Format currency with proper symbol and formatting rules
 * @example formatCurrency(1234.56, 'USD') // Returns "$1,234.56"
 * @example formatCurrency(1234.56, 'EUR') // Returns "1 234,56 €"
 * @example formatCurrency(1234, 'JPY') // Returns "¥1,234" (no decimals)
 */
export function formatCurrency(
  amount: number,
  currencyCode: string | null | undefined = 'USD'
): string {
  const roundedAmount = round(amount);
  return formatWithConfig(roundedAmount, currencyCode);
}

/**
 * Parse currency string to number
 * @example parseCurrency('$1,234.56') // Returns 1234.56
 */
export function parseCurrency(value: string): number {
  // Remove currency symbols, spaces, and commas
  const cleaned = value.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : round(parsed);
}

/**
 * Validate currency input
 * Returns parsed number or null if invalid
 */
export function validateCurrencyInput(value: string): number | null {
  const cleaned = value.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);

  if (isNaN(parsed)) return null;
  if (parsed < 0) return null; // Use for amounts that must be positive

  return round(parsed);
}

/**
 * Sum array of currency amounts safely
 */
export function sum(amounts: number[]): number {
  return add(...amounts);
}

/**
 * Calculate percentage of amount
 * @example percentage(100, 15) // Returns 15
 */
export function percentage(amount: number, percent: number): number {
  return multiply(amount, divide(percent, 100));
}
