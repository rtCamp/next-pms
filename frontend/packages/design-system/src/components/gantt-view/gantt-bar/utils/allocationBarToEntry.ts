import { format } from "date-fns";
import type { ProjectAllocationBar } from "../../utils";
import type { AllocationEntry } from "../allocationPopover";

/** Convert a ProjectAllocationBar to a display-ready AllocationEntry. */
export function allocationBarToEntry(
  alloc: ProjectAllocationBar,
  onEdit?: () => void,
  onDelete?: () => void,
): AllocationEntry {
  return {
    projectName: alloc.projectName,
    dateRange: `${format(alloc.startDate, "MMM d, yyyy")} – ${format(alloc.endDate, "MMM d, yyyy")}`,
    hoursPerDay: `${alloc.hours}h/day (${alloc.hours * alloc.fullNumDays} hours)`,
    status: alloc.tentative ? "tentative" : "confirmed",
    billable: alloc.billable ?? true,
    updatedByName: alloc.updatedBy?.name,
    updatedByImage: alloc.updatedBy?.image,
    onEdit,
    onDelete,
    createdOn: alloc.createdOn,
    updatedOn: alloc.updatedOn,
  };
}
