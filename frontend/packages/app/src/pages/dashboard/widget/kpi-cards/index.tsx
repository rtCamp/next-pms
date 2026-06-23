/**
 * External dependencies.
 */
import { mergeClassNames } from "@next-pms/design-system";
import { MonthPicker } from "@rtcamp/frappe-ui-react";
import { SmallDown } from "@rtcamp/frappe-ui-react/icons";
import { ArrowDownLeft, ArrowUpRight } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { currencyFormat } from "@/lib/utils";
import { KpiCardSkeleton } from "./skeleton";
import { LeadershipKPIResponse } from "./types";
import { useLeadershipKpi } from "./useLeadershipKpi";

const KPI_LABELS: Record<keyof LeadershipKPIResponse["message"], string> = {
  revenue: "Last month’s revenue",
  cost: "Last month’s cost",
  profit_margin: "Last month’s profit margin",
};

export default function LeadershipKpiCard({
  kpikey,
}: {
  kpikey: keyof LeadershipKPIResponse["message"];
}) {
  const { month, setMonth, data, isLoading } = useLeadershipKpi(kpikey);

  if (isLoading) return <KpiCardSkeleton />;

  const TrendArrow = data?.trend === "up" ? ArrowUpRight : ArrowDownLeft;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-outline-gray-1 bg-surface-cards p-3">
      <span className="truncate text-base text-ink-gray-5">
        {KPI_LABELS[kpikey]}
      </span>
      <span className="truncate text-2xl font-medium text-ink-gray-8">
        {data
          ? kpikey === "profit_margin"
            ? `${data.current.toFixed(2)}%`
            : currencyFormat("USD").format(data.current)
          : "—"}
      </span>
      <div className="flex items-center gap-1 text-sm">
        <span
          className={mergeClassNames(
            "flex",
            data?.trend === "up" ? "text-ink-green-4" : "text-ink-red-4",
          )}
        >
          <TrendArrow className="size-4 shrink-0" />
          {data?.change_pct == null ? "—" : `${data.change_pct.toFixed(2)}%`}
        </span>
        <span className="flex min-w-0 items-center gap-1 text-ink-gray-5">
          vs
          <MonthPicker
            value={month}
            onChange={setMonth}
            inputIcon={SmallDown}
            className="h-auto! w-auto! justify-center! gap-0.5 bg-transparent! p-0! text-sm text-ink-gray-5! hover:bg-transparent!"
          />
        </span>
      </div>
    </div>
  );
}
