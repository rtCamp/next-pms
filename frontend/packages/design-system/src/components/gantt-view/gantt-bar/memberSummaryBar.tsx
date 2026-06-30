/**
 * External dependencies.
 */
import { PreviewCard } from "@base-ui/react/preview-card";
import { differenceInCalendarDays } from "date-fns";

/**
 * Internal dependencies.
 */
import { useGanttStore } from "../ganttStore";
import type { MemberSummaryBar } from "../ganttStore";
import { GanttAllocationPopover } from "./allocationPopover";
import { GanttBar } from "./ganttBar";
import { allocationBarToEntry } from "./utils/allocationBarToEntry";
import { getCapacityStatus } from "./utils/getCapacityStatus";
import { getOverlappingAllocations } from "./utils/getOverlappingAllocations";
import { withPendingDeleteEntry } from "./utils/withPendingDeleteEntry";

interface GanttMemberSummaryBarProps {
  summary: MemberSummaryBar;
  memberInd: number;
}

export function GanttMemberSummaryBar({
  summary,
  memberInd,
}: GanttMemberSummaryBarProps) {
  const {
    headerWidth,
    members,
    hasRoleAccess,
    onAddAllocation,
    onEditAllocation,
    onDeleteAllocation,
    setPendingDeleteEntry,
  } = useGanttStore((s) => ({
    headerWidth: s.headerWidth,
    members: s.members,
    hasRoleAccess: s.hasRoleAccess,
    onAddAllocation: s.onAddAllocation,
    onEditAllocation: s.onEditAllocation,
    onDeleteAllocation: s.onDeleteAllocation,
    setPendingDeleteEntry: s.setPendingDeleteEntry,
  }));

  const left = summary.barOffset + headerWidth;
  const { width } = summary;

  if (summary.type === "timeoff") {
    const leaveDays =
      differenceInCalendarDays(summary.endDate, summary.startDate) + 1;
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

  const member = members[memberInd];
  const capacityStatus = getCapacityStatus(
    summary.hours,
    member.capacityHoursPerDay,
  );
  const overlapping = getOverlappingAllocations(
    member,
    summary.startDate,
    summary.endDate,
  );

  const entries = overlapping.map((alloc) =>
    withPendingDeleteEntry(
      allocationBarToEntry(
        alloc,
        onEditAllocation,
        onDeleteAllocation,
        member.name,
      ),
      setPendingDeleteEntry,
    ),
  );

  const handleAdd = onAddAllocation
    ? () =>
        onAddAllocation({
          employeeId: member.id,
          employeeName: member.name,
          startDate: summary.startDate,
          endDate: summary.endDate,
        })
    : undefined;

  return (
    <PreviewCard.Root>
      <PreviewCard.Trigger
        delay={400}
        closeDelay={150}
        render={
          <GanttBar
            variant={capacityStatus.variant}
            theme={summary.tentative ? "crosshatch" : "default"}
            label={capacityStatus.label}
            left={left}
            width={width}
            billable={summary.billable}
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

GanttMemberSummaryBar.displayName = "GanttMemberSummaryBar";
