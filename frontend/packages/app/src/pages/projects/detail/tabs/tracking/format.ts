const compactUSD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 0,
});

export const formatCompactUSD = (value: number) =>
  compactUSD.format(value).toLowerCase();
