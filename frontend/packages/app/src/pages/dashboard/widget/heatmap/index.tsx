/**
 * External dependencies.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { MultiSelect } from "@rtcamp/frappe-ui-react";
import type { MultiSelectOption } from "@rtcamp/frappe-ui-react";
import { cva } from "class-variance-authority";
import { addWeeks, endOfWeek, format, parseISO, startOfWeek } from "date-fns";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { HeatmapCardSkeleton } from "./skeleton";
import type { AllocationHeatmapResponse, RoleAllocationWeek } from "./types";

export type HeatmapCellState = "full" | "partial" | "none";

const API_DATE_FORMAT = "yyyy-MM-dd";
const WEEK_COUNT = 16;
const WEEK_OPTIONS = { weekStartsOn: 1 } as const; // Monday, matches backend

// Designations matching any of these entries are pre-selected on first load.
const DEFAULT_ROLES = [
  "L1 - Software Engineer",
  "L2 - Software Engineer",
  "L3 - Senior Software Engineer",
  "L4 - Senior Software Engineer",
  "L5 - Senior Software Engineer",
  "L6 - Senior Software Engineer",
  "L7 - Engineering Manager",
  "L8 - Engineering Manager",
  "L7 - Staff Engineer",
  "L8 - Principal Engineer",
  "L1 - Quality Engineer",
  "L2 - Quality Engineer",
  "L3 - Senior Quality Engineer",
  "L4 - Senior Quality Engineer",
  "L5 - Senior Quality Engineer",
  "L6 - Quality Engineering Manager",
  "L1 - Project Coordinator",
  "L2 - Project Manager",
  "L3 - Project Manager",
  "L4 - Senior Project Manager",
  "L5 - Senior Project Manager",
  "L6 - Senior Project Manager",
  "L7 - Principal Project Manager",
  "L1 - Technical Support Engineer",
  "L2 - Technical Support Engineer",
  "L3 - Senior Technical Support Engineer",
  "L4 - Senior Technical Support Engineer",
  "L5 - Technical Support Engineer Manager",
  "L1 - Systems Engineer",
  "L2 - Systems Engineer",
  "L3 - Senior Systems Engineer",
  "L4 - Senior Systems Engineer",
  "L5 - Senior Systems Engineer",
  "L6 - Systems Engineering Manager",
  "L5 - Senior Growth Engineer",
  "L2 - Growth Engineer",
  "L1 - Growth Engineer",
];

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
    const start = startOfWeek(new Date(), WEEK_OPTIONS);
    return {
      from_date: format(start, API_DATE_FORMAT),
      to_date: format(
        endOfWeek(addWeeks(start, WEEK_COUNT - 1), WEEK_OPTIONS),
        API_DATE_FORMAT,
      ),
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

  const defaultsApplied = useRef(false);
  useEffect(() => {
    if (defaultsApplied.current) return;
    const roles = data?.message.roles;
    if (!roles) return;
    defaultsApplied.current = true;
    const defaults = roles
      .map((role) => role.designation)
      .filter((designation) =>
        DEFAULT_ROLES.some((keyword) =>
          designation.toLowerCase().includes(keyword.toLowerCase()),
        ),
      );
    if (defaults.length) setSelectedRoles(defaults);
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
      <div className="flex shrink-0 justify-center gap-8 mt-1">
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
