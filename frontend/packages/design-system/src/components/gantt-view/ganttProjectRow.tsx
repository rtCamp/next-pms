/**
 * External dependencies.
 */
import React, { useCallback, useRef, useState } from "react";

/**
 * Internal dependencies.
 */
import { DraftBar } from "./gantt-bar/draftBar";
import {
  GanttRowAddBlock,
  type GanttRowAddBlockHandle,
} from "./gantt-bar/ganttRowAddBlock";
import { GanttProjectBar } from "./gantt-bar/projectBar";
import { GanttProjectItem } from "./ganttProjectItem";
import type { Project } from "./ganttStore";
import type { AllocationCallbackData } from "./types";
import type { DraftBarSeed } from "./utils";
import { mergeClassNames as cn } from "../../utils";

interface GanttProjectRowProps {
  rowIndex: number;
  projectIndex: number;
  project: Project;
  memberId?: string;
  isExpanded: boolean;
  animatedRowHeight: number;
  weeks: number[];
  daysPerWeek: number;
  headerWidth: number;
  columnWidth: number;
  columnCount: number;
  canManageAllocations: boolean;
  hasRoleAccess: boolean;
  onAddAllocation?: (data: AllocationCallbackData) => void;
}

export function GanttProjectRow({
  rowIndex,
  projectIndex,
  project,
  memberId,
  isExpanded,
  animatedRowHeight,
  weeks,
  daysPerWeek,
  headerWidth,
  columnWidth,
  columnCount,
  canManageAllocations,
  hasRoleAccess,
  onAddAllocation,
}: GanttProjectRowProps) {
  const rowKey = `project-${rowIndex}-${projectIndex}`;
  const allocations = project.allocations ?? [];
  const addBlockRef = useRef<GanttRowAddBlockHandle>(null);
  const [draft, setDraft] = useState<DraftBarSeed | null>(null);
  const hasDraft = Boolean(draft);

  const handleRowMouseMove = useCallback(
    (event: React.MouseEvent<HTMLTableRowElement>) => {
      addBlockRef.current?.handleRowMouseMove(event);
    },
    [],
  );

  const clearHoverAddBlock = useCallback(() => {
    addBlockRef.current?.clearHoverAddBlock();
  }, []);

  const handleAddDraftBar = useCallback((nextDraft: DraftBarSeed) => {
    setDraft(nextDraft);
  }, []);

  const handleRemoveDraftBar = useCallback((nextRowKey: string) => {
    setDraft((currentDraft) => {
      if (!currentDraft || currentDraft.rowKey !== nextRowKey) {
        return currentDraft;
      }

      return null;
    });
  }, []);

  return (
    <tr
      className={cn("relative", {
        "pointer-events-none": !isExpanded,
      })}
      aria-hidden={!isExpanded}
      onMouseMove={
        canManageAllocations && isExpanded ? handleRowMouseMove : undefined
      }
      onMouseLeave={
        canManageAllocations && isExpanded ? clearHoverAddBlock : undefined
      }
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
      {weeks.map((weekIndex) => (
        <td
          key={weekIndex}
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
      ))}
      <td
        aria-hidden="true"
        className="p-0 border-0 w-0 min-w-0 max-w-0"
        style={{ width: 0 }}
      >
        {isExpanded &&
          allocations.map((alloc, allocIndex) => (
            <GanttProjectBar
              key={allocIndex}
              allocation={alloc}
              resizable={hasRoleAccess}
            />
          ))}
        {isExpanded && draft ? (
          <DraftBar
            key={`draft-project-${rowIndex}-${projectIndex}`}
            rowKey={draft.rowKey}
            left={draft.left}
            width={draft.width}
            employeeId={draft.employeeId}
            projectId={draft.projectId}
            projectName={draft.projectName}
            customerName={draft.customerName}
            onOpenAllocation={onAddAllocation}
            onRemove={handleRemoveDraftBar}
          />
        ) : null}
        <GanttRowAddBlock
          ref={addBlockRef}
          enabled={canManageAllocations && isExpanded}
          rowKey={rowKey}
          headerWidth={headerWidth}
          columnWidth={columnWidth}
          columnCount={columnCount}
          allocations={allocations}
          hasDraft={hasDraft}
          onAddDraftBar={handleAddDraftBar}
          createDraftBar={(left) => ({
            rowKey,
            left,
            width: columnWidth,
            employeeId: memberId,
            projectId: project.id,
            projectName: project.name,
            customerName: project.client,
          })}
        />
      </td>
    </tr>
  );
}
