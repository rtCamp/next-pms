import { addDays } from "date-fns";
import { getMemberAllocation } from "./gantt-bar/utils/getMemberAllocation";
import { getNumDays } from "./gantt-bar/utils/getNumDays";
import type {
  Allocation,
  Member as SourceMember,
  MemberBarAllocation,
  Project as SourceProject,
} from "./types";

const RIGHT_TRIM_WIDTH_REDUCTION = 3;

export interface ProjectAllocationBar extends Allocation {
  projectName: string;
  customerName?: string;
  barOffset: number;
  width: number;
  fullNumDays: number;
}

export interface MemberAllocationBar extends MemberBarAllocation {
  barOffset: number;
  width: number;
}

export interface Project extends SourceProject {
  allocations: ProjectAllocationBar[];
}

export interface Member extends SourceMember {
  projects: Project[];
  memberAllocations: MemberAllocationBar[];
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
        const allocationsWithBars: ProjectAllocationBar[] = (
          project.allocations ?? []
        ).reduce<ProjectAllocationBar[]>((acc, alloc) => {
          const startCol = getNumDays(alloc.startDate, weekStart, showWeekend);
          const endCol = getNumDays(alloc.endDate, weekStart, showWeekend);
          const metrics = getBarMetrics(
            startCol,
            endCol,
            columnCount,
            columnWidth,
          );

          if (!metrics) {
            return acc;
          }

          acc.push({
            ...alloc,
            ...metrics,
            projectName: project.name,
            fullNumDays:
              getNumDays(alloc.endDate, alloc.startDate, showWeekend) + 1,
          });

          return acc;
        }, []);

        return { ...project, allocations: allocationsWithBars };
      },
    );

    const rawMemberAllocations = getMemberAllocation(
      member.projects ?? [],
      member.leaves ?? [],
    );

    const memberAllocations: MemberAllocationBar[] =
      rawMemberAllocations.reduce<MemberAllocationBar[]>((acc, alloc) => {
        const startCol = getNumDays(alloc.startDate, weekStart, showWeekend);
        const endCol = getNumDays(alloc.endDate, weekStart, showWeekend);
        const metrics = getBarMetrics(
          startCol,
          endCol,
          columnCount,
          columnWidth,
        );

        if (!metrics) {
          return acc;
        }

        acc.push({
          ...alloc,
          ...metrics,
        });

        return acc;
      }, []);

    return {
      ...member,
      projects,
      memberAllocations,
    };
  });
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

  let date = weekStart;
  let visibleIndex = 0;

  while (visibleIndex < index) {
    date = addDays(date, 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      visibleIndex += 1;
    }
  }

  return date;
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

/**
 * Returns whether a visible day column overlaps any existing bar.
 */
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
