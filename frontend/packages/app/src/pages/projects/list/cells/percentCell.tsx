import { formatPercentage } from "@/lib/utils";

export function PercentCell({ value }: { value: number | null | undefined }) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return (
      <span className="block truncate text-ink-gray-6 text-base">N/A</span>
    );
  }

  return (
    <span className="block truncate text-ink-gray-6 text-base">
      {formatPercentage(value)}
    </span>
  );
}
