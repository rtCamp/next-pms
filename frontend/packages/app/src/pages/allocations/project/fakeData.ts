// TODO: Delete this file and replace usages with real data.
import type { ProjectGroup } from "@next-pms/design-system/components";
import { addDays, addMonths, addWeeks, startOfWeek } from "date-fns";
import type { AllocationsDuration } from "../types";

const shellBaseDate = new Date();

const weekCountByDuration: Record<AllocationsDuration, number> = {
  "this-week": 1,
  "this-month": 4,
  "this-quarter": 13,
};

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
        id: "member-julian",
        name: "Julian Andrews",
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
      {
        id: "member-christina",
        name: "Christina Chung",
        designation: "QA Engineer",
        allocations: [
          {
            hours: 5,
            startDate: addDays(shellBaseDate, 2),
            endDate: addDays(shellBaseDate, 6),
            billable: true,
          },
        ],
      },
      {
        id: "member-ananya",
        name: "Ananya Bharadwaj",
        designation: "Project Manager",
        allocations: [
          {
            hours: 3,
            startDate: addDays(shellBaseDate, 1),
            endDate: addDays(shellBaseDate, 5),
            billable: true,
          },
        ],
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
        allocations: [
          {
            hours: 5,
            startDate: addDays(shellBaseDate, 2),
            endDate: addDays(shellBaseDate, 7),
            billable: true,
          },
        ],
      },
      {
        id: "member-nikhil",
        name: "Nikhil Sharma",
        designation: "Backend Engineer",
        allocations: [
          {
            hours: 6,
            startDate: addDays(shellBaseDate, 6),
            endDate: addDays(shellBaseDate, 10),
            billable: true,
          },
        ],
      },
      {
        id: "member-priya",
        name: "Priya Nair",
        designation: "QA Engineer",
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
        allocations: [
          {
            hours: 4,
            startDate: addDays(shellBaseDate, 3),
            endDate: addDays(shellBaseDate, 9),
            billable: true,
          },
        ],
      },
      {
        id: "member-evelyn",
        name: "Evelyn Carter",
        designation: "Design Lead",
        allocations: [
          {
            hours: 5,
            startDate: addDays(shellBaseDate, 5),
            endDate: addDays(shellBaseDate, 10),
            billable: true,
          },
        ],
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
