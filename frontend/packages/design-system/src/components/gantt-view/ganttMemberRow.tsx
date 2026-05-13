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
import { GanttMemberBar } from "./gantt-bar/memberBar";
import { GanttMemberItem } from "./ganttMemberItem";
import type { Member } from "./ganttStore";
import type { AllocationCallbackData } from "./types";
import type { DraftBarSeed } from "./utils";
import { mergeClassNames as cn } from "../../utils";

interface GanttMemberRowProps {
  rowIndex: number;
  member: Member;
  weeks: number[];
  daysPerWeek: number;
  headerWidth: number;
  columnWidth: number;
  columnCount: number;
  canManageAllocations: boolean;
  onAddAllocation?: (data: AllocationCallbackData) => void;
}

export function GanttMemberRow({
  rowIndex,
  member,
  weeks,
  daysPerWeek,
  headerWidth,
  columnWidth,
  columnCount,
  canManageAllocations,
  onAddAllocation,
}: GanttMemberRowProps) {
  const rowKey = `member-${rowIndex}`;
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
      className="relative last:border-b border-outline-gray-1"
      onMouseMove={canManageAllocations ? handleRowMouseMove : undefined}
      onMouseLeave={canManageAllocations ? clearHoverAddBlock : undefined}
    >
      <GanttMemberItem memberInd={rowIndex} />
      {weeks.map((weekIndex) => (
        <td
          key={weekIndex}
          colSpan={daysPerWeek}
          className={cn("border-r border-outline-gray-1")}
          style={{ height: 60 }}
        />
      ))}
      <td
        aria-hidden="true"
        className="p-0 border-0 w-0 min-w-0 max-w-0"
        style={{ width: 0 }}
      >
        {member.memberAllocations.map((alloc, idx) => (
          <GanttMemberBar key={idx} allocation={alloc} memberInd={rowIndex} />
        ))}
        {draft ? (
          <DraftBar
            key={`draft-member-${rowIndex}`}
            rowKey={draft.rowKey}
            left={draft.left}
            width={draft.width}
            employeeId={draft.employeeId}
            onOpenAllocation={onAddAllocation}
            onRemove={handleRemoveDraftBar}
          />
        ) : null}
        <GanttRowAddBlock
          ref={addBlockRef}
          enabled={canManageAllocations}
          rowKey={rowKey}
          headerWidth={headerWidth}
          columnWidth={columnWidth}
          columnCount={columnCount}
          allocations={member.memberAllocations}
          hasDraft={hasDraft}
          onAddDraftBar={handleAddDraftBar}
          createDraftBar={(left) => ({
            rowKey,
            left,
            width: columnWidth,
            employeeId: member.id,
          })}
        />
      </td>
    </tr>
  );
}
