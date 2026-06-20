/**
 * External dependencies.
 */
import { useMemo, useState } from "react";
import { MultiSelect } from "@rtcamp/frappe-ui-react";
import type { MultiSelectOption } from "@rtcamp/frappe-ui-react";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { ForecastBreakdownCardSkeleton } from "./skeleton";
import type { ForecastBreakdownResponse } from "./types";

export default function ForecastBreakdownCard() {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

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
  const toPct = (value: number) =>
    total > 0 ? Math.round((value / total) * 100) : 0;

  const segments = [
    {
      key: "allocated",
      label: "Allocated hours",
      value: toPct(totals.allocated),
      colorClass: "bg-surface-green-5",
    },
    {
      key: "tentative",
      label: "Tentatively allocated hours",
      value: toPct(totals.tentative),
      colorClass: "bg-surface-green-4",
    },
    {
      key: "unallocated",
      label: "Unallocated hours",
      value: toPct(totals.unallocated),
      colorClass: "bg-surface-gray-3",
    },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-outline-gray-1 bg-surface-cards p-4">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-ink-gray-8">
          Forecast breakdown
        </h3>
        <div className="w-44 shrink-0">
          <MultiSelect
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
            className={`${segment.colorClass} h-full`}
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
                className={`size-2 shrink-0 rounded-full ${segment.colorClass}`}
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
    </div>
  );
}
