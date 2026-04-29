import { Avatar, Button } from "@rtcamp/frappe-ui-react";
import {
  AddMd,
  Calendar,
  CalendarDeadline,
  Check,
  DeleteAlt,
  EditAlt,
  Folder,
  Time,
} from "@rtcamp/frappe-ui-react/icons";
import { format } from "date-fns";
import { mergeClassNames as cn } from "../../../utils";

export interface AllocationEntry {
  projectName: string;
  dateRange: string;
  hoursPerDay: string;
  status: "confirmed" | "tentative";
  billable: boolean;
  updatedByName?: string;
  updatedByImage?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  createdOn?: Date;
  updatedOn?: Date;
}

interface AllocationItemProps {
  entry: AllocationEntry;
  hasRoleAccess: boolean;
}

/**
 * Internal popup card shown when hovering over a Gantt allocation bar.
 */
function AllocationItem({ entry, hasRoleAccess }: AllocationItemProps) {
  const StatusIcon = entry.status === "confirmed" ? Check : CalendarDeadline;

  return (
    <div className="flex flex-col gap-3">
      {/* Project name */}
      <div className="flex gap-2 items-start">
        <Folder className="mt-px size-4 text-ink-gray-5 shrink-0" />
        <span className="flex-1 min-w-0 text-base font-medium truncate text-ink-gray-8">
          {entry.projectName}
        </span>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-2.5 relative">
        <div className="flex gap-2 items-center">
          <Calendar className="size-4 text-ink-gray-5 shrink-0" />
          <span className="text-sm text-ink-gray-6 truncate">
            {entry.dateRange}
          </span>
        </div>

        <div className="flex gap-2 items-center">
          <Time className="size-4 text-ink-gray-5 shrink-0" />
          <span className="text-sm text-ink-gray-6">{entry.hoursPerDay}</span>
        </div>

        <div className="flex gap-2 items-center">
          <StatusIcon className="size-4 text-ink-gray-5 shrink-0" />
          <span className="text-sm text-ink-gray-6">
            {entry.status === "confirmed" ? "Confirmed" : "Tentative"}
          </span>
          <span
            className={cn(
              "leading-none scale-200",
              entry.billable ? "text-ink-green-4" : "text-ink-amber-3",
            )}
          >
            ·
          </span>
          <span className="text-sm text-ink-gray-6">
            {entry.billable ? "Billable" : "Non-billable"}
          </span>
        </div>

        {/* Created / Last edited row with avatar and edit/delete actions */}
        {(entry.createdOn || entry.updatedOn) && (
          <div className="flex flex-1 gap-2 items-center">
            {entry.updatedByName && (
              <div className="shrink-0">
                <Avatar
                  size="xs"
                  shape="circle"
                  image={entry.updatedByImage}
                  label={entry.updatedByName}
                />
              </div>
            )}
            <span className="text-sm truncate text-ink-gray-6 mr-10">
              {entry.updatedOn &&
              entry.createdOn &&
              entry.updatedOn.getTime() !== entry.createdOn.getTime()
                ? `Last edited on ${format(entry.updatedOn, "MMM d")}`
                : entry.createdOn
                  ? `Created on ${format(entry.createdOn, "MMM d")}`
                  : null}
            </span>
          </div>
        )}

        {hasRoleAccess && (
          <div className="flex gap-2 items-center shrink-0 absolute bottom-0 right-0 mb-1">
            <button
              type="button"
              onClick={entry.onEdit}
              className="transition-colors text-ink-gray-5 hover:text-ink-gray-7"
              aria-label="Edit allocation"
            >
              <EditAlt className="size-4" />
            </button>
            <button
              type="button"
              onClick={entry.onDelete}
              className="transition-colors text-ink-gray-5 hover:text-ink-gray-7"
              aria-label="Delete allocation"
            >
              <DeleteAlt className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface GanttAllocationPopoverProps {
  entries: AllocationEntry[];
  onAdd?: () => void;
  hasRoleAccess?: boolean;
}

export function GanttAllocationPopover({
  entries,
  onAdd,
  hasRoleAccess = false,
}: GanttAllocationPopoverProps) {
  return (
    <div className="flex flex-col gap-4 p-3 rounded-xl shadow-2xl w-70 bg-surface-modal">
      <div className="flex flex-col">
        {entries.map((entry, index) => (
          <div key={index}>
            {index > 0 && (
              <div className="my-3 w-full h-px bg-surface-gray-3" />
            )}
            <AllocationItem entry={entry} hasRoleAccess={hasRoleAccess} />
          </div>
        ))}
      </div>

      {onAdd && hasRoleAccess && (
        <Button
          variant="solid"
          theme="gray"
          className="justify-center w-full"
          iconLeft={() => <AddMd className="size-4" />}
          label="Add"
          onClick={onAdd}
        />
      )}
    </div>
  );
}
