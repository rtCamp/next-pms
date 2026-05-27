/**
 * External dependencies.
 */
import { cva, type VariantProps } from "class-variance-authority";

const statusDotVariants = cva("relative size-3.5 shrink-0 rounded-full", {
  variants: {
    status: {
      "To-do": "bg-gray-500",
      "In Progress": "bg-amber-500",
      Escalated: "bg-blue-500",
      Blocked: "bg-red-500",
      Mitigated: "bg-green-500",
    },
  },
});

interface StatusDotProps extends VariantProps<typeof statusDotVariants> {
  className?: string;
}

function StatusDot({ status, className }: StatusDotProps) {
  return (
    <span className={statusDotVariants({ status, className })}>
      <span className="absolute inset-0 m-auto size-1.5 rounded-full bg-white" />
    </span>
  );
}

interface RiskStatusBadgeProps {
  status: string | null | undefined;
  className?: string;
}

export function RiskStatusBadge({ status, className }: RiskStatusBadgeProps) {
  if (!status) return <span className={className}>—</span>;
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <StatusDot
        status={status as VariantProps<typeof statusDotVariants>["status"]}
      />
      {status}
    </div>
  );
}
