import type { Member, ProjectAllocationBar } from "../../utils";

/**
 * Returns all project allocations for a member that overlap the given date range.
 */
export function getOverlappingAllocations(
  member: Member | undefined,
  startDate: Date,
  endDate: Date,
): ProjectAllocationBar[] {
  return (
    member?.projects?.flatMap((project) =>
      (project.allocations ?? []).filter(
        (alloc) => alloc.startDate <= endDate && alloc.endDate >= startDate,
      ),
    ) ?? []
  );
}
