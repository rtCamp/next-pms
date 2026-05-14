/**
 * External dependencies.
 */
import React, { useRef } from "react";
import { Plus } from "lucide-react";

/**
 * Internal dependencies.
 */
import { ADD_PROJECT_ROW_HEIGHT, CELL_HEIGHT } from "./constants";
import { GanttMemberBar } from "./gantt-bar/memberBar";
import {
  RowAllocationOverlay,
  type RowAllocationOverlayHandle,
} from "./gantt-bar/rowAllocationOverlay";
import { GanttMemberItem } from "./ganttMemberItem";
import { GanttProjectRow } from "./ganttProjectRow";
import { useGanttStore } from "./ganttStore";
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
    weeks,
    daysPerWeek,
    columnWidth,
    headerWidth,
    columnCount,
    hasRoleAccess,
    onAddAllocation,
    onEditAllocation,
  } = useGanttStore((s) => ({
    member: s.members[memberInd],
    isExpanded: s.expandedRows.has(memberInd),
    weeks: s.weeks,
    daysPerWeek: s.daysPerWeek,
    columnWidth: s.columnWidth,
    headerWidth: s.headerWidth,
    columnCount: s.columnCount,
    hasRoleAccess: s.hasRoleAccess,
    onAddAllocation: s.onAddAllocation,
    onEditAllocation: s.onEditAllocation,
  }));

  const overlayRef = useRef<RowAllocationOverlayHandle | null>(null);

  if (!member) return null;

  const canManageAllocations = hasRoleAccess && Boolean(onAddAllocation);
  const canEditAllocations = hasRoleAccess && Boolean(onEditAllocation);
  const memberRowKey = `member-${memberInd}`;
  const addProjectRowHeight = isExpanded ? ADD_PROJECT_ROW_HEIGHT : 0;

  return (
    <React.Fragment>
      {/* Member row */}
      <tr
        className="relative last:border-b border-outline-gray-1"
        onPointerDown={(e) => overlayRef.current?.handleRowPointerDown(e)}
        onPointerMove={(e) => overlayRef.current?.handleRowPointerMove(e)}
        onPointerLeave={() => overlayRef.current?.clearHoveredSlot()}
      >
        <GanttMemberItem memberInd={memberInd} />
        {weeks.map((_, i) => (
          <td
            key={i}
            colSpan={daysPerWeek}
            className={cn("border-r border-outline-gray-1")}
            style={{ height: CELL_HEIGHT }}
          />
        ))}
        <td
          aria-hidden="true"
          className="p-0 border-0 w-0 min-w-0 max-w-0"
          style={{ width: 0 }}
        >
          {member.memberAllocations.map((alloc, idx) => (
            <GanttMemberBar
              key={idx}
              allocation={alloc}
              memberInd={memberInd}
            />
          ))}
          <RowAllocationOverlay
            ref={overlayRef}
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
      {member.projects?.map((_, projectIndex) => (
        <GanttProjectRow
          key={`${memberInd}-project-${projectIndex}`}
          member={member}
          memberInd={memberInd}
          projectInd={projectIndex}
          isExpanded={isExpanded}
          canManageAllocations={canManageAllocations}
          canEditAllocations={canEditAllocations}
        />
      ))}

      {/* Add project row */}
      {canManageAllocations && (
        <tr
          className={cn("relative", { "pointer-events-none": !isExpanded })}
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
              onClick={() => onAddAllocation?.({ employeeId: member.id })}
              className="w-full h-full flex items-center gap-2 text-base font-medium text-ink-gray-9 overflow-hidden"
            >
              <Plus size={16} className="shrink-0" />
              <span className="truncate">Add project</span>
            </button>
          </th>
          {weeks.map((_, i) => (
            <td
              key={i}
              colSpan={daysPerWeek}
              className={cn(
                "overflow-hidden transition-[height] duration-200 ease-in-out",
                { "border-r border-outline-gray-1": isExpanded },
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
