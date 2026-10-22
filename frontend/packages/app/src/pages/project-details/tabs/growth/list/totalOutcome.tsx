/**
 * External dependencies.
 */
import { useMemo } from "react";

/**
 * Internal dependencies.
 */
import { currencyFormat } from "@/lib/utils";
import { useProjectDetail } from "@/pages/project-details/context";
import type { GrowthInitiativeItem } from "../types";
import { useClientBilling } from "../useClientBilling";

interface TotalOutcomeProps {
  items: GrowthInitiativeItem[];
}

export function TotalOutcome({ items }: TotalOutcomeProps) {
  const project = useProjectDetail((s) => s.project);
  const { currency } = useClientBilling(
    project?.customer,
    project?.custom_currency,
  );
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.billable_outcome, 0),
    [items],
  );

  return (
    <div className="flex items-baseline gap-2 mb-3.5 px-3 py-2 rounded-lg bg-surface-gray-1 text-base">
      <span className="text-ink-gray-5">Total billable outcome</span>
      <span className="font-semibold text-ink-gray-8">
        {currencyFormat(currency).format(total)}
      </span>
    </div>
  );
}
