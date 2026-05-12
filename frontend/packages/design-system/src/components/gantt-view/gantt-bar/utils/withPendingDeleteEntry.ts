import type { PendingDeleteEntry } from "../../ganttStore";
import type { AllocationEntry } from "../allocationPopover";

type SetPendingDeleteEntry = (entry: PendingDeleteEntry) => void;

export function withPendingDeleteEntry(
  entry: AllocationEntry,
  setPendingDeleteEntry: SetPendingDeleteEntry,
): AllocationEntry {
  if (!entry.onDelete) {
    return entry;
  }

  const onDelete = entry.onDelete;

  return {
    ...entry,
    onDelete: () =>
      setPendingDeleteEntry({
        projectName: entry.projectName,
        dateRange: entry.dateRange,
        hoursPerDay: entry.hoursPerDay,
        onDelete,
      }),
  };
}
