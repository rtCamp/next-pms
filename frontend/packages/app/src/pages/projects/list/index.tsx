/**
 * External dependencies.
 */
import {
  ListHeader,
  ListHeaderItem,
  ListRow,
  ListRows,
  ListView,
} from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { InfiniteScroll } from "@/components/infiniteScroll";
import { ProjectListCell } from "./cells";
import { PROJECT_LIST_COLUMNS } from "./columns";
import { PROJECT_LIST_PAGE_SIZE } from "../constants";
import { useProjectList } from "../context";

function ProjectList() {
  const data = useProjectList((c) => c.state.data);
  const isLoading = useProjectList((c) => c.state.isLoading);
  const hasMore = useProjectList((c) => c.state.hasMore);
  const error = useProjectList((c) => c.state.error);
  const loadMore = useProjectList((c) => c.actions.loadMore);

  if (error || (isLoading && data.length === 0)) {
    return;
  }

  return (
    <ListView
      className="px-5 py-0 scrollbar-thin"
      columns={PROJECT_LIST_COLUMNS}
      rows={data}
      rowKey="name"
      options={{
        options: {
          selectable: true,
          showTooltip: true,
          resizeColumn: false,
        },
        slots: {
          cell: ProjectListCell,
        },
      }}
    >
      <ListHeader className="mb-0 rounded-none bg-transparent border-b border-outline-gray-1 p-2 gap-2">
        {PROJECT_LIST_COLUMNS.map((column) => (
          <ListHeaderItem key={column.key} item={column}>
            <div className="flex h-7 items-center py-1.5">
              <span className="truncate">{column.label}</span>
            </div>
          </ListHeaderItem>
        ))}
      </ListHeader>
      <ListRows>
        <InfiniteScroll
          isLoading={isLoading}
          hasMore={hasMore}
          verticalLodMore={loadMore}
          count={PROJECT_LIST_PAGE_SIZE}
        >
          {data.map((row) => (
            <ListRow key={row.name} row={row}>
              {PROJECT_LIST_COLUMNS.map((column) => {
                return <ProjectListCell row={row} column={column} />;
              })}
            </ListRow>
          ))}
        </InfiniteScroll>
      </ListRows>
    </ListView>
  );
}

export default ProjectList;
