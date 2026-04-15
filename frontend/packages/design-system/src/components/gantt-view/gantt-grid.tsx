import React, { useState } from "react";
import { CELL_HEIGHT, CELL_WIDTH, HEADER_HEIGHT } from "./constants";
import { GanttMemberBar } from "./gantt-bar/member-bar";
import { GanttProjectBar } from "./gantt-bar/project-bar";
import { getMemberAllocation } from "./gantt-bar/utilities/getMemberAllocation";
import { GanttMemberItem } from "./gantt-member-item";
import { GanttProjectItem } from "./gantt-project-item";
import { createGanttStore, GanttContext, useGanttStore } from "./gantt-store";
import { GanttWeekHeader } from "./gantt-week-header";
import type { GanttGridProps, Member } from "./types";
import { mergeClassNames as cn } from "../../utils";

const GanttGridInner: React.FC = () => {
  const {
    members,
    expandedRows,
    headerWidth,
    daysPerWeek,
    weekendColumns,
    resizeHandleActive,
    setResizeHandleActive,
    startResize,
    columnCount,
    weeks,
  } = useGanttStore((s) => ({
    members: s.members,
    expandedRows: s.expandedRows,
    headerWidth: s.headerWidth,
    daysPerWeek: s.daysPerWeek,
    weekendColumns: s.weekendColumns,
    resizeHandleActive: s.resizeHandleActive,
    setResizeHandleActive: s.setResizeHandleActive,
    startResize: s.startResize,
    columnCount: s.columnCount,
    weeks: s.weeks,
  }));

  const onResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    startResize(e.clientX);
  };

  return (
    <div
      className="relative"
      style={{ width: headerWidth + columnCount * CELL_WIDTH }}
    >
      {weekendColumns.length > 0 && (
        <div className="pointer-events-none absolute inset-0 z-0">
          {weekendColumns.map((columnIndex) => (
            <div
              key={`weekend-overlay-${columnIndex}`}
              className="absolute bottom-0 bg-surface-gray-3/20"
              style={{
                top: HEADER_HEIGHT,
                left: headerWidth + columnIndex * CELL_WIDTH,
                width: CELL_WIDTH,
              }}
            />
          ))}
        </div>
      )}

      <table
        className="relative z-10 border-separate border-spacing-0"
        style={{ width: headerWidth + columnCount * CELL_WIDTH }}
      >
        <thead className="sticky top-0 z-20">
          {/* Row 1: corner + week range labels */}
          <tr>
            <th
              rowSpan={2}
              className="sticky left-0 z-20 bg-surface-white border border-l-0 border-outline-gray-1 font-normal"
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
            const memberAlloc = getMemberAllocation(member.projects || []);

            return (
              <React.Fragment key={rowIndex}>
                {/* Member row */}
                <tr className="relative last:border-b border-outline-gray-1">
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
                    {memberAlloc.map((alloc, idx) => (
                      <GanttMemberBar key={idx} allocation={alloc} />
                    ))}
                  </td>
                </tr>

                {/* Project child rows */}
                {member.projects?.map((project, projectIndex) => {
                  const animatedRowHeight = isExpanded ? CELL_HEIGHT : 0;

                  return (
                    <tr
                      key={`${rowIndex}-project-${projectIndex}`}
                      className={cn("relative", {
                        "pointer-events-none": !isExpanded,
                      })}
                      aria-hidden={!isExpanded}
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
                              />
                            );
                          })}
                      </td>
                    </tr>
                  );
                })}
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
  const [store] = useState(() =>
    createGanttStore({
      members: props.members,
      showWeekend: props.showWeekend ?? true,
      startDate: props.startDate,
      weekCount: props.weekCount ?? 3,
    }),
  );
  return (
    <GanttContext.Provider value={store}>
      <GanttGridInner />
    </GanttContext.Provider>
  );
};

GanttGrid.displayName = "GanttGrid";
