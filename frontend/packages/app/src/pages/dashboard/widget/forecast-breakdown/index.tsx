/**
 * External dependencies.
 */
import { useMemo } from "react";
import { mergeClassNames } from "@next-pms/design-system";
import { InfoHoverCard } from "@next-pms/design-system/components";
import { useSavedState } from "@next-pms/hooks";
import { MultiSelect } from "@rtcamp/frappe-ui-react";
import type { MultiSelectOption } from "@rtcamp/frappe-ui-react";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { LEADERSHIP_WIDGET_HELP } from "@/pages/dashboard/help";
import { ForecastBreakdownCardSkeleton } from "./skeleton";
import type { ForecastBreakdownResponse } from "./types";

export default function ForecastBreakdownCard() {
  const [selectedRoles, setSelectedRoles] = useSavedState(
    "forecastRoles",
    [] as string[],
  );

  const { data, isLoading } = useFrappeGetCall<ForecastBreakdownResponse>(
    "next_pms.api.dashboard.get_forecast_breakdown",
    { days: 30 },
  );

  const roleOptions = useMemo<MultiSelectOption[]>(
    () =>
      (data?.message.roles ?? []).map((role) => ({
        value: role.designation,
        label: role.designation,
      })),
    [data],
  );

  if (isLoading || !data) return <ForecastBreakdownCardSkeleton />;

  const { roles } = data.message;
  const visibleRoles = selectedRoles.length
    ? roles.filter((role) => selectedRoles.includes(role.designation))
    : roles;
  const allRolesSelected =
    selectedRoles.length === 0 || selectedRoles.length === roleOptions.length;

  const totals = visibleRoles.reduce(
    (acc, role) => ({
      allocated: acc.allocated + role.allocated_hours,
      tentative: acc.tentative + role.tentative_hours,
      unallocated: acc.unallocated + role.unallocated_hours,
    }),
    { allocated: 0, tentative: 0, unallocated: 0 },
  );
  const total = totals.allocated + totals.tentative + totals.unallocated;
  // Largest-remainder rounding, so the three percentages always add up to 100.
  const exact = [totals.allocated, totals.tentative, totals.unallocated].map(
    (value) => (total > 0 ? (value / total) * 100 : 0),
  );
  const pcts = exact.map(Math.floor);
  const leftover =
    total > 0 ? 100 - pcts.reduce((sum, pct) => sum + pct, 0) : 0;
  exact
    .map((value, index) => ({ index, fraction: value - pcts[index] }))
    .sort((a, b) => b.fraction - a.fraction)
    .slice(0, leftover)
    .forEach(({ index }) => (pcts[index] += 1));

  const segments = [
    {
      key: "allocated",
      label: "Allocated hours",
      value: pcts[0],
      colorClass: "bg-surface-green-5",
    },
    {
      key: "tentative",
      label: "Tentatively allocated hours",
      value: pcts[1],
      colorClass: "bg-surface-green-4",
    },
    {
      key: "unallocated",
      label: "Unallocated hours",
      value: pcts[2],
      colorClass: "bg-surface-gray-3",
    },
  ];

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-1.5">
          <h3 className="text-lg font-semibold text-ink-gray-8">
            Forecast breakdown for the next month
          </h3>
          <InfoHoverCard help={LEADERSHIP_WIDGET_HELP.forecast} />
        </div>
        <div className="w-44 shrink-0">
          <MultiSelect
            popupClassName="scrollbar-thin"
            options={roleOptions}
            value={selectedRoles}
            triggerLabel={
              allRolesSelected
                ? "All roles"
                : `${selectedRoles.length} role${selectedRoles.length === 1 ? "" : "s"} selected`
            }
            onChange={setSelectedRoles}
          />
        </div>
      </div>
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
        {segments.map((segment) => (
          <div
            key={segment.key}
            className={mergeClassNames(segment.colorClass, "h-full")}
            style={{ width: `${segment.value}%` }}
          />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {segments.map((segment) => (
          <div
            key={segment.key}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={mergeClassNames(
                  "size-2 shrink-0 rounded-full",
                  segment.colorClass,
                )}
              />
              <span className="truncate text-base text-ink-gray-6">
                {segment.label}
              </span>
            </div>
            <span className="text-base font-medium text-ink-gray-7">
              {segment.value}%
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
