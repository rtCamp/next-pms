export function PercentCell({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return (
      <span className="block truncate text-ink-gray-7 text-base">N/A</span>
    );
  }

  return (
    <span className="block truncate text-ink-gray-7 text-base">
      {`${value.toFixed(2)}%`}
    </span>
  );
}
