/**
 * Internal dependencies.
 */
import { STATUS_DOT_COLORS } from "./constants";
import type { RiskStatus } from "./constants";

interface RiskStatusBadgeProps {
  status: string | null | undefined;
  className?: string;
}

export function RiskStatusBadge({ status, className }: RiskStatusBadgeProps) {
  if (!status) return <span className={className}>—</span>;
  return (
    <span className={`flex items-center gap-2 ${className ?? ""}`}>
      <div className="relative size-3.5 shrink-0">
        <span
          className={`absolute inset-0 rounded-full ${STATUS_DOT_COLORS[status as RiskStatus] ?? "bg-ink-gray-4"}`}
        />
        <span className="absolute inset-0 m-auto bg-white rounded-full size-1.5" />
      </div>
      {status}
    </span>
  );
}
