/**
 * External dependencies.
 */
import { MonthPicker, Skeleton } from "@rtcamp/frappe-ui-react";
import { SmallDown } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { currencyFormat, formatPercentage } from "@/lib/utils";
import { LeadershipKPIResponse } from "./types";
import { useLeadershipKpi } from "./useLeadershipKpi";

const KPI_LABELS: Record<keyof LeadershipKPIResponse["message"], string> = {
  revenue: "Revenue",
  cost: "Cost",
  profit_margin: "Profit margin",
};

export default function LeadershipKpiCard({
  kpikey,
  month,
  onMonthChange,
}: {
  kpikey: keyof LeadershipKPIResponse["message"];
  month: string;
  onMonthChange: (month: string) => void;
}) {
  const { data, isLoading } = useLeadershipKpi(kpikey, month);

  return (
    <>
      <div className="w-full flex justify-between">
        <span className="truncate text-base text-ink-gray-5">
          {KPI_LABELS[kpikey]}
        </span>
        <MonthPicker
          value={month}
          onChange={onMonthChange}
          inputIcon={SmallDown}
          className="h-auto! w-auto! justify-center! gap-0.5 bg-transparent! p-0! text-sm text-ink-gray-5! hover:bg-transparent!"
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-8 w-32" />
      ) : (
        <span className="truncate text-2xl font-medium text-ink-gray-8">
          {data
            ? kpikey === "profit_margin"
              ? formatPercentage(data.current)
              : currencyFormat("USD").format(data.current)
            : "—"}
        </span>
      )}
    </>
  );
}
