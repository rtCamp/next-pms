/**
 * External dependencies.
 */
import { Progress } from "@rtcamp/frappe-ui-react";
import { type VariantProps } from "class-variance-authority";

/**
 * Internal dependencies.
 */
import { budgetProgressVariants } from "./constants";

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
