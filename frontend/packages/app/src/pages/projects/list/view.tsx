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
import { ArrowDown, ArrowUp } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { InfiniteScroll } from "@/components/infiniteScroll";
import { ProjectListCell } from "./cells";
import { PROJECT_LIST_COLUMNS } from "./columns";
import { useProjectList } from "./context";
import { useProjectFilters } from "../components/project-filters/useProjectFilters";
import { PROJECT_LIST_PAGE_SIZE } from "../constants";

function ProjectList() {
  const data = useProjectList((c) => c.state.data);
  const isLoading = useProjectList((c) => c.state.isLoading);
  const hasMore = useProjectList((c) => c.state.hasMore);
  const loadMore = useProjectList((c) => c.actions.loadMore);
  const { sort, setSort } = useProjectFilters();

  const handleHeaderClick = (sortField: string) => {
    if (sort.field === sortField) {
      setSort({
        field: sortField,
        order: sort.order === "asc" ? "desc" : "asc",
      });
    } else {
      setSort({ field: sortField, order: "desc" });
    }
  };

  return (
    <ListView
      role="table"
      aria-label="Projects"
      className="px-5 py-0 scrollbar-thin"
      columns={PROJECT_LIST_COLUMNS}
      rows={data}
      rowKey="name"
      options={{
        options: {
          selectable: false,
          showTooltip: true,
          resizeColumn: false,
        },
        slots: {
          cell: ProjectListCell,
        },
      }}
    >
      <ListHeader
        role="row"
        className="mb-0 rounded-none bg-transparent border-b border-outline-gray-1 p-2 gap-2"
      >
        {PROJECT_LIST_COLUMNS.map((column) => {
          const isSorted = sort.field === column.sortField;
          return (
            <ListHeaderItem
              key={column.key}
              role="columnheader"
              aria-sort={
                column.sortField
                  ? isSorted
                    ? sort.order === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                  : undefined
              }
              item={column}
            >
              {column.sortField ? (
                <button
                  type="button"
                  className="flex h-7 min-w-0 items-center gap-1 rounded-sm py-1.5 select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-outline-gray-3"
                  onClick={() => handleHeaderClick(column.sortField!)}
                >
                  <span className="truncate">{column.label}</span>
                  {isSorted &&
                    (sort.order === "asc" ? (
                      <ArrowUp className="size-3.5 shrink-0 text-ink-gray-7" />
                    ) : (
                      <ArrowDown className="size-3.5 shrink-0 text-ink-gray-7" />
                    ))}
                </button>
              ) : (
                <div className="flex h-7 items-center gap-1 py-1.5">
                  <span className="truncate">{column.label}</span>
                </div>
              )}
            </ListHeaderItem>
          );
        })}
      </ListHeader>
      <ListRows role="rowgroup">
        {data.length === 0 ? (
          <p className="py-6 text-center text-base text-ink-gray-5">
            No projects found.
          </p>
        ) : (
          <InfiniteScroll
            role="presentation"
            isLoading={isLoading}
            hasMore={hasMore}
            verticalLodMore={loadMore}
            count={PROJECT_LIST_PAGE_SIZE}
          >
            {data.map((row) => (
              <ListRow key={row.name} role="row" row={row}>
                {PROJECT_LIST_COLUMNS.map((column) => {
                  return (
                    <div key={column.key} role="cell" className="min-w-0">
                      <ProjectListCell row={row} column={column} />
                    </div>
                  );
                })}
              </ListRow>
            ))}
          </InfiniteScroll>
        )}
      </ListRows>
    </ListView>
  );
}

export default ProjectList;
