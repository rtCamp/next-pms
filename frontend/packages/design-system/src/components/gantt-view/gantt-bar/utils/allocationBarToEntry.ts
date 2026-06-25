/**
 * External dependencies.
 */
import { format } from "date-fns";

/**
 * Internal dependencies.
 */
import type { AllocationCallbackData, DeleteAllocationMode } from "../../types";
import type { ProjectAllocationBar } from "../../utils";
import type { AllocationEntry } from "../allocationPopover";

/** Convert a ProjectAllocationBar to a display-ready AllocationEntry. */
export function allocationBarToEntry(
  alloc: ProjectAllocationBar,
  onEdit?: (data: AllocationCallbackData) => void,
  onDelete?: (
    data: AllocationCallbackData,
    deleteMode: DeleteAllocationMode,
  ) => Promise<void>,
): AllocationEntry {
  const callbackData: AllocationCallbackData = {
    allocationId: alloc.id,
    employeeId: alloc.employeeId,
    projectId: alloc.projectId,
    recurrenceId: alloc.recurrenceId,
    projectName: alloc.projectName,
    customerName: alloc.customerName,
    startDate: alloc.startDate,
    endDate: alloc.endDate,
    hoursPerDay: alloc.hours,
    billable: alloc.billable,
    tentative: alloc.tentative,
    note: alloc.note,
    override: alloc.override,
    allocationStartDate: alloc.allocationStartDate,
    allocationEndDate: alloc.allocationEndDate,
    allocationHoursPerDay: alloc.allocationHoursPerDay,
    segmentStartDate: alloc.startDate,
    segmentEndDate: alloc.endDate,
    segmentHoursPerDay: alloc.hours,
  };

  return {
    projectName: alloc.projectName,
    dateRange: `${format(alloc.startDate, "MMM d, yyyy")} – ${format(alloc.endDate, "MMM d, yyyy")}`,
    hoursPerDay: `${alloc.hours}h/day`,
    totalHours: `${alloc.hours * alloc.fullNumDays} hours`,
    status: alloc.tentative ? "tentative" : "confirmed",
    billable: alloc.billable ?? true,
    recurrenceId: alloc.recurrenceId,
    updatedByName: alloc.updatedBy?.name,
    updatedByImage: alloc.updatedBy?.image,
    onEdit: onEdit ? () => onEdit(callbackData) : undefined,
    onConfirmDelete: onDelete
      ? (deleteMode) => onDelete(callbackData, deleteMode)
      : undefined,
    createdOn: alloc.createdOn,
    updatedOn: alloc.updatedOn,
  };
}
