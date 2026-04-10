import React, { useState } from "react";
import { CELL_HEIGHT, CELL_WIDTH } from "./constants";
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
    resizeHandleActive,
    setResizeHandleActive,
    startResize,
    columnCount,
    weeks,
  } = useGanttStore((s) => ({
    members: s.members,
    expandedRows: s.expandedRows,
    headerWidth: s.headerWidth,
    resizeHandleActive: s.resizeHandleActive,
    setResizeHandleActive: s.setResizeHandleActive,
    startResize: s.startResize,
    columnCount: s.columnCount,
    weeks: s.weeks,
  }));

  const onResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startResize(e.clientX);
  };

  return (
    <div className="overflow-auto w-full">
      <table
        className="relative border-separate border-spacing-0"
        style={{ width: headerWidth + columnCount * CELL_WIDTH }}
      >
        <thead className="sticky top-0 z-10">
          {/* Row 1: corner + week range labels */}
          <tr>
            <th
              rowSpan={2}
              className="sticky left-0 z-20 bg-surface-white border border-l-0 border-outline-gray-2 font-normal"
              style={{ width: headerWidth }}
            >
              Members
              <div
                className={cn(
                  "absolute top-0 right-0 h-full w-1 cursor-col-resize",
                  {
                    "bg-outline-grggVGay-3": resizeHandleActive,
                  },
                )}
                onMouseDown={onResizeMouseDown}
                onMouseEnter={() => setResizeHandleActive(true)}
                onMouseLeave={() => setResizeHandleActive(false)}
              />
            </th>

            {weeks.map((weekIndex) => (
              <GanttWeekHeader key={weekIndex} weekIndex={weekIndex} />
            ))}
          </tr>
        </thead>

        <tbody>
          {members.map((member: Member, rowIndex: number) => {
            const isExpanded = expandedRows.has(rowIndex);
            const isMemberLastRow =
              rowIndex === members.length - 1 && !isExpanded;

            const memberAlloc = getMemberAllocation(member.projects || []);

            return (
              <React.Fragment key={rowIndex}>
                {/* Member row */}
                <tr className="relative last:border-b border-outline-gray-2">
                  <GanttMemberItem
                    {...member}
                    memberInd={rowIndex}
                    onResizeStart={onResizeMouseDown}
                    onResizeHandleEnter={() => setResizeHandleActive(true)}
                    onResizeHandleLeave={() => setResizeHandleActive(false)}
                    highlightResizeHandle={resizeHandleActive}
                  />
                  {weeks.map((_, i) => {
                    return (
                      <td
                        key={i}
                        colSpan={7}
                        className={cn("border-r border-outline-gray-2", {})}
                        style={{
                          height: CELL_HEIGHT,
                        }}
                      />
                    );
                  })}
                  {memberAlloc.map((alloc, idx) => (
                    <GanttMemberBar key={idx} allocation={alloc} />
                  ))}
                </tr>

                {/* Project child rows
                {isExpanded &&
                  row.projects?.map((project: Project, projectIndex: number) => {
                    const isLastProjectRow = isLastMember && projectIndex === (row.projects?.length ?? 0) - 1;
                    return (
                      <tr key={`${rowIndex}-project-${projectIndex}`}>
                        <GanttProjectItem
                          {...project}
                          onResizeStart={onResizeMouseDown}
                          onResizeHandleEnter={() => setResizeHandleActive(true)}
                          onResizeHandleLeave={() => setResizeHandleActive(false)}
                          highlightResizeHandle={resizeHandleActive}
                          style={{
                            height: CELL_HEIGHT,
                            width: headerWidth,
                            minWidth: headerWidth,
                          }}
                        />
                        {columns.map((i) => {
                          const isSaturday = (i + 2) % daysPerWeek === 0 && showWeekend;
                          const isSunday = (i + 1) % daysPerWeek === 0 && showWeekend;
                          const isLastday = (i + 1) % daysPerWeek === 0;
                          return (
                            <td
                              key={i}
                              className={cn({
                                "border-r border-outline-gray-2": isLastday,
                                "border-b border-outline-gray-2": isLastProjectRow,
                                "bg-surface-gray-1": isSaturday || isSunday,
                              })}
                              style={{
                                position: i === 0 ? "relative" : undefined,
                                height: CELL_HEIGHT,
                                width: CELL_WIDTH,
                              }}
                            >
                              {i === 0 && project.allocation?.length && (
                                <div
                                  className="absolute top-0 left-0 pointer-events-none"
                                  style={{
                                    width: columnCount * CELL_WIDTH,
                                    height: CELL_HEIGHT,
                                  }}
                                >
                                  {project.allocation.map((alloc, allocIndex) => (
                                    <GanttProjectBar key={allocIndex} allocation={alloc} />
                                  ))}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })} */}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
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
