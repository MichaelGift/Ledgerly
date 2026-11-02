const fractionDigitsCache = new Map<string, number>();

/** Number of minor units for a currency (2 for USD, 0 for JPY, ...). */
export function fractionDigits(currency: string) {
  let digits = fractionDigitsCache.get(currency);
  if (digits === undefined) {
    try {
      digits =
        new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
          .maximumFractionDigits ?? 2;
    } catch {
      digits = 2;
    }
    fractionDigitsCache.set(currency, digits);
  }
  return digits;
}

export function formatMoney(amountMinor: number, currency: string) {
  const value = amountMinor / 10 ** fractionDigits(currency);
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
  } catch {
    return `${value.toFixed(fractionDigits(currency))} ${currency}`;
  }
}

/** Amount with grouping and the currency's decimals but no symbol, e.g. "1,250.00". */
export function formatAmount(amountMinor: number, currency: string) {
  const digits = fractionDigits(currency);
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amountMinor / 10 ** digits);
}

/** Parses user input like "12.5" or "1,234.56" into minor units; null if invalid or not positive. */
export function parseAmount(input: string, currency: string): number | null {
  const normalized = input.replace(/[\s,]/g, '');
  if (!/^\d*\.?\d*$/.test(normalized) || normalized === '' || normalized === '.') {
    return null;
  }
  const minor = Math.round(Number(normalized) * 10 ** fractionDigits(currency));
  return minor > 0 ? minor : null;
}

export function minorToInput(amountMinor: number, currency: string) {
  return (amountMinor / 10 ** fractionDigits(currency)).toFixed(fractionDigits(currency));
}

export const COMMON_CURRENCIES = ['USD', 'EUR', 'GBP', 'KES', 'NGN', 'ZAR', 'INR', 'JPY', 'CAD', 'AUD'];
