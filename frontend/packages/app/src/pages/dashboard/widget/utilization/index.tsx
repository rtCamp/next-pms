/**
 * External dependencies.
 */
import { mergeClassNames } from "@next-pms/design-system";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import type { TimeUtilisationResponse } from "./types";
import { UtilisationDonut } from "./utilisationDonut";
import { UtilisedTimeCardSkeleton } from "./utilisedTimeCardSkeleton";

export default function UtilisedTimeCard() {
  const { data, isLoading } = useFrappeGetCall<TimeUtilisationResponse>(
    "next_pms.api.dashboard.get_time_utilisation",
    { days: 30 },
  );

  if (isLoading || !data) return <UtilisedTimeCardSkeleton />;

  const { billable_hours, non_billable_hours, total_hours } = data.message;
  const billablePct =
    total_hours > 0 ? Math.round((billable_hours / total_hours) * 100) : 0;
  const nonBillablePct =
    total_hours > 0 ? Math.round((non_billable_hours / total_hours) * 100) : 0;

  const legend = [
    {
      label: "Billable hours",
      value: billablePct,
      dotClass: "bg-surface-blue-5",
    },
    {
      label: "Non-billable hours",
      value: nonBillablePct,
      dotClass: "bg-surface-blue-4",
    },
  ];

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-ink-gray-8">
          Utilised time in the past 30 days
        </h3>
      </div>
      <div className="flex items-center gap-8">
        <UtilisationDonut
          segments={[
            { value: billablePct, colorClass: "text-surface-blue-5" },
            { value: nonBillablePct, colorClass: "text-surface-blue-4" },
          ]}
        />
        <div className="flex grow flex-col gap-3">
          {legend.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={mergeClassNames(
                    "size-2 shrink-0 rounded-full",
                    item.dotClass,
                  )}
                />
                <span className="truncate text-base text-ink-gray-6">
                  {item.label}
                </span>
              </div>
              <span className="text-base font-medium text-ink-gray-6">
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
