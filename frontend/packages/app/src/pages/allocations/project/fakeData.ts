// TODO: Delete this file and replace usages with real data.
import type { ProjectGroup } from "@next-pms/design-system/components";
import { addDays, addMonths, addWeeks, startOfWeek } from "date-fns";
import type { AllocationsDuration } from "../types";

const shellBaseDate = new Date(2026, 4, 18);

const weekCountByDuration: Record<AllocationsDuration, number> = {
  "this-week": 1,
  "this-month": 4,
  "this-quarter": 13,
};

export const projectAllocationShellMembers: Member[] = [];
export const projectAllocationShellProjects: ProjectGroup[] = [
  {
    id: "project-atlas",
    name: "Project Atlas",
    client: "Acme Corp",
    members: [
      {
        id: "member-ada",
        name: "Ada Lovelace",
        designation: "Product Designer",
        allocations: [
          {
            hours: 6,
            startDate: addDays(shellBaseDate, 1),
            endDate: addDays(shellBaseDate, 3),
            billable: true,
          },
        ],
      },
      {
        id: "member-grace",
        name: "Grace Hopper",
        designation: "Frontend Engineer",
        allocations: [
          {
            hours: 4,
            startDate: addDays(shellBaseDate, 4),
            endDate: addDays(shellBaseDate, 8),
            billable: true,
          },
        ],
      },
    ],
  },
];

export function getProjectAllocationShellStartDate() {
  return startOfWeek(shellBaseDate, { weekStartsOn: 1 });
}

export function getProjectAllocationWeekCount(duration: AllocationsDuration) {
  return weekCountByDuration[duration];
}

export function moveProjectAllocationShellDate(
  anchorDate: Date,
  duration: AllocationsDuration,
  direction: "previous" | "next",
) {
  const delta = direction === "next" ? 1 : -1;

  if (duration === "this-week") {
    return addWeeks(anchorDate, delta);
  }

  if (duration === "this-month") {
    return addMonths(anchorDate, delta);
  }

  return addMonths(anchorDate, delta * 3);
}
