import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import {
  ADD_PROJECT_ROW_HEIGHT,
  CELL_HEIGHT,
  HEADER_HEIGHT,
} from "./constants";
import { AddBlock } from "./gantt-bar/addBlock";
import { DraftBar } from "./gantt-bar/draftBar";
import { GanttMemberBar } from "./gantt-bar/memberBar";
import { GanttProjectBar } from "./gantt-bar/projectBar";
import { GanttMemberItem } from "./ganttMemberItem";
import { GanttProjectItem } from "./ganttProjectItem";
import { createGanttStore, GanttContext, useGanttStore } from "./ganttStore";
import type { Member } from "./ganttStore";
import { GanttWeekHeader } from "./ganttWeekHeader";
import { useContainerResize } from "./hooks/useContainerResize";
import { useGanttDraftBars } from "./hooks/useGanttDraftBars";
import type { GanttGridProps } from "./types";
import { mergeClassNames as cn } from "../../utils";

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
    weekStart,
    showWeekend,
    weekendColumns,
    resizeHandleActive,
    setResizeHandleActive,
    startResize,
    columnCount,
    weeks,
    hasRoleAccess,
    onAddAllocation,
  } = useGanttStore((s) => ({
    members: s.members,
    expandedRows: s.expandedRows,
    headerWidth: s.headerWidth,
    daysPerWeek: s.daysPerWeek,
    columnWidth: s.columnWidth,
    weekStart: s.weekStart,
    showWeekend: s.showWeekend,
    weekendColumns: s.weekendColumns,
    resizeHandleActive: s.resizeHandleActive,
    setResizeHandleActive: s.setResizeHandleActive,
    startResize: s.startResize,
    columnCount: s.columnCount,
    weeks: s.weeks,
    hasRoleAccess: s.hasRoleAccess,
    onAddAllocation: s.onAddAllocation,
  }));

  const {
    hoverAddBlock,
    hasDraftForRow,
    getDraftsForRow,
    clearHoverAddBlock,
    addDraftBar,
    resizeDraftBar,
    openDraftBar,
    handleRowMouseMove,
  } = useGanttDraftBars({
    headerWidth,
    columnWidth,
    columnCount,
    weekStart,
    showWeekend,
    onAddAllocation,
  });

  const onResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    startResize(e.clientX);
  };

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

            return (
              <React.Fragment key={rowIndex}>
                {/* Member row */}
                <tr
                  className="relative last:border-b border-outline-gray-1"
                  onMouseMove={
                    hasRoleAccess
                      ? (e) =>
                          handleRowMouseMove(
                            e,
                            `member-${rowIndex}`,
                            member.memberAllocations,
                          )
                      : undefined
                  }
                  onMouseLeave={hasRoleAccess ? clearHoverAddBlock : undefined}
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
                        resizable={true}
                      />
                    ))}
                    {getDraftsForRow(`member-${rowIndex}`).map((draft) => (
                      <DraftBar
                        key={`draft-member-${rowIndex}`}
                        left={draft.left}
                        width={draft.width}
                        onResizeEnd={(nextWidth) =>
                          resizeDraftBar(draft.rowKey, nextWidth)
                        }
                        onClick={() => openDraftBar(draft)}
                      />
                    ))}
                    {hasRoleAccess &&
                      hoverAddBlock?.rowKey === `member-${rowIndex}` &&
                      !hasDraftForRow(`member-${rowIndex}`) && (
                        <AddBlock
                          left={hoverAddBlock.left}
                          width={columnWidth}
                          onClick={() =>
                            addDraftBar({
                              rowKey: `member-${rowIndex}`,
                              left: hoverAddBlock.left,
                              width: columnWidth,
                              employeeId: member.id,
                            })
                          }
                        />
                      )}
                  </td>
                </tr>

                {/* Project child rows */}
                {member.projects?.map((project, projectIndex) => {
                  return (
                    <tr
                      key={`${rowIndex}-project-${projectIndex}`}
                      className={cn("relative", {
                        "pointer-events-none": !isExpanded,
                      })}
                      aria-hidden={!isExpanded}
                      onMouseMove={
                        hasRoleAccess && isExpanded
                          ? (e) =>
                              handleRowMouseMove(
                                e,
                                `project-${rowIndex}-${projectIndex}`,
                                project.allocations ?? [],
                              )
                          : undefined
                      }
                      onMouseLeave={
                        hasRoleAccess && isExpanded
                          ? clearHoverAddBlock
                          : undefined
                      }
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
                                resizable
                              />
                            );
                          })}
                        {isExpanded &&
                          getDraftsForRow(
                            `project-${rowIndex}-${projectIndex}`,
                          ).map((draft) => (
                            <DraftBar
                              key={`draft-project-${rowIndex}-${projectIndex}`}
                              left={draft.left}
                              width={draft.width}
                              onResizeEnd={(nextWidth) =>
                                resizeDraftBar(draft.rowKey, nextWidth)
                              }
                              onClick={() => openDraftBar(draft)}
                            />
                          ))}
                        {hasRoleAccess &&
                          isExpanded &&
                          hoverAddBlock?.rowKey ===
                            `project-${rowIndex}-${projectIndex}` &&
                          !hasDraftForRow(
                            `project-${rowIndex}-${projectIndex}`,
                          ) && (
                            <AddBlock
                              left={hoverAddBlock.left}
                              width={columnWidth}
                              onClick={() =>
                                addDraftBar({
                                  rowKey: `project-${rowIndex}-${projectIndex}`,
                                  left: hoverAddBlock.left,
                                  width: columnWidth,
                                  employeeId: member.id,
                                  projectId: project.id,
                                  projectName: project.name,
                                })
                              }
                            />
                          )}
                      </td>
                    </tr>
                  );
                })}

                {/* Add project row */}
                {hasRoleAccess && (
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
            onMouseEnter={() => setResizeHandleActive(true)}
            onMouseLeave={() => setResizeHandleActive(false)}
          />
        </div>
      </div>
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
