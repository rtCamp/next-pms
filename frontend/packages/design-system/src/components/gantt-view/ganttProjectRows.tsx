/**
 * External dependencies.
 */
import React, { useRef } from "react";
import { AddMd } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { ADD_PROJECT_ROW_HEIGHT, CELL_HEIGHT } from "./constants";
import { GanttProjectSummaryBar } from "./gantt-bar/projectSummaryBar";
import {
  RowAllocationOverlay,
  type RowAllocationOverlayHandle,
} from "./gantt-bar/rowAllocationOverlay";
import { GanttMemberRow } from "./ganttMemberRow";
import { GanttProjectItem } from "./ganttProjectItem";
import { useGanttStore } from "./ganttStore";
import { mergeClassNames as cn } from "../../utils";

interface GanttProjectRowsProps {
  projectInd: number;
}

export const GanttProjectRows: React.FC<GanttProjectRowsProps> = ({
  projectInd,
}) => {
  const {
    project,
    isExpanded,
    isNextExpanded,
    weeks,
    daysPerWeek,
    columnWidth,
    headerWidth,
    hasRoleAccess,
    onAddAllocation,
    onEditAllocation,
    toggleRow,
  } = useGanttStore((s) => ({
    project: s.projects[projectInd],
    isExpanded: s.expandedRows.has(projectInd),
    isNextExpanded:
      !s.expandedRows.has(projectInd) && s.expandedRows.has(projectInd + 1),
    weeks: s.weeks,
    daysPerWeek: s.daysPerWeek,
    columnWidth: s.columnWidth,
    headerWidth: s.headerWidth,
    hasRoleAccess: s.hasRoleAccess,
    onAddAllocation: s.onAddAllocation,
    onEditAllocation: s.onEditAllocation,
    toggleRow: s.toggleRow,
  }));

  const overlayRef = useRef<RowAllocationOverlayHandle | null>(null);

  if (!project) return null;

  const hasMembers = Boolean(project.members?.length);
  const canManageAllocations = hasRoleAccess && Boolean(onAddAllocation);
  const canEditAllocations = hasRoleAccess && Boolean(onEditAllocation);
  const canExpand = hasMembers || canManageAllocations;
  const addMemberRowHeight = isExpanded ? ADD_PROJECT_ROW_HEIGHT : 0;
  const projectSummaryRowKey = `project-summary-${project.id ?? project.name}`;

  return (
    <React.Fragment>
      <tr
        className="relative last:border-b border-outline-gray-1 animate-fade-in"
        onPointerDown={(e) => overlayRef.current?.handleRowPointerDown(e)}
        onPointerMove={(e) => overlayRef.current?.handleRowPointerMove(e)}
        onPointerLeave={() => overlayRef.current?.clearHoveredSlot()}
      >
        <GanttProjectItem
          {...project}
          canExpand={canExpand}
          isExpanded={isExpanded}
          showChevron={true}
          onToggle={() => {
            if (canExpand) {
              toggleRow(projectInd);
            }
          }}
          style={{
            height: CELL_HEIGHT,
            width: headerWidth,
            minWidth: headerWidth,
          }}
        />
        {weeks.map((week, index) => (
          <td
            key={`${week}-${index}`}
            colSpan={daysPerWeek}
            className={cn("border-r border-outline-gray-1", {
              "border-b": isNextExpanded,
            })}
            style={{ height: CELL_HEIGHT }}
          />
        ))}
        <td className="p-0 border-0 w-0 min-w-0 max-w-0" style={{ width: 0 }}>
          {project.projectSummaryBars.map((summary, summaryIndex) => (
            <GanttProjectSummaryBar
              key={`${project.id ?? project.name}-summary-${summaryIndex}`}
              project={project}
              summary={summary}
            />
          ))}
          <RowAllocationOverlay
            ref={overlayRef}
            enabled={canManageAllocations}
            rowKey={projectSummaryRowKey}
            allocations={project.projectSummaryBars}
            createDraftBar={(left) => ({
              rowKey: projectSummaryRowKey,
              left,
              width: columnWidth,
              projectId: project.id,
              projectName: project.name,
              customerName: project.client,
            })}
            onOpenAllocation={onAddAllocation}
          />
        </td>
      </tr>

      {project.members?.map((member) => {
        return (
          <GanttMemberRow
            key={member.id ?? member.name}
            project={project}
            member={member}
            isExpanded={isExpanded}
            canManageAllocations={canManageAllocations}
            canEditAllocations={canEditAllocations}
          />
        );
      })}

      {canManageAllocations && (
        <tr
          className={cn("relative", { "pointer-events-none": !isExpanded })}
          aria-hidden={!isExpanded}
        >
          <th
            className="sticky left-0 z-25 bg-surface-white border-b border-r border-outline-gray-1 pl-8 pr-3 font-normal text-left align-middle flex items-center gap-2 w-full overflow-hidden transition-[height,background-color] cursor-pointer hover:bg-surface-gray-1"
            style={{
              width: headerWidth,
              minWidth: headerWidth,
              height: addMemberRowHeight,
              borderBottomWidth: isExpanded ? undefined : 0,
              borderRightWidth: isExpanded ? undefined : 0,
            }}
          >
            <button
              type="button"
              onClick={() =>
                onAddAllocation?.({
                  projectId: project.id,
                  projectName: project.name,
                  customerName: project.client,
                })
              }
              tabIndex={isExpanded ? undefined : -1}
              className="w-full h-full flex items-center gap-2 text-base font-medium text-ink-gray-9 overflow-hidden"
            >
              <AddMd className="size-4 shrink-0" />
              <span className="truncate">Add member</span>
            </button>
          </th>
          {weeks.map((week, index) => (
            <td
              key={`${week}-${index}`}
              colSpan={daysPerWeek}
              className={cn(
                "overflow-hidden transition-[height] duration-200 ease-in-out",
                { "border-r border-b border-outline-gray-1": isExpanded },
              )}
              style={{ height: addMemberRowHeight }}
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
