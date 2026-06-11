/**
 * External dependencies.
 */
import { addDays, eachDayOfInterval, isSameDay, startOfDay } from "date-fns";

/**
 * Internal dependencies.
 */
import { getMemberAllocation } from "./gantt-bar/utils/getMemberAllocation";
import { getNumDays } from "./gantt-bar/utils/getNumDays";
import type {
  Allocation,
  Member as SourceMember,
  MemberBarAllocation,
  Project as SourceProject,
  ProjectGroup as SourceProjectGroup,
  ProjectMember as SourceProjectMember,
} from "./types";

const RIGHT_TRIM_WIDTH_REDUCTION = 3;

export interface ProjectAllocationBar extends Allocation {
  projectName: string;
  customerName?: string;
  barOffset: number;
  width: number;
  fullNumDays: number;
}

export interface MemberSummaryBar extends MemberBarAllocation {
  barOffset: number;
  width: number;
}

export interface ProjectSummaryBar {
  startDate: Date;
  endDate: Date;
  hours: number;
  barOffset: number;
  width: number;
  tentative: boolean;
}

export interface MemberProject extends SourceProject {
  allocations: ProjectAllocationBar[];
}

export interface Member extends SourceMember {
  projects: MemberProject[];
  memberSummaryBars: MemberSummaryBar[];
}

export type ProjectMemberAllocationBar = ProjectAllocationBar;

export interface ProjectMember extends SourceProjectMember {
  allocations: ProjectMemberAllocationBar[];
}

export interface ProjectGroup extends SourceProjectGroup {
  members: ProjectMember[];
  projectSummaryBars: ProjectSummaryBar[];
}

export type DraftBarSeed = {
  rowKey: string;
  left: number;
  width: number;
  employeeId?: string;
  projectId?: string;
  projectName?: string;
  customerName?: string;
};

export type OccupyingAllocation = {
  barOffset: number;
  width: number;
};

export type BarDateRangeInput = {
  left: number;
  width: number;
  headerWidth: number;
  columnWidth: number;
  columnCount: number;
  weekStart: Date;
  showWeekend: boolean;
};

export type BarInteractionBounds = {
  minLeft: number;
  maxRight: number;
};

export type BarDateRange = {
  startDate: Date;
  endDate: Date;
};

/**
 * Calculate bar offset and width for a date span within visible columns.
 * Return null when the span does not intersect the visible range.
 */
const getBarMetrics = (
  startCol: number,
  endCol: number,
  columnCount: number,
  columnWidth: number,
): { barOffset: number; width: number } | null => {
  const visibleStartCol = 0;
  const visibleEndCol = columnCount - 1;

  if (endCol < visibleStartCol || startCol > visibleEndCol) {
    return null;
  }

  const startColInView = Math.max(startCol, visibleStartCol);
  const endColInView = Math.min(endCol, visibleEndCol);
  const isRightTrimmed = endCol > visibleEndCol;
  const numDays = endColInView - startColInView + 1;

  return {
    barOffset: startColInView * columnWidth,
    width: Math.max(
      numDays * columnWidth - (isRightTrimmed ? RIGHT_TRIM_WIDTH_REDUCTION : 0),
      0,
    ),
  };
};

/**
 * Precompute bar geometry for project allocations and member allocation summaries.
 * This allows bars to be rendered with simple absolute positioning without needing
 * to calculate date intersections on the fly.
 */
function prepareAllocationBars<T extends Allocation>(
  allocations: T[],
  weekStart: Date,
  columnCount: number,
  showWeekend: boolean,
  columnWidth: number,
) {
  return allocations.reduce<
    Array<T & { barOffset: number; width: number; fullNumDays: number }>
  >((acc, alloc) => {
    const startCol = getNumDays(alloc.startDate, weekStart, showWeekend);
    const endCol = getNumDays(alloc.endDate, weekStart, showWeekend);
    const metrics = getBarMetrics(startCol, endCol, columnCount, columnWidth);

    if (!metrics) {
      return acc;
    }

    acc.push({
      ...alloc,
      ...metrics,
      fullNumDays: getNumDays(alloc.endDate, alloc.startDate, showWeekend) + 1,
    });

    return acc;
  }, []);
}

/**
 * Precompute bar geometry for member summary bars, which aggregate all allocations for a member.
 */
function prepareMemberSummaryBars(
  allocations: MemberBarAllocation[],
  weekStart: Date,
  columnCount: number,
  showWeekend: boolean,
  columnWidth: number,
) {
  return allocations.reduce<MemberSummaryBar[]>((acc, alloc) => {
    const startCol = getNumDays(alloc.startDate, weekStart, showWeekend);
    const endCol = getNumDays(alloc.endDate, weekStart, showWeekend);
    const metrics = getBarMetrics(startCol, endCol, columnCount, columnWidth);

    if (!metrics) {
      return acc;
    }

    acc.push({
      ...alloc,
      ...metrics,
    });

    return acc;
  }, []);
}

/**
 * Precompute bar geometry for project summary bars, which aggregate all member allocations for a project.
 * Bars are merged across contiguous date ranges with the same total hours to minimize the number of bars rendered.
 */
function prepareProjectSummaryBars(
  allocations: Allocation[],
  weekStart: Date,
  columnCount: number,
  showWeekend: boolean,
  columnWidth: number,
) {
  const dayTotals = new Map<number, { hours: number; tentative: boolean }>();

  for (const allocation of allocations) {
    for (const day of eachDayOfInterval({
      start: allocation.startDate,
      end: allocation.endDate,
    })) {
      const dayOfWeek = day.getDay();

      // Project summary bars stay weekday-only
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue;
      }

      const key = startOfDay(day).getTime();
      const previousDay = dayTotals.get(key);
      dayTotals.set(key, {
        hours: (previousDay?.hours ?? 0) + allocation.hours,
        tentative: Boolean(previousDay?.tentative || allocation.tentative),
      });
    }
  }

  const sortedDays = [...dayTotals.entries()]
    .sort(([leftTs], [rightTs]) => leftTs - rightTs)
    .map(([timestamp, { hours, tentative }]) => ({
      date: new Date(timestamp),
      hours,
      tentative,
    }));

  const segments: Array<{
    startDate: Date;
    endDate: Date;
    hours: number;
    tentative: boolean;
  }> = [];

  for (const { date, hours, tentative } of sortedDays) {
    const lastSegment = segments[segments.length - 1];

    if (
      lastSegment &&
      // Keep the comparison weekday-only as well so summary bars break at weekends.
      lastSegment.hours /
        (getNumDays(lastSegment.endDate, lastSegment.startDate, true) + 1) ===
        hours &&
      lastSegment.tentative === tentative &&
      isSameDay(addDays(lastSegment.endDate, 1), date)
    ) {
      lastSegment.endDate = date;
      lastSegment.hours += hours;
      continue;
    }

    segments.push({
      startDate: date,
      endDate: date,
      hours,
      tentative,
    });
  }

  return segments.flatMap((segment) => {
    const startCol = getNumDays(segment.startDate, weekStart, showWeekend);
    const endCol = getNumDays(segment.endDate, weekStart, showWeekend);
    const metrics = getBarMetrics(startCol, endCol, columnCount, columnWidth);

    if (!metrics) {
      return [];
    }

    return {
      startDate: segment.startDate,
      endDate: segment.endDate,
      hours: segment.hours,
      tentative: segment.tentative,
      ...metrics,
    };
  });
}

/**
 * Build member rows with precomputed bar metrics for projects and member summaries.
 */
export const prepareMemberBars = (
  members: SourceMember[],
  weekStart: Date,
  columnCount: number,
  showWeekend: boolean,
  columnWidth: number,
): Member[] => {
  return members.map((member) => {
    const projects: Member["projects"] = (member.projects ?? []).map(
      (project) => {
        const allocationsWithBars: ProjectAllocationBar[] =
          prepareAllocationBars(
            project.allocations ?? [],
            weekStart,
            columnCount,
            showWeekend,
            columnWidth,
          ).map((alloc) => ({
            ...alloc,
            projectName: project.name,
          }));

        return { ...project, allocations: allocationsWithBars };
      },
    );

    const rawMemberSummaryAllocations = getMemberAllocation(
      member.projects ?? [],
      member.leaves ?? [],
    );

    const memberSummaryBars = prepareMemberSummaryBars(
      rawMemberSummaryAllocations,
      weekStart,
      columnCount,
      showWeekend,
      columnWidth,
    );

    return {
      ...member,
      projects,
      memberSummaryBars,
    };
  });
};

/**
 * Build project rows with precomputed bar metrics for member allocations and project summaries.
 */
export const prepareProjectBars = (
  projects: SourceProjectGroup[],
  weekStart: Date,
  columnCount: number,
  showWeekend: boolean,
  columnWidth: number,
): ProjectGroup[] => {
  return projects.map((project) => {
    const rawProjectAllocations = (project.members ?? []).flatMap(
      (member) => member.allocations ?? [],
    );

    const members: ProjectGroup["members"] = (project.members ?? []).map(
      (member) => ({
        ...member,
        allocations: prepareAllocationBars(
          member.allocations ?? [],
          weekStart,
          columnCount,
          showWeekend,
          columnWidth,
        ).map((allocation) => ({
          ...allocation,
          projectName: project.name,
          customerName: project.client,
        })),
      }),
    );

    const projectSummaryBars = prepareProjectSummaryBars(
      rawProjectAllocations,
      weekStart,
      columnCount,
      showWeekend,
      columnWidth,
    );

    return {
      ...project,
      members,
      projectSummaryBars,
    };
  });
};

/**
 * Format hours to a string with up to 2 decimal places, trimming unnecessary zeros.
 */
export const formatHours = (hours: number) => {
  const roundedHours = Number(hours.toFixed(2));

  return String(roundedHours);
};

/**
 * Converts a visible column index into a calendar date.
 */
export const getDateAtColumnIndex = (
  index: number,
  weekStart: Date,
  showWeekend: boolean,
): Date => {
  if (showWeekend) {
    return addDays(weekStart, index);
  }

  // Map weekday-only column indexes back to calendar days by skipping weekend offsets.
  return addDays(weekStart, Math.floor(index / 5) * 7 + (index % 5));
};

/**
 * Returns the number of visible days covered by a bar width.
 */
export const getBarDaySpan = (width: number, columnWidth: number) => {
  return Math.max(1, Math.round(width / columnWidth));
};

/**
 * Derives the visible start and end dates for a bar from its geometry.
 */
export const getBarDateRange = ({
  left,
  width,
  headerWidth,
  columnWidth,
  columnCount,
  weekStart,
  showWeekend,
}: BarDateRangeInput): BarDateRange => {
  const startIndex = Math.max(
    0,
    Math.round((left - headerWidth) / columnWidth),
  );
  const numDays = getBarDaySpan(width, columnWidth);
  const endIndex = Math.min(columnCount - 1, startIndex + numDays - 1);

  return {
    startDate: getDateAtColumnIndex(startIndex, weekStart, showWeekend),
    endDate: getDateAtColumnIndex(endIndex, weekStart, showWeekend),
  };
};

/**
 * Returns the row bounds for an editable bar.
 */
export const getBarTimelineBounds = ({
  headerWidth,
  columnWidth,
  columnCount,
}: {
  headerWidth: number;
  columnWidth: number;
  columnCount: number;
}): BarInteractionBounds => {
  return {
    minLeft: headerWidth,
    maxRight: headerWidth + columnWidth * columnCount,
  };
};

export const isColumnOccupied = (
  allocations: OccupyingAllocation[],
  dayIndex: number,
  columnWidth: number,
): boolean => {
  const colStart = dayIndex * columnWidth;
  const colEnd = (dayIndex + 1) * columnWidth;

  return allocations.some(
    (allocation) =>
      allocation.barOffset < colEnd &&
      allocation.barOffset + allocation.width > colStart,
  );
};

/**
 * Clamps a value between a min and max ensuring the min is not greater than the max.
 */
export function clamp(value: number, min: number, max: number) {
  if (max < min) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

/**
 * Snaps a raw value to the nearest multiple of the unit from the origin ensuring the unit is positive and non-zero.
 */
export function snapValue(
  rawValue: number,
  unit: number | undefined,
  origin = 0,
) {
  const safeUnit = unit && unit > 0 ? unit : 1;
  return origin + Math.round((rawValue - origin) / safeUnit) * safeUnit;
}
