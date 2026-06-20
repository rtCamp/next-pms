/**
 * External dependencies.
 */
import { MonthPicker } from "@rtcamp/frappe-ui-react";
import { SmallDown } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { KpiCard } from "../kpiCard";
import { KpiCardSkeleton } from "./kpiCardSkeleton";
import type { LeadershipKpiConfig } from "./types";
import { useLeadershipKpi } from "./useLeadershipKpi";

const INLINE_PICKER_CLASS =
  "h-auto! w-auto! justify-center! gap-0.5 bg-transparent! p-0! text-sm text-ink-gray-5! hover:bg-transparent!";

export function LeadershipKpiCard({ config }: { config: LeadershipKpiConfig }) {
  const { month, setMonth, cardData } = useLeadershipKpi(config);

  if (!cardData) return <KpiCardSkeleton />;

  return (
    <KpiCard
      {...cardData}
      comparisonSlot={
        <span className="flex min-w-0 items-center gap-1 text-ink-gray-5">
          vs
          <MonthPicker
            value={month}
            onChange={setMonth}
            inputIcon={SmallDown}
            className={INLINE_PICKER_CLASS}
          />
        </span>
      }
    />
  );
}
