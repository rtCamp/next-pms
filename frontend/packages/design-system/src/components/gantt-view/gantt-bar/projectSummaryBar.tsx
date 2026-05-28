/**
 * Internal dependencies.
 */
import { PreviewCard } from "@base-ui/react/preview-card";
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
    headerWidth,
    hasRoleAccess,
    onAddAllocation,
    onEditAllocation,
    onDeleteAllocation,
    setPendingDeleteEntry,
  } = useGanttStore((state) => ({
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
    <PreviewCard.Root>
      <PreviewCard.Trigger
        delay={400}
        closeDelay={150}
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

GanttProjectSummaryBar.displayName = "GanttProjectSummaryBar";
