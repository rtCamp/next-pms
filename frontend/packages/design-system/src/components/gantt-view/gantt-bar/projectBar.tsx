import { PreviewCard } from "@base-ui/react/preview-card";
import { useGanttStore } from "../ganttStore";
import type { ProjectAllocationBar } from "../ganttStore";
import { GanttAllocationPopover } from "./allocationPopover";
import { GanttBar } from "./ganttBar";
import { allocationBarToEntry } from "./utils/allocationBarToEntry";

interface GanttProjectBarProps {
  allocation: ProjectAllocationBar;
  resizable: boolean;
}

export function GanttProjectBar({
  allocation,
  resizable,
}: GanttProjectBarProps) {
  const {
    headerWidth,
    columnWidth,
    hasRoleAccess,
    onEditAllocation,
    onDeleteAllocation,
  } = useGanttStore((s) => ({
    headerWidth: s.headerWidth,
    columnWidth: s.columnWidth,
    hasRoleAccess: s.hasRoleAccess,
    onEditAllocation: s.onEditAllocation,
    onDeleteAllocation: s.onDeleteAllocation,
  }));

  const left = allocation.barOffset + headerWidth;
  const { width, fullNumDays } = allocation;

  const label = `${allocation.hours}h/day for ${fullNumDays} day${fullNumDays !== 1 ? "s" : ""}`;

  const entry = allocationBarToEntry(
    allocation,
    onEditAllocation,
    onDeleteAllocation,
  );

  return (
    <PreviewCard.Root>
      <PreviewCard.Trigger
        delay={400}
        closeDelay={150}
        render={
          <GanttBar
            variant="project"
            theme={allocation.tentative ? "crosshatch" : "default"}
            label={label}
            left={left}
            width={width}
            billable={allocation.billable}
            resizable={resizable}
            snapUnitPx={columnWidth}
          />
        }
      />
      <PreviewCard.Portal>
        <PreviewCard.Positioner side="bottom" align="start" sideOffset={4}>
          <PreviewCard.Popup className="z-50 outline-none">
            <GanttAllocationPopover
              entries={[entry]}
              hasRoleAccess={hasRoleAccess}
            />
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
}

GanttProjectBar.displayName = "GanttProjectBar";
