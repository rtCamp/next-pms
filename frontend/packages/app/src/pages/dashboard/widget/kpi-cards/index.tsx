/**
 * External dependencies.
 */
import { InfoHoverCard } from "@next-pms/design-system/components";
import { MonthPicker, Skeleton } from "@rtcamp/frappe-ui-react";
import { SmallDown } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { currencyFormat, formatPercentage } from "@/lib/utils";
import { LEADERSHIP_KPI_HELP } from "@/pages/dashboard/help";
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
  const { data, isLoading } = useLeadershipKpi(month);

  return (
    <>
      <div className="w-full flex justify-between">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-base text-ink-gray-5">
            {KPI_LABELS[kpikey]}
          </span>
          <InfoHoverCard help={LEADERSHIP_KPI_HELP[kpikey]} />
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
              ? data.revenue.current
                ? formatPercentage(data.profit_margin.current)
                : "N/A"
              : currencyFormat("USD").format(data[kpikey].current)
            : "—"}
        </span>
      )}
    </>
  );
}
