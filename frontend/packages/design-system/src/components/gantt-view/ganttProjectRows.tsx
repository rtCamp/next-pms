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
import { GanttRowOverlayCell } from "./ganttRowOverlayCell";
import { useGanttStore } from "./ganttStore";
import { useCollapsiblePresence } from "./hooks/useCollapsiblePresence";
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
  const childRowsPresence = useCollapsiblePresence(isExpanded, {
    durationMs: 200,
  });

  if (!project) return null;

  const hasMembers = Boolean(project.members?.length);
  const canManageAllocations = hasRoleAccess && Boolean(onAddAllocation);
  const canEditAllocations = hasRoleAccess && Boolean(onEditAllocation);
  const canExpand = hasMembers || canManageAllocations;
  const childRowsVisible = childRowsPresence.isVisible;
  const addMemberRowHeight = childRowsVisible ? ADD_PROJECT_ROW_HEIGHT : 0;
  const projectSummaryRowKey = `project-summary-${project.id ?? project.name}`;

  return (
    <React.Fragment>
      <tr
        className="touch-pan-y last:border-b border-outline-gray-1 animate-fade-in"
        onPointerDown={(e) => overlayRef.current?.handleRowPointerDown(e)}
        onPointerMove={(e) => overlayRef.current?.handleRowPointerMove(e)}
        onPointerLeave={() => overlayRef.current?.clearHoveredSlot()}
      >
        <GanttProjectItem
          {...project}
          canExpand={canExpand}
          isExpanded={isExpanded}
          showChevron={true}
          hasRoleAccess={hasRoleAccess}
          onToggle={() => {
            if (canExpand) {
              toggleRow(projectInd);
            }
          }}
          style={{
            height: CELL_HEIGHT,
            width: headerWidth,
            minWidth: headerWidth,
            maxWidth: headerWidth,
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
        <GanttRowOverlayCell>
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
        </GanttRowOverlayCell>
      </tr>

      {childRowsPresence.shouldRender
        ? project.members?.map((member) => {
            return (
              <GanttMemberRow
                key={member.id ?? member.name}
                project={project}
                member={member}
                isExpanded={childRowsVisible}
                canManageAllocations={canManageAllocations}
                canEditAllocations={canEditAllocations}
                onTransitionEnd={childRowsPresence.onTransitionEnd}
              />
            );
          })
        : null}

      {canManageAllocations && childRowsPresence.shouldRender && (
        <tr
          className={cn("touch-pan-y", {
            "pointer-events-none": !childRowsVisible,
          })}
          aria-hidden={!childRowsVisible}
          onTransitionEnd={childRowsPresence.onTransitionEnd}
        >
          <th
            className="sticky left-0 z-25 bg-surface-white border-b border-r border-outline-gray-1 pl-8 pr-3 font-normal text-left align-middle transition-[height,background-color] cursor-pointer hover:bg-surface-gray-1"
            style={{
              width: headerWidth,
              minWidth: headerWidth,
              maxWidth: headerWidth,
              height: addMemberRowHeight,
              borderBottomWidth: childRowsVisible ? undefined : 0,
              borderRightWidth: childRowsVisible ? undefined : 0,
            }}
          >
            <div
              className="overflow-hidden transition-[height] duration-200 ease-in-out"
              style={{ height: addMemberRowHeight }}
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
                tabIndex={childRowsVisible ? undefined : -1}
                className="flex h-full w-full items-center gap-2 overflow-hidden text-base font-medium text-ink-gray-8"
              >
                <AddMd className="size-4 shrink-0" />
                <span className="truncate">Add member</span>
              </button>
            </div>
          </th>
          {weeks.map((week, index) => (
            <td
              key={`${week}-${index}`}
              colSpan={daysPerWeek}
              className={cn(
                "overflow-hidden transition-[height] duration-200 ease-in-out bg-surface-gray-1/50",
                { "border-r border-b border-outline-gray-1": childRowsVisible },
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
