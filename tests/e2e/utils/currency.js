// The locales the app formats each currency with; see currencyFormat() in its lib/utils.ts.
const LOCALES = { EUR: "de-DE", INR: "en-IN", USD: "en-US" };

export const SYMBOLS = { EUR: "€", INR: "₹", USD: "$" };

/** An amount as the app prints it, e.g. 200000 in INR is "₹2,00,000.00". */
export const formatMoney = (amount, currency = "INR") =>
  new Intl.NumberFormat(LOCALES[currency] ?? "en-IN", {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

/** The number inside a printed amount, e.g. "₹2,00,000.00" is 200000. */
export const moneyValue = (text) => Number(text.replace(/[^\d.-]/g, ""));

/** A percentage as the app prints it: at most two decimals, trailing zeros dropped. */
export const formatPercent = (value) => `${Number(value.toFixed(2))}%`;
