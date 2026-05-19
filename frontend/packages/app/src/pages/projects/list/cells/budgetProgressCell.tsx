/**
 * External dependencies.
 */
import { ProgressBar } from "@next-pms/design-system/components";
import { cva, type VariantProps } from "class-variance-authority";

const budgetSecondaryVariants = cva("", {
  variants: {
    tier: {
      healthy: "bg-surface-green-2",
      moderate: "bg-surface-amber-2",
      over: "bg-surface-red-3",
    },
  },
});

const budgetIndicatorVariants = cva("", {
  variants: {
    tier: {
      healthy: "bg-surface-green-5",
      moderate: "bg-surface-amber-5",
      over: "bg-surface-red-5",
    },
  },
});

type BudgetTier = NonNullable<
  VariantProps<typeof budgetSecondaryVariants>["tier"]
>;

function budgetTier(percent: number): BudgetTier {
  if (percent > 80) return "over";
  if (percent >= 60) return "moderate";
  return "healthy";
}

export function BudgetProgressCell({
  percent,
  secondaryPercent,
}: {
  percent: number;
  secondaryPercent?: number;
}) {
  const tier = budgetTier(percent);
  return (
    <div className="w-full pr-2">
      <ProgressBar
        value={percent}
        secondaryValue={secondaryPercent}
        size="sm"
        indicatorClassName={budgetIndicatorVariants({ tier })}
        secondaryIndicatorClassName={budgetSecondaryVariants({ tier })}
      />
    </div>
  );
}
