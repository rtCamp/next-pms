/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Spinner,
  Separator,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
} from "@next-pms/design-system/components";
import { useToast } from "@next-pms/design-system/hooks";
import { useInfiniteScroll } from "@next-pms/hooks";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnSizingState,
  OnChangeFn,
  ColumnPinningState,
} from "@tanstack/react-table";
import { useFrappeGetCall } from "frappe-react-sdk";
import _ from "lodash";
import { LockKeyhole, LockOpen } from "lucide-react";

/**
 * Internal dependencies
 */
import ViewWrapper from "@/app/components/list-view/viewWrapper";
import { mergeClassNames, parseFrappeErrorMsg } from "@/lib/utils";
import { RootState } from "@/store";
import { setProjectData, setStart, setFilters, setReFetchData, updateProjectData } from "@/store/project";
import { ViewData } from "@/store/view";
import type { sortOrder } from "@/types";
import { AddProject } from "./components/addProject";
import { getColumnInfo } from "./components/columns";
import { Header as ProjectHeader } from "./components/header";
import { ProjectProps } from "./types";
import { getFilter, createFilter } from "./utils";

const Project = () => {
  const docType = "Project";
  return (
    <ViewWrapper docType={docType}>
      {({ viewData, meta }) => <ProjectTable viewData={viewData} meta={meta.message} />}
    </ViewWrapper>
  );
};

const ProjectTable = ({ viewData, meta }: ProjectProps) => {
  const [viewInfo, setViewInfo] = useState<ViewData>(viewData);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [hasViewUpdated, setHasViewUpdated] = useState(false);
  const [colSizing, setColSizing] = useState<ColumnSizingState>(viewData.columns ?? {});
  const [columnOrder, setColumnOrder] = useState<string[]>(viewData.rows ?? []);
  const projectState = useSelector((state: RootState) => state.project);
  const dispatch = useDispatch();
  const [pinnedColumns, setPinnedColumns] = useState<{ left: string[]; right: string[] }>({
    left: viewData.pinnedColumns || [],
    right: [],
  });

  useEffect(() => {
    dispatch(
      setFilters({
        search: viewData.filters.search ?? "",
        selectedProjectType: viewData.filters.project_type ?? [],
        selectedStatus: viewData.filters.status ?? [],
        selectedBillingType: viewData.filters.billing_type ?? [],
        selectedBusinessUnit: viewData.filters.business_unit ?? [],
        currency: viewData.filters.currency ?? "",
        order: (viewData.order_by.order as sortOrder) ?? "desc",
        orderColumn: viewData.order_by.field ?? "modified",
        tag: viewData.filters.tag ?? [],
      })
    );
    setViewInfo(viewData);
    setColSizing(viewData.columns);
    setColumnOrder(viewData.rows);
    setPinnedColumns({
      left: viewData.pinnedColumns || [],
      right: [],
    });
    setHasViewUpdated(false);
  }, [dispatch, viewData]);

  const { data, isLoading, error, mutate } = useFrappeGetCall(
    "next_pms.timesheet.api.project.get_projects",
    {
      fields: [...viewInfo.rows, "_user_tags", "name"],
      filters: getFilter(projectState),
      start: projectState.start,
      page_length: projectState.pageLength,
      limit: projectState.pageLength,
      currency: projectState.currency,
      order_by: `${projectState.orderColumn} ${projectState.order}`,
    },
    undefined,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      revalidateOnMount: false,
    }
  );

  useEffect(() => {
    if (projectState.isNeedToFetchDataAfterUpdate) {
      mutate();
      dispatch(setReFetchData(false));
    }
  }, [dispatch, mutate, projectState.isNeedToFetchDataAfterUpdate]);

  useEffect(() => {
    if (data) {
      if (projectState.action == "SET") {
        dispatch(setProjectData(data.message));
      } else {
        dispatch(updateProjectData(data.message));
      }
    }
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast({
        variant: "destructive",
        description: err,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, dispatch, error, toast, projectState.currency]);

  useEffect(() => {
    dispatch(setReFetchData(true));
  }, [viewInfo.rows, dispatch]);

  useEffect(() => {
    const updateViewData = {
      ...viewData,
      columns: { ...viewData.columns, ...colSizing },
      order_by: { field: projectState.orderColumn, order: projectState.order },
      filters: createFilter(projectState),
      rows: columnOrder,
      pinnedColumns: pinnedColumns.left,
    };
    if (!_.isEqual(updateViewData, viewData)) {
      setHasViewUpdated(true);
    } else {
      setHasViewUpdated(false);
    }
    setViewInfo(updateViewData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    colSizing,
    columnOrder,
    pinnedColumns,
    projectState.order,
    projectState.orderColumn,
    projectState.search,
    projectState.currency,
    projectState.selectedProjectType,
    projectState.selectedStatus,
    projectState.selectedBillingType,
    projectState.selectedBusinessUnit,
    projectState.tag,
    viewData,
  ]);

  const columns = getColumnInfo(
    meta.fields,
    viewInfo.rows,
    viewInfo.columns,
    meta.title_field,
    meta.doctype,
    projectState.currency,
    navigate
  );

  const table = useReactTable({
    columns: columns,
    data: projectState.data,
    enableColumnResizing: true,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
    getSortedRowModel: getSortedRowModel(),
    onColumnSizingChange: setColSizing,
    onColumnOrderChange: setColumnOrder,
    state: {
      columnOrder,
      columnSizing: colSizing,
      columnPinning: pinnedColumns,
    },
    onColumnPinningChange: setPinnedColumns as OnChangeFn<ColumnPinningState>,
  });

  const handleColumnHide = (id: string) => {
    setColumnOrder((prev) => prev.filter((item) => item !== id));
  };

  const updateColumnSize = (columns: Array<string>) => {
    setColSizing((prevColSizing) => {
      const newColSizing = { ...prevColSizing };
      columns.forEach((column) => {
        if (!Object.prototype.hasOwnProperty.call(newColSizing, column)) {
          newColSizing[column] = 150;
        }
      });
      return newColSizing;
    });
  };

  useEffect(() => {
    updateColumnSize(columnOrder);
  }, [columnOrder]);

  const handleLoadMore = () => {
    if (!projectState.hasMore || projectState.isLoading) return;
    dispatch(setStart(projectState.start + projectState.pageLength));
  };

  const cellRef = useInfiniteScroll({
    isLoading: projectState.isLoading,
    hasMore: projectState.hasMore,
    next: handleLoadMore,
  });

  return (
    <>
      <ProjectHeader
        meta={meta}
        columnOrder={columnOrder}
        setColumnOrder={setColumnOrder}
        onColumnHide={handleColumnHide}
        view={viewInfo}
        stateUpdated={hasViewUpdated}
        setStateUpdated={setHasViewUpdated}
      />

      {isLoading && projectState.data.length == 0 ? (
        <Spinner isFull />
      ) : (
        <>
          <Table className="[&_td]:px-4 [&_th]:px-4 [&_th]:py-2 table-fixed" style={{ width: table.getTotalSize() }}>
            <TableHeader className="border-t-0 sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const column = header.column;
                    const columnId = column.id;
                    const isPinned = column.getIsPinned() === "left";
                    const leftPosition = isPinned ? column.getStart("left") : undefined;

                    return (
                      <TableHead
                        key={header.id}
                        className={mergeClassNames(
                          "group relative hover:cursor-col-resize",
                          isPinned && "sticky z-10 bg-slate-200 dark:bg-gray-900"
                        )}
                        style={{
                          userSelect: "none",
                          touchAction: "none",
                          width: header.getSize(),
                          left: leftPosition,
                          position: isPinned ? "sticky" : undefined,
                          zIndex: isPinned ? 10 : undefined,
                        }}
                        {...{
                          onMouseDown: header.getResizeHandler(),
                          onTouchStart: header.getResizeHandler(),
                        }}
                      >
                        <div className="flex items-center h-full gap-2 group">
                          <Button
                            variant="ghost"
                            title={isPinned ? "Unpin Column" : "Pin Column"}
                            className="cursor-pointer outline-none p-1 py-2 h-5 hover:bg-transparent shrink-0"
                            onClick={() => {
                              if (isPinned) {
                                table.getColumn(columnId)?.pin(false);
                              } else {
                                table.getColumn(columnId)?.pin("left");
                              }
                            }}
                          >
                            {isPinned ? <LockKeyhole className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
                          </Button>
                          <span className="w-full truncate">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          <Separator
                            orientation="vertical"
                            className={mergeClassNames(
                              "group-hover:w-[3px] dark:bg-primary cursor-col-resize shrink-0",
                              isPinned && "bg-slate-300"
                            )}
                          />
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow className="px-3" key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => {
                      const isPinned = cell.column.getIsPinned() === "left";

                      return (
                        <TableCell
                          key={cell.id}
                          className={mergeClassNames(
                            "overflow-hidden",
                            isPinned && "sticky z-1 bg-slate-100 dark:bg-gray-900"
                          )}
                          style={{
                            width: cell.column.getSize(),
                            minWidth: cell.column.columnDef.minSize,
                            left: isPinned ? cell.column.getStart("left") : undefined,
                            zIndex: isPinned ? 1 : undefined,
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow className="w-full">
                  <TableCell colSpan={viewData.rows.length + 1} className="h-24 text-center">
                    No results
                  </TableCell>
                </TableRow>
              )}

              {projectState?.data && projectState.hasMore && (
                <TableRow className="p-0 w-full !px-0" ref={cellRef}>
                  <TableCell colSpan={viewData.rows.length + 1} className="text-center w-full !py-0">
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {projectState.isAddProjectDialogOpen && (
            <AddProject meta={meta} project={projectState} dispatch={dispatch} mutate={mutate} />
          )}
        </>
      )}
    </>
  );
};
export default Project;
