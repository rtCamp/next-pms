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
  const date = new Date(isoDate);
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
