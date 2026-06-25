/**
 * External dependencies.
 */
import { MonthPicker } from "@rtcamp/frappe-ui-react";
import { SmallDown } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { currencyFormat } from "@/lib/utils";
import { KpiCardSkeleton } from "./skeleton";
import { LeadershipKPIResponse } from "./types";
import { useLeadershipKpi } from "./useLeadershipKpi";

const KPI_LABELS: Record<keyof LeadershipKPIResponse["message"], string> = {
  revenue: "Revenue",
  cost: "Cost",
  profit_margin: "Profit margin",
};

export default function LeadershipKpiCard({
  kpikey,
}: {
  kpikey: keyof LeadershipKPIResponse["message"];
}) {
  const { month, setMonth, data, isLoading } = useLeadershipKpi(kpikey);

  if (isLoading) return <KpiCardSkeleton />;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-outline-gray-1 bg-surface-cards p-3">
      <div className="w-full flex justify-between">
        <span className="truncate text-base text-ink-gray-5">
          {KPI_LABELS[kpikey]}
        </span>
        <MonthPicker
          value={month}
          onChange={setMonth}
          inputIcon={SmallDown}
          className="h-auto! w-auto! justify-center! gap-0.5 bg-transparent! p-0! text-sm text-ink-gray-5! hover:bg-transparent!"
        />
      </div>

      <span className="truncate text-2xl font-medium text-ink-gray-8">
        {data
          ? kpikey === "profit_margin"
            ? `${data.current.toFixed(2)}%`
            : currencyFormat("USD").format(data.current)
          : "—"}
      </span>
    </div>
  );
}
