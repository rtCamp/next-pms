type NumericValue = number | string | null | undefined;

/** A number with at most two decimals; `"0"` for empty or non-numeric values. */
export function formatNumber(value: NumericValue): string {
  if (value === null || value === undefined || value === "") return "0";
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return `${Number(number.toFixed(2))}`;
}

/** Hours with a suffix, e.g. `formatHours(1.5)` → `"1.5h"`. */
export function formatHours(value: NumericValue, suffix = "h"): string {
  return `${formatNumber(value)}${suffix}`;
}

/** Decimal hours to `HH:MM`, e.g. `floatToTime(1.5)` → `"01:30"`. */
export function floatToTime(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** A percentage with at most two decimals, e.g. `formatPercentage(12.5)` → `"12.5%"`. */
export function formatPercentage(value: NumericValue): string {
  return `${formatNumber(value)}%`;
}

const CURRENCY_LOCALES: Record<string, string> = {
  AED: "ar-AE",
  AUD: "en-AU",
  CHF: "de-CH",
  CNY: "zh-CN",
  EUR: "de-DE",
  GBP: "en-GB",
  INR: "en-IN",
  JPY: "ja-JP",
  USD: "en-US",
};

const ZERO_DECIMAL_CURRENCIES = ["JPY", "KRW", "VND", "IDR"];

/**
 * An amount in the currency's own number format and symbol, e.g.
 * `formatCurrency(1234.5, "USD")` → `"$1,234.50"`. Unlisted currencies use the Indian format.
 */
export function formatCurrency(
  value: number,
  currencyCode?: string | null,
): string {
  const currency = currencyCode || "INR";
  const fractionDigits = ZERO_DECIMAL_CURRENCIES.includes(currency) ? 0 : 2;
  return new Intl.NumberFormat(CURRENCY_LOCALES[currency] ?? "en-IN", {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}
