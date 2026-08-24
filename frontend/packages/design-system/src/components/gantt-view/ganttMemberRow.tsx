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
import { GanttTimeoffBar } from "./gantt-bar/timeoffBar";
import { GanttMemberItem } from "./ganttMemberItem";
import { GanttRowOverlayCell } from "./ganttRowOverlayCell";
import { useGanttStore } from "./ganttStore";
import type { ProjectGroup, ProjectMember } from "./ganttStore";
import { mergeClassNames as cn } from "../../utils";

interface GanttMemberRowProps {
  project: ProjectGroup;
  member: ProjectMember;
  isExpanded: boolean;
  isLast: boolean;
  canManageAllocations: boolean;
  canEditAllocations: boolean;
  onTransitionEnd?: React.TransitionEventHandler<HTMLTableRowElement>;
}

export const GanttMemberRow: React.FC<GanttMemberRowProps> = ({
  project,
  member,
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
  const memberRowKey = `project-member-${project.id ?? project.name}-${member.id ?? member.name}`;
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
      <GanttMemberItem
        member={member}
        isExpanded={false}
        canExpand={false}
        showChevron={false}
        buttonClassName="pl-8 pr-3"
        contentHeight={animatedRowHeight}
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
            "overflow-hidden transition-[height] duration-200 ease-in-out bg-surface-gray-1/50",
            { "border-r border-outline-gray-1": isExpanded },
            { "border-b border-outline-gray-1": showBottomBorder },
          )}
          style={{ height: animatedRowHeight }}
        />
      ))}
      <GanttRowOverlayCell height={animatedRowHeight}>
        {isExpanded &&
          member.allocations?.map((allocation, allocationIndex) => (
            // TODO: Restore project allocation capacity labels when this view consumes backend-computed employee capacity summaries.
            <GanttAllocationBar
              key={
                allocation.id
                  ? `${allocation.id}-${allocation.startDate.getTime()}`
                  : allocationIndex
              }
              allocation={allocation}
              rowAllocations={member.allocations ?? []}
              memberName={member.name}
              memberImage={member.image}
              resizable={canEditAllocations}
            />
          ))}
        {isExpanded &&
          member.leaveBars?.map((bar) => (
            <GanttTimeoffBar
              key={`${bar.startDate.getTime()}-${bar.endDate.getTime()}`}
              startDate={bar.startDate}
              endDate={bar.endDate}
              timeoff={bar.timeoff}
              label={bar.label}
              left={bar.barOffset + headerWidth}
              width={bar.width}
            />
          ))}
        <RowAllocationOverlay
          ref={overlayRef}
          enabled={canManageAllocations && isExpanded}
          allocations={[
            ...(member.allocations ?? []),
            ...(member.leaveBars ?? []),
          ]}
          createDraftBar={(left) => ({
            rowKey: memberRowKey,
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
