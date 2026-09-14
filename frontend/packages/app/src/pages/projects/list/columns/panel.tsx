/**
 * External dependencies.
 */
import { Fragment, useState } from "react";
import { Popover } from "@base-ui/react";
import type { Data } from "@dnd-kit/abstract";
import type {
  SortableDraggable,
  SortableDroppable,
} from "@dnd-kit/dom/sortable";
import { DragDropProvider } from "@dnd-kit/react";
import { VerticalColumn } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import {
  COLUMN_DRAG_PLUGINS,
  COLUMN_DRAG_SENSORS,
  PANEL_DRAG_MODIFIERS,
} from "./constants";
import { ColumnsPanelRow } from "./panelRow";
import { useColumnLayout } from "./useColumnLayout";

export function ColumnsPanel() {
  const {
    columns,
    pinnedColumns,
    isDefault,
    togglePinned,
    handleDragEnd,
    reset,
  } = useColumnLayout();
  const [open, setOpen] = useState(false);

  const pinnedCount = pinnedColumns.length;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="flex items-center gap-1.5 rounded border border-none bg-surface-gray-2 px-2 py-1.5 text-base text-ink-gray-7 cursor-pointer">
        <VerticalColumn className="size-3.5" />
        Columns
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={4}>
          <Popover.Popup className="max-h-96 min-w-60 overflow-y-auto rounded-lg border border-outline-gray-2 bg-surface-white py-1 shadow-lg z-50">
            <DragDropProvider<
              Data,
              SortableDraggable<Data>,
              SortableDroppable<Data>
            >
              sensors={COLUMN_DRAG_SENSORS}
              modifiers={PANEL_DRAG_MODIFIERS}
              plugins={COLUMN_DRAG_PLUGINS}
              onDragEnd={handleDragEnd}
            >
              <div className="flex flex-col px-1">
                {columns.map((column, index) => (
                  <Fragment key={column.key}>
                    {pinnedCount > 0 && index === pinnedCount && (
                      <div className="my-1 border-t border-outline-gray-2" />
                    )}
                    <ColumnsPanelRow
                      column={column}
                      index={index}
                      pinnedCount={pinnedCount}
                      onTogglePinned={togglePinned}
                    />
                  </Fragment>
                ))}
              </div>
            </DragDropProvider>
            {!isDefault && (
              <>
                <div className="my-1 border-t border-outline-gray-2" />
                <div className="px-1">
                  <button
                    type="button"
                    className="flex w-full items-center rounded px-3 py-1.5 text-sm text-ink-red-3 hover:bg-surface-gray-2"
                    onClick={() => {
                      reset();
                      setOpen(false);
                    }}
                  >
                    Reset to default
                  </button>
                </div>
              </>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
