/**
 * External dependencies.
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * Internal dependencies.
 */
import { HEADER_HEIGHT } from "./constants";
import { DeleteAllocationDialog } from "./deleteAllocationDialog";
import { GanttMemberRows } from "./ganttMemberRows";
import { createGanttStore, GanttContext, useGanttStore } from "./ganttStore";
import { GanttWeekHeader } from "./ganttWeekHeader";
import { useContainerResize } from "./hooks/useContainerResize";
import type { GanttGridProps } from "./types";
import { mergeClassNames as cn } from "../../utils";

const GanttGridInner: React.FC<{
  rootRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
}> = ({ rootRef, className }) => {
  const {
    members,
    headerWidth,
    columnWidth,
    weekendColumns,
    resizeHandleActive,
    setResizeHandleActive,
    startResize,
    columnCount,
    weeks,
    pendingDeleteEntry,
    clearPendingDeleteEntry,
  } = useGanttStore((s) => ({
    members: s.members,
    headerWidth: s.headerWidth,
    columnWidth: s.columnWidth,
    weekendColumns: s.weekendColumns,
    resizeHandleActive: s.resizeHandleActive,
    setResizeHandleActive: s.setResizeHandleActive,
    startResize: s.startResize,
    columnCount: s.columnCount,
    weeks: s.weeks,
    pendingDeleteEntry: s.pendingDeleteEntry,
    clearPendingDeleteEntry: s.clearPendingDeleteEntry,
  }));

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      startResize(e.clientX);
    },
    [startResize],
  );

  return (
    <div
      ref={rootRef}
      className={cn("relative", className)}
      style={{ width: headerWidth + columnCount * columnWidth }}
    >
      {weekendColumns.length > 0 && (
        <div className="pointer-events-none absolute inset-0 z-0">
          {weekendColumns.map((columnIndex) => (
            <div
              key={`weekend-overlay-${columnIndex}`}
              className="absolute bottom-0 bg-surface-gray-3/20"
              style={{
                top: HEADER_HEIGHT,
                left: headerWidth + columnIndex * columnWidth,
                width: columnWidth,
              }}
            />
          ))}
        </div>
      )}

      <table
        className="relative z-10 border-separate border-spacing-0"
        style={{ width: headerWidth + columnCount * columnWidth }}
      >
        <thead className="sticky top-0 z-20">
          {/* Row 1: corner + week range labels */}
          <tr>
            <th
              rowSpan={2}
              className="sticky left-0 z-20 bg-surface-white text-ink-gray-8 border border-l-0 border-outline-gray-1 font-medium text-start p-3 pl-4.25"
              style={{ width: headerWidth, height: HEADER_HEIGHT }}
            >
              Members
            </th>

            {weeks.map((weekIndex) => (
              <GanttWeekHeader key={weekIndex} weekIndex={weekIndex} />
            ))}
          </tr>
        </thead>

        <tbody>
          {members.map((_, rowIndex) => (
            <GanttMemberRows key={rowIndex} memberInd={rowIndex} />
          ))}
        </tbody>
      </table>

      <div className="pointer-events-none absolute inset-0 z-30">
        <div className="sticky left-0 top-0 h-full w-0">
          <div
            className={cn(
              "pointer-events-auto absolute top-0 bottom-0 w-1 cursor-col-resize touch-none",
              {
                "bg-outline-gray-1": resizeHandleActive,
              },
            )}
            style={{ left: headerWidth - 2 }}
            onPointerDown={onResizePointerDown}
            onPointerEnter={() => setResizeHandleActive(true)}
            onPointerLeave={() => setResizeHandleActive(false)}
          />
        </div>
      </div>

      <DeleteAllocationDialog
        open={pendingDeleteEntry !== null}
        onOpenChange={(open) => {
          if (!open) clearPendingDeleteEntry();
        }}
        projectName={pendingDeleteEntry?.projectName ?? ""}
        dateRange={pendingDeleteEntry?.dateRange ?? ""}
        hoursPerDay={pendingDeleteEntry?.hoursPerDay ?? ""}
        totalHours={pendingDeleteEntry?.totalHours ?? ""}
        onConfirm={async () => {
          try {
            pendingDeleteEntry?.onDelete();
          } finally {
            clearPendingDeleteEntry();
          }
        }}
      />
    </div>
  );
};

export const GanttGrid: React.FC<GanttGridProps> = (props) => {
  const rootRef = useRef<HTMLDivElement>(null);

  const resolvedProps = useMemo(
    () => ({
      members: props.members,
      showWeekend: props.showWeekend ?? true,
      startDate: props.startDate,
      weekCount: props.weekCount ?? 3,
      hasRoleAccess: props.hasRoleAccess ?? false,
      onAddAllocation: props.onAddAllocation,
      onEditAllocation: props.onEditAllocation,
      onDeleteAllocation: props.onDeleteAllocation,
    }),
    [
      props.hasRoleAccess,
      props.members,
      props.onAddAllocation,
      props.onDeleteAllocation,
      props.onEditAllocation,
      props.showWeekend,
      props.startDate,
      props.weekCount,
    ],
  );

  const [store] = useState(() => createGanttStore(resolvedProps));

  useEffect(() => {
    store.getState().syncProps(resolvedProps);
  }, [resolvedProps, store]);

  useContainerResize({
    rootRef,
    onWidthChange: (width) => {
      store.getState().setContainerWidth(width);
    },
  });

  return (
    <GanttContext.Provider value={store}>
      <GanttGridInner rootRef={rootRef} className={props.className} />
    </GanttContext.Provider>
  );
};

GanttGrid.displayName = "GanttGrid";
