/**
 * External dependencies.
 */
import React, { useRef } from "react";

/**
 * Internal dependencies.
 */
import { CELL_HEIGHT } from "./constants";
import { GanttProjectBar } from "./gantt-bar/projectBar";
import {
  RowAllocationOverlay,
  type RowAllocationOverlayHandle,
} from "./gantt-bar/rowAllocationOverlay";
import { GanttProjectItem } from "./ganttProjectItem";
import { useGanttStore } from "./ganttStore";
import type { Member } from "./ganttStore";
import { mergeClassNames as cn } from "../../utils";

interface GanttProjectRowProps {
  member: Member;
  memberInd: number;
  projectInd: number;
  isExpanded: boolean;
  canManageAllocations: boolean;
  canEditAllocations: boolean;
}

export const GanttProjectRow: React.FC<GanttProjectRowProps> = ({
  member,
  memberInd,
  projectInd,
  isExpanded,
  canManageAllocations,
  canEditAllocations,
}) => {
  const {
    weeks,
    daysPerWeek,
    columnWidth,
    headerWidth,
    columnCount,
    onAddAllocation,
  } = useGanttStore((s) => ({
    weeks: s.weeks,
    daysPerWeek: s.daysPerWeek,
    columnWidth: s.columnWidth,
    headerWidth: s.headerWidth,
    columnCount: s.columnCount,
    onAddAllocation: s.onAddAllocation,
  }));

  const overlayRef = useRef<RowAllocationOverlayHandle | null>(null);
  const project = member.projects?.[projectInd];

  if (!project) return null;

  const projectRowKey = `project-${memberInd}-${projectInd}`;
  const animatedRowHeight = isExpanded ? CELL_HEIGHT : 0;

  return (
    <tr
      className={cn("relative", { "pointer-events-none": !isExpanded })}
      aria-hidden={!isExpanded}
      onPointerDown={(e) => overlayRef.current?.handleRowPointerDown(e)}
      onPointerMove={(e) => overlayRef.current?.handleRowPointerMove(e)}
      onPointerLeave={() => overlayRef.current?.clearHoveredSlot()}
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
      {weeks.map((_, i) => (
        <td
          key={i}
          colSpan={daysPerWeek}
          className={cn(
            "dd overflow-hidden transition-[height] duration-200 ease-in-out",
            { "border-r border-outline-gray-1": isExpanded },
          )}
          style={{ height: animatedRowHeight }}
        />
      ))}
      <td
        aria-hidden="true"
        className="p-0 border-0 w-0 min-w-0 max-w-0"
        style={{ width: 0 }}
      >
        {isExpanded &&
          project.allocations?.map((alloc, allocIndex) => (
            <GanttProjectBar
              key={allocIndex}
              allocation={alloc}
              resizable={canEditAllocations}
            />
          ))}
        <RowAllocationOverlay
          ref={overlayRef}
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
};
