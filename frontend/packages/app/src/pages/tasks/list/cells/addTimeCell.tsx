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
      {/* A native <button> can't be used here: ListRow already wraps every
      cell in a <button>, and nested buttons are invalid HTML / trigger a
      React DOM-nesting warning. */}
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          handleAddTime();
        }}
        onKeyDown={(e) => {
          if (
            e.target === e.currentTarget &&
            (e.key === "Enter" || e.key === " ")
          ) {
            e.preventDefault();
            e.stopPropagation();
            handleAddTime();
          }
        }}
        aria-label="Add time"
        className="inline-flex w-4 h-4 shrink-0 cursor-pointer items-center justify-center focus:outline-none focus-visible:ring focus-visible:ring-outline-gray-3 rounded"
      >
        <Clock className="text-ink-gray-6" size={16} />
      </div>
    </Tooltip>
  );
}
