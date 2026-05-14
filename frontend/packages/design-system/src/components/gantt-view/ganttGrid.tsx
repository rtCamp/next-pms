import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Plus } from "lucide-react";
import {
  ADD_PROJECT_ROW_HEIGHT,
  CELL_HEIGHT,
  HEADER_HEIGHT,
} from "./constants";
import { DeleteAllocationDialog } from "./deleteAllocationDialog";
import { GanttMemberBar } from "./gantt-bar/memberBar";
import { GanttProjectBar } from "./gantt-bar/projectBar";
import {
  RowAllocationOverlay,
  type RowAllocationOverlayHandle,
} from "./gantt-bar/rowAllocationOverlay";
import { GanttMemberItem } from "./ganttMemberItem";
import { GanttProjectItem } from "./ganttProjectItem";
import { createGanttStore, GanttContext, useGanttStore } from "./ganttStore";
import type { Member } from "./ganttStore";
import { GanttWeekHeader } from "./ganttWeekHeader";
import { useContainerResize } from "./hooks/useContainerResize";
import type { GanttGridProps } from "./types";
import { mergeClassNames as cn } from "../../utils";

type OverlayRefMap = React.RefObject<
  Record<string, RowAllocationOverlayHandle | null>
>;

const GanttGridInner: React.FC<{
  rootRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
}> = ({ rootRef, className }) => {
  const {
    members,
    expandedRows,
    headerWidth,
    daysPerWeek,
    columnWidth,
    weekendColumns,
    resizeHandleActive,
    setResizeHandleActive,
    startResize,
    columnCount,
    weeks,
    hasRoleAccess,
    onAddAllocation,
    onEditAllocation,
    pendingDeleteEntry,
    clearPendingDeleteEntry,
  } = useGanttStore((s) => ({
    members: s.members,
    expandedRows: s.expandedRows,
    headerWidth: s.headerWidth,
    daysPerWeek: s.daysPerWeek,
    columnWidth: s.columnWidth,
    weekendColumns: s.weekendColumns,
    resizeHandleActive: s.resizeHandleActive,
    setResizeHandleActive: s.setResizeHandleActive,
    startResize: s.startResize,
    columnCount: s.columnCount,
    weeks: s.weeks,
    hasRoleAccess: s.hasRoleAccess,
    onAddAllocation: s.onAddAllocation,
    onEditAllocation: s.onEditAllocation,
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

  const canManageAllocations = hasRoleAccess && Boolean(onAddAllocation);
  const canEditAllocations = hasRoleAccess && Boolean(onEditAllocation);
  const memberRowOverlayRefs = useRef<
    Record<string, RowAllocationOverlayHandle | null>
  >({});
  const projectRowOverlayRefs = useRef<
    Record<string, RowAllocationOverlayHandle | null>
  >({});

  const setMemberRowOverlayRef = useCallback(
    (rowKey: string, handle: RowAllocationOverlayHandle | null) => {
      if (handle) {
        memberRowOverlayRefs.current[rowKey] = handle;
        return;
      }

      delete memberRowOverlayRefs.current[rowKey];
    },
    [],
  );

  const setProjectRowOverlayRef = useCallback(
    (rowKey: string, handle: RowAllocationOverlayHandle | null) => {
      if (handle) {
        projectRowOverlayRefs.current[rowKey] = handle;
        return;
      }

      delete projectRowOverlayRefs.current[rowKey];
    },
    [],
  );

  const getOverlayPointerDownHandler = useCallback(
    (
      overlayRefs: OverlayRefMap,
      rowKey: string,
      enabled: boolean,
    ): React.PointerEventHandler<HTMLTableRowElement> | undefined => {
      if (!enabled) {
        return undefined;
      }

      return (event) => {
        overlayRefs.current[rowKey]?.handleRowPointerDown(event);
      };
    },
    [],
  );

  const getOverlayPointerMoveHandler = useCallback(
    (
      overlayRefs: OverlayRefMap,
      rowKey: string,
      enabled: boolean,
    ): React.PointerEventHandler<HTMLTableRowElement> | undefined => {
      if (!enabled) {
        return undefined;
      }

      return (event) => {
        overlayRefs.current[rowKey]?.handleRowPointerMove(event);
      };
    },
    [],
  );

  const getOverlayPointerLeaveHandler = useCallback(
    (
      overlayRefs: OverlayRefMap,
      rowKey: string,
      enabled: boolean,
    ): React.PointerEventHandler<HTMLTableRowElement> | undefined => {
      if (!enabled) {
        return undefined;
      }

      return () => {
        overlayRefs.current[rowKey]?.clearHoveredSlot();
      };
    },
    [],
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
          {members.map((member: Member, rowIndex: number) => {
            const isExpanded = expandedRows.has(rowIndex);
            const animatedRowHeight = isExpanded ? CELL_HEIGHT : 0;
            const addProjectRowHeight = isExpanded ? ADD_PROJECT_ROW_HEIGHT : 0;
            const memberRowKey = `member-${rowIndex}`;

            return (
              <React.Fragment key={rowIndex}>
                {/* Member row */}
                <tr
                  className="relative last:border-b border-outline-gray-1"
                  onPointerDown={getOverlayPointerDownHandler(
                    memberRowOverlayRefs,
                    memberRowKey,
                    canManageAllocations,
                  )}
                  onPointerMove={getOverlayPointerMoveHandler(
                    memberRowOverlayRefs,
                    memberRowKey,
                    canManageAllocations,
                  )}
                  onPointerLeave={getOverlayPointerLeaveHandler(
                    memberRowOverlayRefs,
                    memberRowKey,
                    canManageAllocations,
                  )}
                >
                  <GanttMemberItem memberInd={rowIndex} />
                  {weeks.map((_, i) => {
                    return (
                      <td
                        key={i}
                        colSpan={daysPerWeek}
                        className={cn("border-r border-outline-gray-1")}
                        style={{
                          height: CELL_HEIGHT,
                        }}
                      />
                    );
                  })}
                  <td
                    aria-hidden="true"
                    className="p-0 border-0 w-0 min-w-0 max-w-0"
                    style={{ width: 0 }}
                  >
                    {member.memberAllocations.map((alloc, idx) => (
                      <GanttMemberBar
                        key={idx}
                        allocation={alloc}
                        memberInd={rowIndex}
                      />
                    ))}
                    <RowAllocationOverlay
                      ref={(handle) =>
                        setMemberRowOverlayRef(memberRowKey, handle)
                      }
                      enabled={canManageAllocations}
                      rowKey={memberRowKey}
                      headerWidth={headerWidth}
                      columnWidth={columnWidth}
                      columnCount={columnCount}
                      allocations={member.memberAllocations}
                      createDraftBar={(left) => ({
                        rowKey: memberRowKey,
                        left,
                        width: columnWidth,
                        employeeId: member.id,
                      })}
                      onOpenAllocation={onAddAllocation}
                    />
                  </td>
                </tr>

                {/* Project child rows */}
                {member.projects?.map((project, projectIndex) => {
                  const projectRowKey = `project-${rowIndex}-${projectIndex}`;

                  return (
                    <tr
                      key={`${rowIndex}-project-${projectIndex}`}
                      className={cn("relative", {
                        "pointer-events-none": !isExpanded,
                      })}
                      aria-hidden={!isExpanded}
                      onPointerDown={getOverlayPointerDownHandler(
                        projectRowOverlayRefs,
                        projectRowKey,
                        canManageAllocations && isExpanded,
                      )}
                      onPointerMove={getOverlayPointerMoveHandler(
                        projectRowOverlayRefs,
                        projectRowKey,
                        canManageAllocations && isExpanded,
                      )}
                      onPointerLeave={getOverlayPointerLeaveHandler(
                        projectRowOverlayRefs,
                        projectRowKey,
                        canManageAllocations && isExpanded,
                      )}
                    >
                      <GanttProjectItem
                        {...project}
                        style={{
                          height: animatedRowHeight,
                          width: headerWidth,
                          minWidth: headerWidth,
                          borderBottomWidth: isExpanded ? undefined : 0,
                          borderRightWidth: isExpanded ? undefined : 0,
                        }}
                      />
                      {weeks.map((_, i) => {
                        return (
                          <td
                            key={i}
                            colSpan={daysPerWeek}
                            className={cn(
                              "overflow-hidden transition-[height] duration-200 ease-in-out",
                              {
                                "border-r border-outline-gray-1": isExpanded,
                              },
                            )}
                            style={{
                              height: animatedRowHeight,
                            }}
                          />
                        );
                      })}
                      <td
                        aria-hidden="true"
                        className="p-0 border-0 w-0 min-w-0 max-w-0"
                        style={{ width: 0 }}
                      >
                        {isExpanded &&
                          project.allocations?.map((alloc, allocIndex) => {
                            return (
                              <GanttProjectBar
                                key={allocIndex}
                                allocation={alloc}
                                resizable={canEditAllocations}
                              />
                            );
                          })}
                        <RowAllocationOverlay
                          ref={(handle) =>
                            setProjectRowOverlayRef(projectRowKey, handle)
                          }
                          enabled={canManageAllocations && isExpanded}
                          rowKey={projectRowKey}
                          headerWidth={headerWidth}
                          columnWidth={columnWidth}
                          columnCount={columnCount}
                          allocations={project.allocations ?? []}
                          createDraftBar={(left) => ({
                            rowKey: projectRowKey,
                            left,
                            width: columnWidth,
                            employeeId: member.id,
                            projectId: project.id,
                            projectName: project.name,
                            customerName: project.client,
                          })}
                          onOpenAllocation={onAddAllocation}
                        />
                      </td>
                    </tr>
                  );
                })}

                {/* Add project row */}
                {canManageAllocations && (
                  <tr
                    className={cn("relative", {
                      "pointer-events-none": !isExpanded,
                    })}
                    aria-hidden={!isExpanded}
                  >
                    <th
                      className="sticky left-0 z-10 bg-surface-white border-b border-r border-outline-gray-1 pl-8 pr-3 font-normal text-left align-middle flex items-center gap-2 w-full overflow-hidden transition-[height] duration-200 ease-in-out"
                      style={{
                        width: headerWidth,
                        minWidth: headerWidth,
                        height: addProjectRowHeight,
                        borderBottomWidth: isExpanded ? undefined : 0,
                        borderRightWidth: isExpanded ? undefined : 0,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          onAddAllocation?.({ employeeId: member.id })
                        }
                        className="w-full h-full flex items-center gap-2 text-base font-medium text-ink-gray-9 overflow-hidden"
                      >
                        <Plus size={16} className="shrink-0" />
                        <span className="truncate">Add project</span>
                      </button>
                    </th>
                    {weeks.map((_, i) => {
                      return (
                        <td
                          key={i}
                          colSpan={daysPerWeek}
                          className={cn(
                            "overflow-hidden transition-[height] duration-200 ease-in-out",
                            {
                              "border-r border-outline-gray-1": isExpanded,
                            },
                          )}
                          style={{ height: addProjectRowHeight }}
                        />
                      );
                    })}
                    <td
                      aria-hidden="true"
                      className="p-0 border-0 w-0 min-w-0 max-w-0"
                      style={{ width: 0 }}
                    />
                  </tr>
                )}
              </React.Fragment>
            );
          })}
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
