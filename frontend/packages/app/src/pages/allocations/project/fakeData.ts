// TODO: Delete this file and replace usages with real data.
import type { ProjectGroup } from "@next-pms/design-system/components";
import { addDays, addMonths, addWeeks, startOfWeek } from "date-fns";
import type { AllocationsDuration } from "../types";

const shellBaseDate = new Date();
const shellWeekStart = startOfWeek(shellBaseDate, { weekStartsOn: 1 });

const weekCountByDuration: Record<AllocationsDuration, number> = {
  "this-week": 1,
  "this-month": 4,
  "this-quarter": 13,
};

function getShellDate(weekOffset: number, dayOffset: number) {
  return addDays(shellWeekStart, weekOffset * 7 + dayOffset);
}

function createShellAllocation(
  hours: number,
  startWeekOffset: number,
  startDayOffset: number,
  endWeekOffset: number,
  endDayOffset: number,
  options?: {
    billable?: boolean;
    tentative?: boolean;
  },
) {
  const { billable = true, tentative = false } = options ?? {};

  return {
    hours,
    startDate: getShellDate(startWeekOffset, startDayOffset),
    endDate: getShellDate(endWeekOffset, endDayOffset),
    billable,
    tentative,
  };
}

const PROJECT_SHELL_COUNT = 10;

const projectAllocationShellTemplates: ProjectGroup[] = [
  {
    id: "atlas-mobile-app-checkout-flow-stabilisation",
    name: "Atlas Mobile App Checkout Flow Stabilisation",
    dateRange: "Jan 11 - Jan 31",
    client: "Atlas Corporation",
    members: [
      {
        id: "member-samantha",
        name: "Samantha Robbins",
        designation: "Product Designer",
        capacity: "20 hrs/week",
        capacityHoursPerDay: 4,
        allocations: [createShellAllocation(4, 0, 0, 0, 4)],
      },
      {
        id: "member-julian",
        name: "Julian Andrews",
        designation: "Frontend Engineer",
        capacity: "20 hrs/week",
        capacityHoursPerDay: 4,
        allocations: [createShellAllocation(4, 0, 0, 0, 4)],
      },
      {
        id: "member-christina",
        name: "Christina Chung",
        designation: "QA Engineer",
        capacity: "15 hrs/week",
        capacityHoursPerDay: 3,
        allocations: [
          createShellAllocation(5, 0, 0, 0, 4, { billable: false }),
        ],
      },
      {
        id: "member-ananya",
        name: "Ananya Bharadwaj",
        designation: "Project Manager",
        capacity: "25 hrs/week",
        capacityHoursPerDay: 5,
        allocations: [createShellAllocation(3, 0, 0, 0, 4)],
      },
    ],
  },
  {
    id: "northstar-onboarding-portal-refresh",
    name: "Northstar Onboarding Portal Refresh",
    dateRange: "Feb 03 - Mar 14",
    client: "Northstar Health",
    members: [
      {
        id: "member-maya",
        name: "Maya Rodriguez",
        designation: "Design Lead",
        capacity: "25 hrs/week",
        capacityHoursPerDay: 5,
        allocations: [createShellAllocation(5, 1, 0, 1, 2)],
      },
      {
        id: "member-nikhil",
        name: "Nikhil Sharma",
        designation: "Backend Engineer",
        capacity: "20 hrs/week",
        capacityHoursPerDay: 4,
        allocations: [
          createShellAllocation(6, 1, 4, 2, 1, {
            billable: false,
            tentative: true,
          }),
        ],
      },
      {
        id: "member-priya",
        name: "Priya Nair",
        designation: "QA Engineer",
        capacity: "30 hrs/week",
        capacityHoursPerDay: 6,
        allocations: [
          createShellAllocation(4, 1, 3, 1, 4),
          createShellAllocation(4, 2, 0, 2, 1, { billable: false }),
        ],
      },
    ],
  },
  {
    id: "atlas-ui-stabilisation",
    name: "Atlas UI Stabilisation",
    dateRange: "Nov 23 - Feb 28",
    client: "Atlas Corporation",
    members: [
      {
        id: "member-ali",
        name: "Ali Smith",
        designation: "Project Manager",
        capacity: "20 hrs/week",
        capacityHoursPerDay: 4,
        allocations: [
          createShellAllocation(4, 0, 2, 0, 4),
          createShellAllocation(4, 1, 0, 1, 1, { tentative: true }),
        ],
      },
      {
        id: "member-evelyn",
        name: "Evelyn Carter",
        designation: "Design Lead",
        capacity: "35 hrs/week",
        capacityHoursPerDay: 7,
        allocations: [createShellAllocation(5, 1, 0, 1, 2)],
      },
    ],
  },
];

export const projectAllocationShellProjects: ProjectGroup[] = Array.from(
  { length: PROJECT_SHELL_COUNT },
  (_, index) => {
    const template =
      projectAllocationShellTemplates[
        index % projectAllocationShellTemplates.length
      ];
    const projectNumber = index + 1;
    const project = structuredClone(template);

    return {
      ...project,
      id: `${project.id}-${projectNumber}`,
      name: `${project.name} ${projectNumber}`,
      members: project.members?.map((member) => ({
        ...member,
        id: member.id ? `${member.id}-${projectNumber}` : undefined,
      })),
    };
  },
);

export function getProjectAllocationShellStartDate() {
  return shellWeekStart;
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
