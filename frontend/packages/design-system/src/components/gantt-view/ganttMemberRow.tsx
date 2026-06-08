/**
 * External dependencies.
 */
import React, { useRef } from "react";

/**
 * Internal dependencies.
 */
import { CELL_HEIGHT } from "./constants";
import { GanttAllocationBar } from "./gantt-bar/allocationBar";
import {
  RowAllocationOverlay,
  type RowAllocationOverlayHandle,
} from "./gantt-bar/rowAllocationOverlay";
import { GanttMemberItem } from "./ganttMemberItem";
import { useGanttStore } from "./ganttStore";
import type { ProjectGroup, ProjectMember } from "./ganttStore";
import { mergeClassNames as cn } from "../../utils";

interface GanttMemberRowProps {
  project: ProjectGroup;
  member: ProjectMember;
  isExpanded: boolean;
  canManageAllocations: boolean;
  canEditAllocations: boolean;
}

export const GanttMemberRow: React.FC<GanttMemberRowProps> = ({
  project,
  member,
  isExpanded,
  canManageAllocations,
  canEditAllocations,
}) => {
  const { weeks, daysPerWeek, columnWidth, headerWidth, onAddAllocation } =
    useGanttStore((s) => ({
      weeks: s.weeks,
      daysPerWeek: s.daysPerWeek,
      columnWidth: s.columnWidth,
      headerWidth: s.headerWidth,
      onAddAllocation: s.onAddAllocation,
    }));

  const overlayRef = useRef<RowAllocationOverlayHandle | null>(null);
  const memberRowKey = `project-member-${project.id ?? project.name}-${member.id ?? member.name}`;
  const animatedRowHeight = isExpanded ? CELL_HEIGHT : 0;

  return (
    <tr
      className={cn("relative", { "pointer-events-none": !isExpanded })}
      aria-hidden={!isExpanded}
      onPointerDown={(e) => overlayRef.current?.handleRowPointerDown(e)}
      onPointerMove={(e) => overlayRef.current?.handleRowPointerMove(e)}
      onPointerLeave={() => overlayRef.current?.clearHoveredSlot()}
    >
      <GanttMemberItem
        member={member}
        isExpanded={false}
        canExpand={false}
        showChevron={false}
        className="pl-8 pr-3"
        style={{
          height: animatedRowHeight,
          width: headerWidth,
          minWidth: headerWidth,
          borderBottomWidth: isExpanded ? undefined : 0,
          borderRightWidth: isExpanded ? undefined : 0,
        }}
      />
      {weeks.map((week, index) => (
        <td
          key={`${week}-${index}`}
          colSpan={daysPerWeek}
          className={cn(
            "overflow-hidden transition-[height] duration-200 ease-in-out",
            { "border-r border-outline-gray-1": isExpanded },
          )}
          style={{ height: animatedRowHeight }}
        />
      ))}
      <td className="p-0 border-0 w-0 min-w-0 max-w-0" style={{ width: 0 }}>
        {isExpanded &&
          member.allocations?.map((allocation, allocationIndex) => (
            // TODO: Restore project allocation capacity labels when this view consumes backend-computed employee capacity summaries.
            <GanttAllocationBar
              key={allocation.id ?? allocationIndex}
              allocation={allocation}
              memberName={member.name}
              memberImage={member.image}
              resizable={canEditAllocations}
            />
          ))}
        <RowAllocationOverlay
          ref={overlayRef}
          enabled={canManageAllocations && isExpanded}
          rowKey={memberRowKey}
          allocations={member.allocations ?? []}
          createDraftBar={(left) => ({
            rowKey: memberRowKey,
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
};
