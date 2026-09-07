/**
 * Internal dependencies.
 */
import type { Allocation } from "../../types";

/**
 * Resolves the hours-per-day an edit form should be seeded with.
 *
 * A zero-hour placeholder renders 0 because that is what the allocation currently books, but
 * the allocation schema rejects 0 hours — seeding an edit form with it would open the dialog
 * in a state that can never be saved. Those fall back to the allocation's own base hours.
 */
export function getEditableHoursPerDay(alloc: Allocation): number {
  if (!alloc.fullyReduced) {
    return alloc.hours;
  }

  return alloc.allocationHoursPerDay ?? alloc.hours;
}
