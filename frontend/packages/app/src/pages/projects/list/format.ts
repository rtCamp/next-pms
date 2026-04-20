const DATE_WITH_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const DATE_NO_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export function formatProjectDate(isoDate: string): string {
  // Parse YYYY-MM-DD as a local date, not UTC. `new Date("2026-01-10")` is
  // parsed as UTC midnight, then formatted in the viewer's local timezone —
  // in UTC-5 that renders as "Jan 9". Splitting into y/m/d and constructing
  // via Date(y, m, d) anchors to local midnight and keeps the displayed day
  // stable across timezones.
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const currentYear = new Date().getFullYear();
  return date.getFullYear() === currentYear
    ? DATE_NO_YEAR.format(date)
    : DATE_WITH_YEAR.format(date);
}

// TODO(next-pms): replace hardcoded USD with the global-default currency
// once the BE integration issue lands.
const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return CURRENCY_FORMATTER.format(amount);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}
