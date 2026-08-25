/**
 * External dependencies.
 */
import { Popover } from "@base-ui/react/popover";

/**
 * Internal dependencies.
 */
import { useGanttStore } from "../ganttStore";
import type { MemberSummaryBar } from "../ganttStore";
import { GanttAllocationPopover } from "./allocationPopover";
import { GanttBar } from "./ganttBar";
import { GanttTimeoffBar } from "./timeoffBar";
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
    variant,
    headerWidth,
    members,
    hasRoleAccess,
    onAddAllocation,
    onEditAllocation,
    onDeleteAllocation,
    setPendingDeleteEntry,
  } = useGanttStore((s) => ({
    variant: s.variant,
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

  if (summary.type === "free") {
    const { label } = getCapacityStatus(
      0,
      members[memberInd].capacityHoursPerDay,
    );

    return (
      <GanttBar
        variant="empty"
        passive
        label={label}
        left={left}
        width={width}
      />
    );
  }

  if (summary.type === "timeoff") {
    return (
      <GanttTimeoffBar
        startDate={summary.startDate}
        endDate={summary.endDate}
        timeoff={summary.timeoff}
        label={summary.label}
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
    <Popover.Root>
      <Popover.Trigger
        openOnHover
        delay={400}
        closeDelay={150}
        nativeButton={false}
        aria-label="Allocation summary"
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
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={4}>
          <Popover.Popup className="z-50 outline-none">
            <GanttAllocationPopover
              entries={entries}
              variant={variant}
              onAdd={handleAdd}
              hasRoleAccess={hasRoleAccess}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

GanttMemberSummaryBar.displayName = "GanttMemberSummaryBar";
