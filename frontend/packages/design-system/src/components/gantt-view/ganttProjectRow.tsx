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
import { GanttProjectItem } from "./ganttProjectItem";
import { GanttRowOverlayCell } from "./ganttRowOverlayCell";
import { useGanttStore } from "./ganttStore";
import type { Member } from "./ganttStore";
import { mergeClassNames as cn } from "../../utils";

interface GanttProjectRowProps {
  member: Member;
  memberInd: number;
  projectInd: number;
  isExpanded: boolean;
  isLast: boolean;
  canManageAllocations: boolean;
  canEditAllocations: boolean;
  onTransitionEnd?: React.TransitionEventHandler<HTMLTableRowElement>;
}

export const GanttProjectRow: React.FC<GanttProjectRowProps> = ({
  member,
  memberInd,
  projectInd,
  isExpanded,
  isLast,
  canManageAllocations,
  canEditAllocations,
  onTransitionEnd,
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
  const project = member.projects?.[projectInd];

  if (!project) return null;

  const projectRowKey = `project-${memberInd}-${projectInd}`;
  const animatedRowHeight = isExpanded ? CELL_HEIGHT : 0;
  const showBottomBorder = isExpanded && isLast && !canManageAllocations;

  return (
    <tr
      className={cn("touch-pan-y", {
        "pointer-events-none": !isExpanded,
      })}
      aria-hidden={!isExpanded}
      onPointerDown={(e) => overlayRef.current?.handleRowPointerDown(e)}
      onPointerMove={(e) => overlayRef.current?.handleRowPointerMove(e)}
      onPointerLeave={() => overlayRef.current?.clearHoveredSlot()}
      onTransitionEnd={onTransitionEnd}
    >
      <GanttProjectItem
        {...project}
        isExpanded={false}
        canExpand={false}
        showChevron={false}
        showHoverCard={false}
        contentHeight={animatedRowHeight}
        style={{
          height: animatedRowHeight,
          width: headerWidth,
          minWidth: headerWidth,
          maxWidth: headerWidth,
          borderBottomWidth: isExpanded ? undefined : 0,
          borderRightWidth: isExpanded ? undefined : 0,
        }}
      />
      {weeks.map((_, i) => (
        <td
          key={i}
          colSpan={daysPerWeek}
          className={cn(
            "overflow-hidden transition-[height] duration-200 ease-in-out bg-surface-gray-1/50",
            { "border-r border-outline-gray-1": isExpanded },
            { "border-b border-outline-gray-1": showBottomBorder },
          )}
          style={{ height: animatedRowHeight }}
        />
      ))}
      <GanttRowOverlayCell height={animatedRowHeight}>
        {isExpanded &&
          project.allocations?.map((alloc, allocIndex) => (
            <GanttAllocationBar
              key={allocIndex}
              allocation={alloc}
              capacityHoursPerDay={member.capacityHoursPerDay}
              resizable={canEditAllocations}
              memberName={member.name}
            />
          ))}
        <RowAllocationOverlay
          ref={overlayRef}
          enabled={canManageAllocations && isExpanded}
          allocations={project.allocations ?? []}
          createDraftBar={(left) => ({
            rowKey: projectRowKey,
            left,
            width: columnWidth,
            employeeId: member.id,
            employeeName: member.name,
            projectId: project.id,
            projectName: project.name,
            customerName: project.client,
          })}
          onOpenAllocation={onAddAllocation}
        />
      </GanttRowOverlayCell>
    </tr>
  );
};
