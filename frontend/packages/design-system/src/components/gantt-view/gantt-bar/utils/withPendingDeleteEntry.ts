/**
 * Internal dependencies.
 */
import type { PendingDeleteEntry } from "../../ganttStore";
import type { AllocationEntry } from "../allocationPopover";

type SetPendingDeleteEntry = (entry: PendingDeleteEntry) => void;

export function withPendingDeleteEntry(
  entry: AllocationEntry,
  setPendingDeleteEntry: SetPendingDeleteEntry,
): AllocationEntry {
  if (!entry.onConfirmDelete) {
    return entry;
  }

  const onConfirmDelete = entry.onConfirmDelete;

  return {
    ...entry,
    onDelete: () =>
      setPendingDeleteEntry({
        projectName: entry.projectName,
        dateRange: entry.dateRange,
        hoursPerDay: entry.hoursPerDay,
        totalHours: entry.totalHours,
        recurrenceId: entry.recurrenceId,
        onDelete: (deleteMode) => onConfirmDelete(deleteMode),
      }),
  };
}
