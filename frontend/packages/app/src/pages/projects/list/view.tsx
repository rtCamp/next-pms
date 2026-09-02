/**
 * External dependencies.
 */
import { mergeClassNames as cn } from "@next-pms/design-system";
import { LoadingOverlay, Spinner } from "@next-pms/design-system/components";
import {
  ListHeader,
  ListHeaderItem,
  ListRow,
  ListRows,
  ListView,
  Tooltip,
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
import { MONETARY_SORT_FIELDS, PROJECT_LIST_PAGE_SIZE } from "../constants";

function ProjectList() {
  const data = useProjectList((c) => c.state.data);
  const isLoading = useProjectList((c) => c.state.isLoading);
  const isInitialLoad = useProjectList((c) => c.state.isInitialLoad);
  const isFilterRequest = useProjectList((c) => c.state.isFilterRequest);
  const hasMore = useProjectList((c) => c.state.hasMore);
  const loadMore = useProjectList((c) => c.actions.loadMore);
  const { sort, setSort, filters } = useProjectFilters();
  const currency = filters.currency;

  const handleHeaderClick = (sortField: string) => {
    if (!currency && MONETARY_SORT_FIELDS.includes(sortField)) {
      return;
    }
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
    <LoadingOverlay active={isFilterRequest}>
      {isInitialLoad ? (
        <Spinner isFull />
      ) : (
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
              const isDisabled =
                !currency &&
                MONETARY_SORT_FIELDS.includes(column.sortField ?? "");

              const headerControl = column.sortField ? (
                <button
                  type="button"
                  aria-disabled={isDisabled}
                  className={cn(
                    "flex h-7 min-w-0 items-center gap-1 rounded-sm py-1.5 select-none",
                    isDisabled && "cursor-not-allowed text-ink-gray-5",
                  )}
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
              );

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
                  {isDisabled ? (
                    <Tooltip text="Select a currency to enable this sort">
                      {headerControl}
                    </Tooltip>
                  ) : (
                    headerControl
                  )}
                </ListHeaderItem>
              );
            })}
          </ListHeader>
          <ListRows role="rowgroup">
            {!isFilterRequest && data.length === 0 ? (
              <div role="row">
                <p
                  role="cell"
                  className="py-6 text-center text-base text-ink-gray-5"
                >
                  No projects found.
                </p>
              </div>
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
      )}
    </LoadingOverlay>
  );
}

export default ProjectList;
