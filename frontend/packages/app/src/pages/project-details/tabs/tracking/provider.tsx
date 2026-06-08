import { useMemo, type PropsWithChildren } from "react";
import { useFrappeGetCall } from "frappe-react-sdk";
import { currencyFormat } from "@/lib/utils";
import {
  DEFAULT_TRACKING,
  TrackingContext,
  type Response,
  type Tracking,
  type TrackingContextProps,
} from "./context";
import type { ContractRow, RateRow } from "./types";
import { useProjectDetail } from "../../context";

export function TrackingProvider({ children }: PropsWithChildren) {
  const projectId = useProjectDetail((s) => s.projectId);

  const { data } = useFrappeGetCall<Response>(
    "next_pms.next_projects.api.project.get_project_tracking",
    {
      project: projectId,
    },
  );

  const tracking = useMemo<Tracking>(
    () => data?.message ?? DEFAULT_TRACKING,
    [data],
  );

  const value = useMemo<TrackingContextProps>(() => {
    const formatter = currencyFormat(tracking.currency);

    const contracts: ContractRow[] | null = tracking.contracts
      ? tracking.contracts.map((c, i) => ({
          id: c.sales_order || c.sales_invoice || `${i}`,
          startDate: c.start_date,
          endDate: c.end_date,
          hoursBought: `${c.hours_purchased}`,
          hoursUsed: `${c.consumed_hours}`,
          hoursLeft: `${c.remaining_hours}`,
          salesOrder: c.sales_order,
          salesInvoice: c.sales_invoice,
        }))
      : null;

    const [flatRateEntry, ...rateEntries] = tracking.project_rates ?? [];

    const rates: RateRow[] | null = tracking.project_rates
      ? rateEntries.map((rate) => ({
          id: rate.employee ?? "",
          name: rate.employee_name ?? rate.employee ?? "",
          rateLabel: "Hourly rate",
          amount: `${formatter.format(rate.hourly_billing_rate ?? 0)}/h`,
          date: rate.valid_from ?? "",
        }))
      : null;

    const flatRate = flatRateEntry
      ? {
          amount: `${formatter.format(flatRateEntry.flat_rate_hourly ?? 0)}/h`,
          date: flatRateEntry.flat_rate_valid_from ?? "",
        }
      : undefined;

    return { tracking, contracts, rates, flatRate };
  }, [tracking]);

  return (
    <TrackingContext.Provider value={value}>
      {children}
    </TrackingContext.Provider>
  );
}
