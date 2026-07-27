/**
 * External dependencies.
 */
import React, { useRef } from "react";
import { AddMd } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { ADD_PROJECT_ROW_HEIGHT, CELL_HEIGHT } from "./constants";
import { GanttMemberSummaryBar } from "./gantt-bar/memberSummaryBar";
import {
  RowAllocationOverlay,
  type RowAllocationOverlayHandle,
} from "./gantt-bar/rowAllocationOverlay";
import { GanttMemberItem } from "./ganttMemberItem";
import { GanttProjectRow } from "./ganttProjectRow";
import { GanttRowOverlayCell } from "./ganttRowOverlayCell";
import { useGanttStore } from "./ganttStore";
import { useCollapsiblePresence } from "./hooks/useCollapsiblePresence";
import { mergeClassNames as cn } from "../../utils";

interface GanttMemberRowsProps {
  memberInd: number;
}

export const GanttMemberRows: React.FC<GanttMemberRowsProps> = ({
  memberInd,
}) => {
  const {
    member,
    isExpanded,
    isNextExpanded,
    weeks,
    daysPerWeek,
    columnWidth,
    headerWidth,
    hasRoleAccess,
    onAddAllocation,
    onEditAllocation,
  } = useGanttStore((s) => ({
    member: s.members[memberInd],
    isExpanded: s.expandedRows.has(memberInd),
    isNextExpanded:
      !s.expandedRows.has(memberInd) && s.expandedRows.has(memberInd + 1),
    weeks: s.weeks,
    daysPerWeek: s.daysPerWeek,
    columnWidth: s.columnWidth,
    headerWidth: s.headerWidth,
    hasRoleAccess: s.hasRoleAccess,
    onAddAllocation: s.onAddAllocation,
    onEditAllocation: s.onEditAllocation,
  }));

  const overlayRef = useRef<RowAllocationOverlayHandle | null>(null);
  const childRowsPresence = useCollapsiblePresence(isExpanded, {
    durationMs: 200,
  });

  if (!member) return null;

  const canManageAllocations = hasRoleAccess && Boolean(onAddAllocation);
  const canEditAllocations = hasRoleAccess && Boolean(onEditAllocation);
  const memberRowKey = `member-${memberInd}`;
  const childRowsVisible = childRowsPresence.isVisible;
  const addProjectRowHeight = childRowsVisible ? ADD_PROJECT_ROW_HEIGHT : 0;
  return (
    <React.Fragment>
      {/* Member row */}
      <tr
        className="touch-pan-y last:border-b border-outline-gray-1 animate-fade-in"
        onPointerDown={(e) => overlayRef.current?.handleRowPointerDown(e)}
        onPointerMove={(e) => overlayRef.current?.handleRowPointerMove(e)}
        onPointerLeave={() => overlayRef.current?.clearHoveredSlot()}
      >
        <GanttMemberItem memberInd={memberInd} />
        {weeks.map((_, i) => (
          <td
            key={i}
            colSpan={daysPerWeek}
            className={cn("border-r border-outline-gray-1", {
              "border-b": isNextExpanded,
            })}
            style={{ height: CELL_HEIGHT }}
          />
        ))}
        <GanttRowOverlayCell>
          {member.memberSummaryBars.map((summary, idx) => (
            <GanttMemberSummaryBar
              key={idx}
              summary={summary}
              memberInd={memberInd}
            />
          ))}
          <RowAllocationOverlay
            ref={overlayRef}
            enabled={canManageAllocations}
            allocations={member.memberSummaryBars}
            createDraftBar={(left) => ({
              rowKey: memberRowKey,
              left,
              width: columnWidth,
              employeeId: member.id,
              employeeName: member.name,
            })}
            onOpenAllocation={onAddAllocation}
          />
        </GanttRowOverlayCell>
      </tr>

      {/* Project child rows */}
      {childRowsPresence.shouldRender
        ? member.projects?.map((_, projectIndex) => (
            <GanttProjectRow
              key={`${memberInd}-project-${projectIndex}`}
              member={member}
              memberInd={memberInd}
              projectInd={projectIndex}
              isExpanded={childRowsVisible}
              isLast={projectIndex === member.projects.length - 1}
              canManageAllocations={canManageAllocations}
              canEditAllocations={canEditAllocations}
              onTransitionEnd={childRowsPresence.onTransitionEnd}
            />
          ))
        : null}

      {/* Add project row */}
      {canManageAllocations && childRowsPresence.shouldRender && (
        <tr
          className={cn("touch-pan-y", {
            "pointer-events-none": !childRowsVisible,
          })}
          aria-hidden={!childRowsVisible}
          onTransitionEnd={childRowsPresence.onTransitionEnd}
        >
          <th
            className="sticky left-0 z-25 bg-surface-white border-b border-r border-outline-gray-1 font-normal text-left align-middle transition-[height,background-color] cursor-pointer hover:bg-surface-gray-1"
            style={{
              width: headerWidth,
              minWidth: headerWidth,
              maxWidth: headerWidth,
              height: addProjectRowHeight,
              borderBottomWidth: childRowsVisible ? undefined : 0,
              borderRightWidth: childRowsVisible ? undefined : 0,
            }}
          >
            <div
              className="overflow-hidden transition-[height] duration-200 ease-in-out"
              style={{ height: addProjectRowHeight }}
            >
              <button
                type="button"
                onClick={() =>
                  onAddAllocation?.({
                    employeeId: member.id,
                    employeeName: member.name,
                  })
                }
                tabIndex={childRowsVisible ? undefined : -1}
                className="flex pl-8 pr-3 h-full w-full items-center gap-2 overflow-hidden text-base font-medium text-ink-gray-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-outline-gray-3"
              >
                <AddMd className="size-4 shrink-0" />
                <span className="truncate">Add project</span>
              </button>
            </div>
          </th>
          {weeks.map((_, i) => (
            <td
              key={i}
              colSpan={daysPerWeek}
              className={cn(
                "overflow-hidden transition-[height] duration-200 ease-in-out bg-surface-gray-1/50",
                { "border-r border-b border-outline-gray-1": childRowsVisible },
              )}
              style={{ height: addProjectRowHeight }}
            />
          ))}
          <td
            aria-hidden="true"
            className="p-0 border-0 w-0 min-w-0 max-w-0"
            style={{ width: 0 }}
          />
        </tr>
      )}
    </React.Fragment>
  );
};
