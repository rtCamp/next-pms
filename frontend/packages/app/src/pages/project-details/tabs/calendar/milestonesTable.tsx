/**
 * Internal dependencies.
 */
import { MILESTONE_COLUMNS } from "./table/columns";
import { TimelineTable } from "./table/timelineTable";
import type { ProjectTimelineItem } from "./types";

type MilestonesTableProps = {
  items: ProjectTimelineItem[];
};

export function MilestonesTable({ items }: MilestonesTableProps) {
  const milestones = items.filter((i) => i.type === "Milestone");

  return (
    <TimelineTable
      items={milestones}
      columns={MILESTONE_COLUMNS}
      emptyMessage="No milestones yet"
    />
  );
}
