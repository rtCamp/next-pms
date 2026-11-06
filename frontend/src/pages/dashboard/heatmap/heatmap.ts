import { dayjs } from "frappe-ui";

export interface HeatmapWeek {
  week_start: string;
  week_end: string;
}

export interface RoleAllocationWeek extends HeatmapWeek {
  capacity_hours: number;
  allocated_hours: number;
}

export interface RoleAllocation {
  designation: string;
  weeks: RoleAllocationWeek[];
}

/** `get_allocation_heatmap`. */
export interface AllocationHeatmap {
  weeks: HeatmapWeek[];
  roles: RoleAllocation[];
}

export type HeatmapCellState = "full" | "partial" | "none";

export const HEATMAP_WEEKS = 16;

export const HEATMAP_LEGEND: { label: string; state: HeatmapCellState }[] = [
  { label: "Fully allocated", state: "full" },
  { label: "Partial allocation", state: "partial" },
  { label: "No allocation", state: "none" },
];

/**
 * Designations pre-selected on first load when the saved filter is empty, matched as
 * case-insensitive substrings. Hard-coded as in the React app.
 */
export const DEFAULT_HEATMAP_ROLES = [
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

/** The 16 Monday-to-Sunday weeks from the current one, as API dates. */
export function heatmapRange(today: Date): Record<string, string> {
  const day = dayjs(today).startOf("day");
  const start = day.subtract((day.day() + 6) % 7, "day");
  const end = start.add(HEATMAP_WEEKS * 7 - 1, "day");
  return {
    from_date: start.format("YYYY-MM-DD"),
    to_date: end.format("YYYY-MM-DD"),
  };
}

export function cellState(week: RoleAllocationWeek): HeatmapCellState {
  if (week.capacity_hours <= 0 || week.allocated_hours <= 0) return "none";
  if (week.allocated_hours >= week.capacity_hours) return "full";
  return "partial";
}

/** Month header cells: consecutive weeks starting in the same month share one. */
export function monthGroups(
  weeks: HeatmapWeek[],
): { label: string; span: number }[] {
  const groups: { label: string; span: number }[] = [];
  for (const week of weeks) {
    const label = dayjs(week.week_start).format("MMM");
    const last = groups.at(-1);
    if (last?.label === label) last.span += 1;
    else groups.push({ label, span: 1 });
  }
  return groups;
}

/** The designations among `roles` that match a default entry. */
export function defaultRoles(roles: RoleAllocation[]): string[] {
  return roles
    .map((role) => role.designation)
    .filter((designation) =>
      DEFAULT_HEATMAP_ROLES.some((entry) =>
        designation.toLowerCase().includes(entry.toLowerCase()),
      ),
    );
}
