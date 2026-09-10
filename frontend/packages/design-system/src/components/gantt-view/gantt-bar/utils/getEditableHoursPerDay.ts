/**
 * Internal dependencies.
 */
import type { Allocation } from "../../types";

/**
 * Resolves the hours-per-day an edit form should be seeded with. A zero-hour placeholder
 * falls back to its base hours, since the allocation schema rejects 0.
 */
export function getEditableHoursPerDay(alloc: Allocation): number {
  if (!alloc.fullyReduced) {
    return alloc.hours;
  }

  return alloc.allocationHoursPerDay ?? alloc.hours;
}
