/**
 * Approximate USD → KSH exchange rate.
 * Update this value periodically to stay current.
 */
export const USD_TO_KSH = 129;

/**
 * Convert an amount to KSH.
 * If currency is already 'KSH' (or 'ksh'), returns amount as-is.
 * Defaults to treating the value as USD if no currency is given.
 *
 * @param {number} amount
 * @param {'USD'|'KSH'} [currency='USD']
 * @returns {number}
 */
export function toKsh(amount, currency = 'USD') {
  if (amount == null || isNaN(amount)) return 0;
  const cur = String(currency).toUpperCase();
  if (cur === 'KSH' || cur === 'KES') return Number(amount);
  return Math.round(Number(amount) * USD_TO_KSH);
}

/**
 * Format a number as Kenyan Shillings.
 * If a currency argument is supplied, converts first.
 *
 * Examples:
 *   ksh(2800)             → "KSh 2,800"          (treat as KSH)
 *   ksh(20, 'USD')        → "KSh 2,580"          (convert USD → KSH)
 *   ksh(2800, 'KSH')      → "KSh 2,800"
 *   ksh(2800, false)      → "KSh 2,800"          (legacy: no decimals)
 *   ksh(2800, true)       → "KSh 2,800.00"       (legacy: with decimals)
 */
export function ksh(amount, currencyOrDecimals = false) {
  if (amount == null || isNaN(amount)) return 'KSh 0';

  let value = Number(amount);
  let decimals = false;

  if (typeof currencyOrDecimals === 'string') {
    value = toKsh(value, currencyOrDecimals);
  } else {
    // legacy boolean usage: ksh(price, true/false)
    decimals = Boolean(currencyOrDecimals);
  }

  const formatted = value.toLocaleString('en-KE', {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  });
  return `KSh ${formatted}`;
}
