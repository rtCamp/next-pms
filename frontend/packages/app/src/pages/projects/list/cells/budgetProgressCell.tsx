/**
 * External dependencies.
 */
import { Progress } from "@rtcamp/frappe-ui-react";
import { cva, type VariantProps } from "class-variance-authority";

const budgetProgressVariants = cva("", {
  variants: {
    tier: {
      healthy: "bg-surface-green-2! [&>div]:bg-surface-green-5!",
      moderate: "bg-surface-amber-2! [&>div]:bg-surface-amber-5!",
      over: "bg-surface-red-3! [&>div]:bg-surface-red-5!",
    },
  },
});

type BudgetTier = NonNullable<
  VariantProps<typeof budgetProgressVariants>["tier"]
>;

function budgetTier(percent: number): BudgetTier {
  if (percent > 100) return "over";
  if (percent >= 70) return "moderate";
  return "healthy";
}

export function BudgetProgressCell({ percent }: { percent: number }) {
  const tier = budgetTier(percent);
  return (
    <div className="w-full">
      <Progress
        value={Math.min(percent, 100)}
        size="md"
        className={budgetProgressVariants({ tier })}
      />
    </div>
  );
}
