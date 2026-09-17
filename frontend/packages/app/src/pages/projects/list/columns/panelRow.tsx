/**
 * External dependencies.
 */
import { useSortable } from "@dnd-kit/react/sortable";
import { mergeClassNames as cn } from "@next-pms/design-system";
import { Tooltip } from "@rtcamp/frappe-ui-react";
import { DragVertical, Pin, Unpin } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { getSortableInput } from "./utils";
import type { ProjectListColumn } from "../../types";

type ColumnsPanelRowProps = {
  column: ProjectListColumn;
  index: number;
  pinnedCount: number;
  onTogglePinned: (key: string) => void;
};

export function ColumnsPanelRow({
  column,
  index,
  pinnedCount,
  onTogglePinned,
}: ColumnsPanelRowProps) {
  const isPinned = index < pinnedCount;
  const { ref, handleRef, isDragging } = useSortable(
    getSortableInput(column.key, index, pinnedCount),
  );

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-2 rounded px-2 py-1.5 text-sm text-ink-gray-8 hover:bg-surface-gray-2",
        isDragging && "opacity-50",
      )}
    >
      <button
        ref={handleRef}
        type="button"
        aria-label={`Reorder ${column.label}`}
        className="shrink-0 cursor-grab text-ink-gray-5"
      >
        <DragVertical className="size-4" />
      </button>
      <span className="min-w-0 grow truncate">{column.label}</span>
      <Tooltip text={isPinned ? "Unpin column" : "Pin column"}>
        <button
          type="button"
          aria-label={`${isPinned ? "Unpin" : "Pin"} ${column.label}`}
          aria-pressed={isPinned}
          className={cn(
            "shrink-0 rounded p-1",
            isPinned ? "text-ink-gray-8" : "text-ink-gray-4",
          )}
          onClick={() => onTogglePinned(column.key)}
        >
          {isPinned ? <Unpin className="size-4" /> : <Pin className="size-4" />}
        </button>
      </Tooltip>
    </div>
  );
}
