/**
 * Internal dependencies.
 */
import { TOUCHPOINT_COLUMNS } from "./table/columns";
import { TimelineTable } from "./table/timelineTable";
import type { ProjectTimelineItem } from "./types";

type TouchpointsTableProps = {
  items: ProjectTimelineItem[];
};

export function TouchpointsTable({ items }: TouchpointsTableProps) {
  const touchpoints = items.filter((i) => i.type === "Touchpoint");

  return (
    <TimelineTable
      items={touchpoints}
      columns={TOUCHPOINT_COLUMNS}
      emptyMessage="No touchpoints yet"
    />
  );
}
