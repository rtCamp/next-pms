/**
 * External dependencies.
 */
import {
  SolidPriorityLow,
  SolidPriorityMedium,
  SolidPriorityHigh,
} from "@rtcamp/frappe-ui-react/icons";
import { cva, type VariantProps } from "class-variance-authority";

/**
 * Internal dependencies.
 */
import { mergeClassNames as cn } from "@/lib/utils";

const riskLevelVariants = cva(
  "flex items-center gap-1 text-sm shrink-0 rounded-full px-2 py-1",
  {
    variants: {
      level: {
        Low: "text-green-700 bg-surface-green-2",
        Medium: "text-amber-700 bg-surface-amber-2",
        High: "text-red-600 bg-surface-red-2",
      },
    },
  },
);

interface RiskLevelBadgeProps {
  level: string | null | undefined;
  className?: string;
}

const LEVEL_ICONS = {
  Low: SolidPriorityLow,
  Medium: SolidPriorityMedium,
  High: SolidPriorityHigh,
} as const;

export function RiskLevelBadge({ level, className }: RiskLevelBadgeProps) {
  if (!level) return null;
  const Icon =
    LEVEL_ICONS[level as keyof typeof LEVEL_ICONS] ?? SolidPriorityHigh;
  return (
    <div
      className={cn(
        riskLevelVariants({
          level: level as VariantProps<typeof riskLevelVariants>["level"],
        }),
        className,
      )}
    >
      <Icon className="size-3.5" />
      <span>{level} risk</span>
    </div>
  );
}
