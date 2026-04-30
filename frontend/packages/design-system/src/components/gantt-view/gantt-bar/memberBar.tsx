import { PreviewCard } from "@base-ui/react/preview-card";
import { differenceInCalendarDays } from "date-fns";
import { FULL_DAY_HOURS } from "../constants";
import { useGanttStore } from "../ganttStore";
import type { MemberAllocationBar } from "../ganttStore";
import { GanttAllocationPopover } from "./allocationPopover";
import { GanttBar } from "./ganttBar";
import { allocationBarToEntry } from "./utils/allocationBarToEntry";
import { getOverlappingAllocations } from "./utils/getOverlappingAllocations";

export type MemberBarAllocation = MemberAllocationBar;

interface GanttMemberBarProps {
  allocation: MemberAllocationBar;
  memberInd: number;
}

export function GanttMemberBar({ allocation, memberInd }: GanttMemberBarProps) {
  const {
    headerWidth,
    members,
    hasRoleAccess,
    onAddAllocation,
    onEditAllocation,
    onDeleteAllocation,
  } = useGanttStore((s) => ({
    headerWidth: s.headerWidth,
    members: s.members,
    hasRoleAccess: s.hasRoleAccess,
    onAddAllocation: s.onAddAllocation,
    onEditAllocation: s.onEditAllocation,
    onDeleteAllocation: s.onDeleteAllocation,
  }));

  const left = allocation.barOffset + headerWidth;
  const { width } = allocation;

  if (allocation.type === "timeoff") {
    const leaveDays =
      differenceInCalendarDays(allocation.endDate, allocation.startDate) + 1;
    const leaveLabel = leaveDays > 2 ? `${leaveDays} days` : "";

    return (
      <GanttBar
        variant="timeoff"
        label={leaveLabel}
        left={left}
        width={width}
      />
    );
  }

  const { hours } = allocation;
  const diff = hours - FULL_DAY_HOURS;
  const isFull = diff === 0;
  const isOver = diff > 0;

  const variant = isFull ? "full" : isOver ? "over" : "under";
  const label = isFull
    ? "Full"
    : isOver
      ? `${diff}h over`
      : `${Math.abs(diff)}h free`;

  // Collect all project allocations overlapping this member bar's date range
  const member = members[memberInd];
  const overlapping = getOverlappingAllocations(
    member,
    allocation.startDate,
    allocation.endDate,
  );

  const entries = overlapping.map((alloc) =>
    allocationBarToEntry(alloc, onEditAllocation, onDeleteAllocation),
  );

  const handleAdd = onAddAllocation
    ? () => onAddAllocation({ employeeId: member.id })
    : undefined;

  return (
    <PreviewCard.Root>
      <PreviewCard.Trigger
        delay={400}
        closeDelay={150}
        render={
          <GanttBar
            variant={variant}
            theme={allocation.tentative ? "crosshatch" : "default"}
            label={label}
            left={left}
            width={width}
            billable={allocation.billable}
          />
        }
      />
      <PreviewCard.Portal>
        <PreviewCard.Positioner side="bottom" align="start" sideOffset={4}>
          <PreviewCard.Popup className="z-50 outline-none">
            <GanttAllocationPopover
              entries={entries}
              onAdd={handleAdd}
              hasRoleAccess={hasRoleAccess}
            />
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
}

GanttMemberBar.displayName = "GanttMemberBar";
