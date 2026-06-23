/**
 * Internal dependencies.
 */
import { currencyFormat } from "@/lib/utils";

export function CurrencyCell({
  value,
  currency,
}: {
  value: number | null | undefined;
  currency?: string;
}) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return (
      <span className="block truncate text-ink-gray-6 text-base">N/A</span>
    );
  }

  return (
    <span className="block truncate text-ink-gray-6 text-base">
      {currencyFormat(currency).format(value)}
    </span>
  );
}
