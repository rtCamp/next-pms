import { format } from "date-fns";
import type { AllocationCallbackData } from "../../types";
import type { ProjectAllocationBar } from "../../utils";
import type { AllocationEntry } from "../allocationPopover";

/** Convert a ProjectAllocationBar to a display-ready AllocationEntry. */
export function allocationBarToEntry(
  alloc: ProjectAllocationBar,
  onEdit?: (data: AllocationCallbackData) => void,
  onDelete?: (data: AllocationCallbackData) => void,
): AllocationEntry {
  const callbackData: AllocationCallbackData = {
    allocationId: alloc.id,
    employeeId: alloc.employeeId,
    projectId: alloc.projectId,
    projectName: alloc.projectName,
    customerName: alloc.customerName,
    startDate: alloc.startDate,
    endDate: alloc.endDate,
    hoursPerDay: alloc.hours,
    billable: alloc.billable,
    tentative: alloc.tentative,
    note: alloc.note,
  };

  return {
    projectName: alloc.projectName,
    dateRange: `${format(alloc.startDate, "MMM d, yyyy")} – ${format(alloc.endDate, "MMM d, yyyy")}`,
    hoursPerDay: `${alloc.hours}h/day`,
    totalHours: `${alloc.hours * alloc.fullNumDays} hours`,
    status: alloc.tentative ? "tentative" : "confirmed",
    billable: alloc.billable ?? true,
    updatedByName: alloc.updatedBy?.name,
    updatedByImage: alloc.updatedBy?.image,
    onEdit: onEdit ? () => onEdit(callbackData) : undefined,
    onDelete: onDelete ? () => onDelete(callbackData) : undefined,
    createdOn: alloc.createdOn,
    updatedOn: alloc.updatedOn,
  };
}
