/**
 * External dependencies.
 */
import { cva, type VariantProps } from "class-variance-authority";

const statusDotVariants = cva("relative size-3.5 shrink-0 rounded-full", {
  variants: {
    status: {
      Ideation: "bg-gray-500",
      "In Progress": "bg-amber-500",
      "On Hold": "bg-blue-500",
      Closed: "bg-green-500",
    },
  },
  defaultVariants: { status: "Ideation" },
});

type KnownStatus = NonNullable<
  VariantProps<typeof statusDotVariants>["status"]
>;

const KNOWN_STATUSES: readonly string[] = [
  "Ideation",
  "In Progress",
  "On Hold",
  "Closed",
];

interface StatusBadgeProps {
  status: string | null | undefined;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) return <span>—</span>;
  const variant = KNOWN_STATUSES.includes(status)
    ? (status as KnownStatus)
    : undefined;
  return (
    <div className="flex items-center gap-2">
      <span className={statusDotVariants({ status: variant })}>
        <span className="absolute inset-0 m-auto size-1.5 rounded-full bg-white" />
      </span>
      <span className="truncate">{status}</span>
    </div>
  );
}
