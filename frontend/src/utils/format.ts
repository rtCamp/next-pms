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
