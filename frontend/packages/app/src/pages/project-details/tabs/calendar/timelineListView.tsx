/**
 * Internal dependencies.
 */
import { InfiniteScroll } from "@/components/infiniteScroll";
import { TIMELINE_LIST_PAGE_SIZE } from "./constants";
import { useCalendar } from "./context";
import { MILESTONE_COLUMNS, TOUCHPOINT_COLUMNS } from "./table/columns";
import { TimelineTable } from "./table/timelineTable";

export function TimelineListView() {
  const tableTab = useCalendar((c) => c.state.tableTab);
  const searchInput = useCalendar((c) => c.state.searchInput);
  const listItems = useCalendar((c) => c.state.listItems);
  const hasMoreList = useCalendar((c) => c.state.hasMoreList);
  const isLoadingList = useCalendar((c) => c.state.isLoadingList);
  const loadMoreList = useCalendar((c) => c.actions.loadMoreList);

  const isMilestones = tableTab === "milestones";
  const columns = isMilestones ? MILESTONE_COLUMNS : TOUCHPOINT_COLUMNS;
  const itemLabel = isMilestones ? "milestones" : "touchpoints";
  const emptyMessage = searchInput
    ? `No ${itemLabel} found`
    : `No ${itemLabel} yet`;

  return (
    <InfiniteScroll
      isLoading={isLoadingList}
      hasMore={hasMoreList}
      verticalLodMore={loadMoreList}
      count={TIMELINE_LIST_PAGE_SIZE}
    >
      {listItems.length === 0 && isLoadingList ? null : (
        <TimelineTable
          items={listItems}
          columns={columns}
          emptyMessage={emptyMessage}
        />
      )}
    </InfiniteScroll>
  );
}
