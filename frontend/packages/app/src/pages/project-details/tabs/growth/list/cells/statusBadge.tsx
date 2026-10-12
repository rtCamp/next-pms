/**
 * External dependencies.
 */
import { SolidDotLg } from "@rtcamp/frappe-ui-react/icons";
import { cva, type VariantProps } from "class-variance-authority";

const statusDotVariants = cva("size-4 shrink-0", {
  variants: {
    status: {
      Ideation: "text-ink-gray-4",
      "In Progress": "text-ink-amber-3",
      "On Hold": "text-ink-blue-3",
      Closed: "text-ink-green-3",
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
    <div className="flex min-w-0 items-center gap-2">
      <SolidDotLg className={statusDotVariants({ status: variant })} />
      <span className="truncate">{status}</span>
    </div>
  );
}
