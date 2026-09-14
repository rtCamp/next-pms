/**
 * External dependencies.
 */
import { useMemo } from "react";
import type { Data } from "@dnd-kit/abstract";
import type {
  SortableDraggable,
  SortableDroppable,
} from "@dnd-kit/dom/sortable";
import { DragDropProvider } from "@dnd-kit/react";
import { mergeClassNames as cn } from "@next-pms/design-system";
import { LoadingOverlay, Spinner } from "@next-pms/design-system/components";
import {
  ListHeader,
  ListRow,
  ListRows,
  ListView,
} from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { InfiniteScroll } from "@/components/infiniteScroll";
import { ProjectListCell } from "./cells";
import {
  COLUMN_DRAG_MODIFIERS,
  COLUMN_DRAG_PLUGINS,
  COLUMN_DRAG_SENSORS,
} from "./columns/constants";
import { ColumnHeader } from "./columns/header";
import { useColumnLayout } from "./columns/useColumnLayout";
import { getColumnCellClasses, getStickyOffsets } from "./columns/utils";
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

  const { columns, pinnedColumns, togglePinned, handleDragEnd } =
    useColumnLayout();

  const pinnedCount = pinnedColumns.length;
  const stickyOffsets = useMemo(
    () => getStickyOffsets(columns, pinnedCount),
    [columns, pinnedCount],
  );

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
        <DragDropProvider<
          Data,
          SortableDraggable<Data>,
          SortableDroppable<Data>
        >
          sensors={COLUMN_DRAG_SENSORS}
          modifiers={COLUMN_DRAG_MODIFIERS}
          plugins={COLUMN_DRAG_PLUGINS}
          onDragEnd={handleDragEnd}
        >
          <div className="flex min-h-0 flex-1 flex-col px-5">
            <ListView
              role="table"
              aria-label="Projects"
              className="py-0 scrollbar-thin overflow-y-visible"
              columns={columns}
              rows={data}
              rowKey="name"
              options={{
                options: {
                  selectable: false,
                  showTooltip: true,
                  resizeColumn: false,
                  rowHeight: 41,
                },
                slots: {
                  cell: ProjectListCell,
                },
              }}
            >
              <ListHeader
                role="row"
                className="mb-0 rounded-none border-b border-outline-gray-1 p-2 pl-0 gap-2 sticky top-0 z-30 bg-surface-white"
              >
                {columns.map((column, index) => (
                  <ColumnHeader
                    key={column.key}
                    column={column}
                    index={index}
                    pinnedCount={pinnedCount}
                    stickyLeft={stickyOffsets.get(column.key)}
                    sort={sort}
                    isSortDisabled={
                      !currency &&
                      MONETARY_SORT_FIELDS.includes(column.sortField ?? "")
                    }
                    onSort={handleHeaderClick}
                    onTogglePinned={togglePinned}
                  />
                ))}
              </ListHeader>
              <ListRows role="rowgroup" className="overflow-y-visible">
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
                      <ListRow
                        key={row.name}
                        role="row"
                        row={row}
                        isLastRow
                        className="pl-0 border-b border-outline-gray-1"
                      >
                        {columns.map((column, index) => (
                          <div
                            key={column.key}
                            role="cell"
                            className={cn(
                              "min-w-0",
                              getColumnCellClasses({ index, pinnedCount }),
                            )}
                            style={
                              index < pinnedCount
                                ? { left: stickyOffsets.get(column.key) }
                                : undefined
                            }
                          >
                            <ProjectListCell row={row} column={column} />
                          </div>
                        ))}
                      </ListRow>
                    ))}
                  </InfiniteScroll>
                )}
              </ListRows>
            </ListView>
          </div>
        </DragDropProvider>
      )}
    </LoadingOverlay>
  );
}

export default ProjectList;
