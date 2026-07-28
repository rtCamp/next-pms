/**
 * Internal dependencies.
 */
import { Popover } from "@base-ui/react/popover";
import { useGanttStore } from "../ganttStore";
import type { ProjectGroup, ProjectSummaryBar } from "../ganttStore";
import { formatHours } from "../utils";
import { GanttAllocationPopover } from "./allocationPopover";
import { GanttBar } from "./ganttBar";
import { allocationBarToEntry } from "./utils/allocationBarToEntry";
import { withPendingDeleteEntry } from "./utils/withPendingDeleteEntry";

interface GanttProjectSummaryBarProps {
  project: ProjectGroup;
  summary: ProjectSummaryBar;
}

export function GanttProjectSummaryBar({
  project,
  summary,
}: GanttProjectSummaryBarProps) {
  const {
    variant,
    headerWidth,
    hasRoleAccess,
    onAddAllocation,
    onEditAllocation,
    onDeleteAllocation,
    setPendingDeleteEntry,
  } = useGanttStore((state) => ({
    variant: state.variant,
    headerWidth: state.headerWidth,
    hasRoleAccess: state.hasRoleAccess,
    onAddAllocation: state.onAddAllocation,
    onEditAllocation: state.onEditAllocation,
    onDeleteAllocation: state.onDeleteAllocation,
    setPendingDeleteEntry: state.setPendingDeleteEntry,
  }));

  const entries = project.members.flatMap((member) =>
    (member.allocations ?? [])
      .filter(
        (allocation) =>
          allocation.startDate <= summary.endDate &&
          allocation.endDate >= summary.startDate,
      )
      .map((allocation) =>
        withPendingDeleteEntry(
          {
            ...allocationBarToEntry(
              allocation,
              onEditAllocation,
              onDeleteAllocation,
              member.name,
            ),
            memberName: member.name,
            memberImage: member.image,
          },
          setPendingDeleteEntry,
        ),
      ),
  );

  const handleAdd = onAddAllocation
    ? () =>
        onAddAllocation({
          projectId: project.id,
          projectName: project.name,
          customerName: project.client,
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
            variant="projectSummary"
            theme={summary.tentative ? "crosshatch" : "default"}
            label={`${formatHours(summary.hours)}h / week`}
            left={summary.barOffset + headerWidth}
            width={summary.width}
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

GanttProjectSummaryBar.displayName = "GanttProjectSummaryBar";
