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
