export type StatCardData = {
  label: string;
  value: string | number;
  subLabel?: string;
};

export function StatCard({ label, value, subLabel }: StatCardData) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-outline-gray-1 bg-surface-cards p-3">
      <span className="truncate text-base text-ink-gray-5">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-medium text-ink-gray-8">{value}</span>
        {subLabel && (
          <span className="truncate text-base text-ink-gray-5">{subLabel}</span>
        )}
      </div>
    </div>
  );
}
