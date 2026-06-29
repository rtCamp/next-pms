/**
 * External dependencies.
 */
import { useMemo, useState } from "react";
import { MultiSelect } from "@rtcamp/frappe-ui-react";
import type { MultiSelectOption } from "@rtcamp/frappe-ui-react";
import { cva } from "class-variance-authority";
import {
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { HeatmapCardSkeleton } from "./skeleton";
import type { AllocationHeatmapResponse, RoleAllocationWeek } from "./types";

export type HeatmapCellState = "full" | "partial" | "none";

const API_DATE_FORMAT = "yyyy-MM-dd";

const STATE_BG: Record<HeatmapCellState, string> = {
  full: "bg-surface-gray-3",
  partial: "bg-surface-red-4",
  none: "bg-heatmap-red",
};

const cellVariants = cva("block h-[7px] w-full rounded-[2px]", {
  variants: { state: STATE_BG },
});

const LEGEND: { label: string; state: HeatmapCellState }[] = [
  { label: "Fully allocated", state: "full" },
  { label: "Partial allocation", state: "partial" },
  { label: "No allocation", state: "none" },
];

function getCellState(week: RoleAllocationWeek): HeatmapCellState {
  if (week.capacity_hours <= 0 || week.allocated_hours <= 0) return "none";
  if (week.allocated_hours >= week.capacity_hours) return "full";
  return "partial";
}

export default function HeatmapCard() {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const args = useMemo(() => {
    const now = new Date();
    return {
      from_date: format(startOfMonth(subMonths(now, 3)), API_DATE_FORMAT),
      to_date: format(endOfMonth(subMonths(now, 1)), API_DATE_FORMAT),
    };
  }, []);

  const { data, isLoading } = useFrappeGetCall<AllocationHeatmapResponse>(
    "next_pms.api.dashboard.get_allocation_heatmap",
    args,
  );

  const roleOptions = useMemo<MultiSelectOption[]>(
    () =>
      (data?.message.roles ?? []).map((role) => ({
        value: role.designation,
        label: role.designation,
      })),
    [data],
  );

  const monthGroups = useMemo(() => {
    const groups: { label: string; span: number }[] = [];
    for (const week of data?.message.weeks ?? []) {
      const label = format(parseISO(week.week_start), "MMM");
      const last = groups.at(-1);
      if (last?.label === label) last.span += 1;
      else groups.push({ label, span: 1 });
    }
    return groups;
  }, [data]);

  if (isLoading || !data) return <HeatmapCardSkeleton />;

  const { weeks, roles } = data.message;
  const visibleRoles = selectedRoles.length
    ? roles.filter((role) => selectedRoles.includes(role.designation))
    : roles;
  const allRolesSelected =
    selectedRoles.length === 0 || selectedRoles.length === roleOptions.length;

  return (
    <>
      <div className="flex shrink-0 items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-ink-gray-8">Heatmap</h3>
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
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        {visibleRoles.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-gray-5">
            No allocation data for this period.
          </p>
        ) : (
          <table className="w-full table-fixed border-separate border-spacing-x-0.5 border-spacing-y-0">
            <colgroup>
              <col className="w-40" />
              {weeks.map((week) => (
                <col key={week.week_start} />
              ))}
            </colgroup>
            <thead>
              <tr className="h-[25px]">
                <th />
                {monthGroups.map((group) => (
                  <th
                    key={group.label}
                    colSpan={group.span}
                    className="p-0 text-left align-middle text-2xs font-normal text-ink-gray-5"
                  >
                    {group.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRoles.map((role) => (
                <tr key={role.designation} className="h-[25px]">
                  <th
                    scope="row"
                    className="truncate p-0 pr-2 text-left align-middle text-2xs font-normal text-ink-gray-5"
                    title={role.designation}
                  >
                    {role.designation}
                  </th>
                  {role.weeks.map((week) => {
                    const state = getCellState(week);
                    return (
                      <td key={week.week_start} className="p-0 align-middle">
                        <span
                          className={cellVariants({ state })}
                          aria-label={`${role.designation} week of ${week.week_start}: ${state}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="flex shrink-0 justify-center gap-8">
        {LEGEND.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span
              className={`size-2 shrink-0 rounded-full ${STATE_BG[item.state]}`}
            />
            <span className="text-sm text-ink-gray-6">{item.label}</span>
          </div>
        ))}
      </div>
    </>
  );
}
