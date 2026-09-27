/**
 * External dependencies.
 */
import {
  SolidPriorityLow,
  SolidPriorityMedium,
  SolidPriorityHigh,
} from "@rtcamp/frappe-ui-react/icons";
import { cva, type VariantProps } from "class-variance-authority";

const priorityVariants = cva(
  "inline-flex items-center gap-1 text-sm shrink-0 rounded-full px-2 py-1",
  {
    variants: {
      priority: {
        Low: "text-green-700 bg-surface-green-2",
        Medium: "text-amber-700 bg-surface-amber-2",
        High: "text-red-600 bg-surface-red-2",
      },
    },
  },
);

type Priority = NonNullable<VariantProps<typeof priorityVariants>["priority"]>;

const PRIORITY_ICONS: Record<Priority, typeof SolidPriorityLow> = {
  Low: SolidPriorityLow,
  Medium: SolidPriorityMedium,
  High: SolidPriorityHigh,
};

interface PriorityBadgeProps {
  priority: string | null | undefined;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  if (!priority || !(priority in PRIORITY_ICONS)) return <span>—</span>;
  const Icon = PRIORITY_ICONS[priority as Priority];
  return (
    <span className={priorityVariants({ priority: priority as Priority })}>
      <Icon className="size-3.5" />
      <span>{priority}</span>
    </span>
  );
}
