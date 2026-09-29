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
import { useProjectList } from "./context";
import type { ProjectListItem } from "./types";
import { useProjectFilters } from "../components/project-filters/useProjectFilters";
import { MONETARY_SORT_FIELDS, PROJECT_LIST_PAGE_SIZE } from "../constants";
import type { ProjectListColumn } from "../types";
import { useProjectViews } from "../views";

const LIST_OPTIONS = {
  options: {
    selectable: false,
    showTooltip: true,
    resizeColumn: false,
    rowHeight: 40,
  },
  slots: { cell: ProjectListCell },
};

function ProjectList() {
  const data = useProjectList((c) => c.state.data);
  const isLoading = useProjectList((c) => c.state.isLoading);
  const isInitialLoad = useProjectList((c) => c.state.isInitialLoad);
  const isFilterRequest = useProjectList((c) => c.state.isFilterRequest);
  const hasMore = useProjectList((c) => c.state.hasMore);
  const loadMore = useProjectList((c) => c.actions.loadMore);
  const activeView = useProjectViews((state) => state.state.activeView);
  const isLoadingView = useProjectViews((state) => state.state.isLoading);

  const { sort, setSort, filters } = useProjectFilters();
  const currency = filters.currency;

  const { columns, pinnedColumns, togglePinned, handleDragEnd } =
    useColumnLayout();

  const pinnedCount = pinnedColumns.length;
  const [pinned, scrolling] = useMemo(
    () => [columns.slice(0, pinnedCount), columns.slice(pinnedCount)],
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

  const renderList = (
    listColumns: ProjectListColumn[],
    offset: number,
    containerClassName: string,
  ) => (
    <ListView
      role="rowgroup"
      columns={listColumns}
      rows={data}
      rowKey="name"
      options={LIST_OPTIONS}
      containerClassName={containerClassName}
      className="py-0 overflow-y-visible"
    >
      <ListHeader
        role="row"
        className="sticky top-0 z-10 mb-0 gap-2 rounded-none border-b border-outline-gray-1 bg-surface-white p-2"
      >
        {listColumns.map((column, index) => (
          <ColumnHeader
            key={column.key}
            column={column}
            index={offset + index}
            pinnedCount={pinnedCount}
            sort={sort}
            isSortDisabled={
              !currency && MONETARY_SORT_FIELDS.includes(column.sortField ?? "")
            }
            onSort={handleHeaderClick}
            onTogglePinned={togglePinned}
          />
        ))}
      </ListHeader>
      <ListRows role="presentation" className="h-auto overflow-y-visible">
        {renderRows(listColumns)}
      </ListRows>
    </ListView>
  );

  const renderRows = (listColumns: ProjectListColumn[]) =>
    data.map((row: ProjectListItem) => (
      <ListRow
        key={row.name}
        role="row"
        row={row}
        separatorClassName="mx-0 border-outline-gray-1"
      >
        {listColumns.map((column) => (
          <div key={column.key} role="cell" className="min-w-0">
            <ProjectListCell row={row} column={column} />
          </div>
        ))}
      </ListRow>
    ));

  return (
    <LoadingOverlay active={isFilterRequest}>
      {isInitialLoad || isLoadingView || !activeView ? (
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
            {!isFilterRequest && data.length === 0 ? (
              <p className="py-6 text-center text-base text-ink-gray-5">
                No projects found.
              </p>
            ) : (
              <InfiniteScroll
                role="presentation"
                className="@container grid min-h-0 flex-1 content-start overflow-auto scrollbar-thin"
                isLoading={isLoading}
                hasMore={hasMore}
                verticalLodMore={loadMore}
                count={PROJECT_LIST_PAGE_SIZE}
              >
                <div
                  role="table"
                  aria-label="Projects"
                  className="flex w-max min-w-full items-start has-[>:last-child_[data-dnd-dragging]]:pointer-events-none"
                >
                  {pinned.length > 0 &&
                    renderList(
                      pinned,
                      0,
                      "left-0 z-20 @4xl:sticky w-auto flex-none overflow-visible border-r border-outline-gray-1 bg-surface-white",
                    )}
                  {renderList(
                    scrolling,
                    pinnedCount,
                    "w-auto min-w-0 flex-1 overflow-visible",
                  )}
                </div>
              </InfiniteScroll>
            )}
          </div>
        </DragDropProvider>
      )}
    </LoadingOverlay>
  );
}

export default ProjectList;
