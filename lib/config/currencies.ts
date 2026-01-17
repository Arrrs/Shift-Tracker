/**
 * Currency configuration following ISO 4217 standard
 * Central source of truth for all currency-related data
 */

export interface Currency {
  code: string;           // ISO 4217 code (USD, EUR, etc.)
  symbol: string;         // Currency symbol ($, €, etc.)
  name: string;           // Full name (US Dollar, Euro, etc.)
  symbolPosition: 'before' | 'after';  // Symbol placement
  decimalPlaces: number;  // Number of decimal places (most = 2, some = 0)
  thousandsSeparator: ',' | '.' | ' ' | "'";
  decimalSeparator: '.' | ',';
}

/**
 * Comprehensive currency database
 * Ordered by: Major currencies, European currencies, Other currencies
 */
export const CURRENCIES: Record<string, Currency> = {
  // Major World Currencies
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    symbolPosition: 'before',
    decimalPlaces: 0, // Yen has no decimal places
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },

  // European Currencies
  UAH: {
    code: 'UAH',
    symbol: '₴',
    name: 'Ukrainian Hryvnia',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
  },
  PLN: {
    code: 'PLN',
    symbol: 'zł',
    name: 'Polish Złoty',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
  },
  CZK: {
    code: 'CZK',
    symbol: 'Kč',
    name: 'Czech Koruna',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
  },
  CHF: {
    code: 'CHF',
    symbol: 'CHF',
    name: 'Swiss Franc',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: "'",
    decimalSeparator: '.',
  },
  DKK: {
    code: 'DKK',
    symbol: 'kr',
    name: 'Danish Krone',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
  },
  HUF: {
    code: 'HUF',
    symbol: 'Ft',
    name: 'Hungarian Forint',
    symbolPosition: 'after',
    decimalPlaces: 0, // Forint has no decimal places
    thousandsSeparator: ' ',
    decimalSeparator: ',',
  },
  NOK: {
    code: 'NOK',
    symbol: 'kr',
    name: 'Norwegian Krone',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
  },
  SEK: {
    code: 'SEK',
    symbol: 'kr',
    name: 'Swedish Krona',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
  },
  RON: {
    code: 'RON',
    symbol: 'lei',
    name: 'Romanian Leu',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
  },

  // Other Major Currencies
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  RUB: {
    code: 'RUB',
    symbol: '₽',
    name: 'Russian Ruble',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Brazilian Real',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
  },
  MXN: {
    code: 'MXN',
    symbol: 'MX$',
    name: 'Mexican Peso',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'South African Rand',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: '.',
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  NZD: {
    code: 'NZD',
    symbol: 'NZ$',
    name: 'New Zealand Dollar',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  KRW: {
    code: 'KRW',
    symbol: '₩',
    name: 'South Korean Won',
    symbolPosition: 'before',
    decimalPlaces: 0, // Won has no decimal places
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  TRY: {
    code: 'TRY',
    symbol: '₺',
    name: 'Turkish Lira',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
  },
  ILS: {
    code: 'ILS',
    symbol: '₪',
    name: 'Israeli Shekel',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
};

/**
 * Get currency configuration by code
 */
export function getCurrency(code: string | null | undefined): Currency {
  if (!code) return CURRENCIES.USD; // Default fallback
  const currency = CURRENCIES[code.toUpperCase()];
  return currency || CURRENCIES.USD;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(code: string | null | undefined): string {
  return getCurrency(code).symbol;
}

/**
 * Get all supported currency codes sorted by name
 */
export function getSupportedCurrencies(): Currency[] {
  return Object.values(CURRENCIES).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get currency options for select dropdown
 */
export function getCurrencyOptions(): Array<{ value: string; label: string; shortLabel: string }> {
  return getSupportedCurrencies().map(currency => ({
    value: currency.code,
    label: `${currency.code} - ${currency.name}`,
    shortLabel: `${currency.symbol} ${currency.code}`,
  }));
}

/**
 * Format amount with proper currency formatting
 * @example formatCurrencyAmount(1234.56, 'USD') // "$1,234.56"
 * @example formatCurrencyAmount(1234.56, 'EUR') // "1 234,56 €"
 * @example formatCurrencyAmount(1234, 'JPY') // "¥1,234" (no decimals)
 */
export function formatCurrencyAmount(
  amount: number,
  currencyCode: string | null | undefined
): string {
  const currency = getCurrency(currencyCode);

  // Format the number with proper decimal places
  const rounded = currency.decimalPlaces === 0
    ? Math.round(amount)
    : Number(amount.toFixed(currency.decimalPlaces));

  // Convert to string with proper decimal places
  const parts = rounded.toFixed(currency.decimalPlaces).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Add thousands separators
  const formattedInteger = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    currency.thousandsSeparator
  );

  // Combine integer and decimal parts
  let formattedNumber = formattedInteger;
  if (currency.decimalPlaces > 0 && decimalPart) {
    formattedNumber += currency.decimalSeparator + decimalPart;
  }

  // Add currency symbol in correct position
  if (currency.symbolPosition === 'before') {
    return `${currency.symbol}${formattedNumber}`;
  } else {
    return `${formattedNumber} ${currency.symbol}`;
  }
}

/**
 * Validate if currency code is supported
 */
export function isSupportedCurrency(code: string): boolean {
  return code.toUpperCase() in CURRENCIES;
}
