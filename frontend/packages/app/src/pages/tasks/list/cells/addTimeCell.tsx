/**
 * External dependencies.
 */
import { Tooltip } from "@rtcamp/frappe-ui-react";
import { Clock } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import type { OpenAddTimeDialogOptions } from "@/pages/timesheet/outletContext";
import type { TaskListItem } from "../types";

export function AddTimeCell({
  row,
  onAddTime,
}: {
  row: TaskListItem;
  onAddTime?: (prefill: OpenAddTimeDialogOptions) => void;
}) {
  const handleAddTime = () => {
    onAddTime?.({
      project: row.project,
      projectLabel: row.project_name ?? row.project,
      task: row.name,
      taskLabel: row.subject,
    });
  };

  return (
    <Tooltip text="Add time">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleAddTime();
        }}
        aria-label="Add time"
        className="inline-flex w-4 h-4 shrink-0 cursor-pointer items-center justify-center rounded"
      >
        <Clock className="text-ink-gray-4 size-4" />
      </button>
    </Tooltip>
  );
}
