import { CELL_WIDTH } from "./constants";
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

/**
 * Calculate bar offset and width for a date span within visible columns.
 * Return null when the span does not intersect the visible range.
 */
const getBarMetrics = (
  startCol: number,
  endCol: number,
  columnCount: number,
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
    barOffset: startColInView * CELL_WIDTH,
    width: Math.max(
      numDays * CELL_WIDTH - (isRightTrimmed ? RIGHT_TRIM_WIDTH_REDUCTION : 0),
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
): Member[] => {
  return members.map((member) => {
    const projects: Member["projects"] = (member.projects ?? []).map(
      (project) => {
        const allocationsWithBars: ProjectAllocationBar[] = (
          project.allocations ?? []
        ).reduce<ProjectAllocationBar[]>((acc, alloc) => {
          const startCol = getNumDays(alloc.startDate, weekStart, showWeekend);
          const endCol = getNumDays(alloc.endDate, weekStart, showWeekend);
          const metrics = getBarMetrics(startCol, endCol, columnCount);

          if (!metrics) {
            return acc;
          }

          acc.push({
            ...alloc,
            ...metrics,
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
        const metrics = getBarMetrics(startCol, endCol, columnCount);

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
