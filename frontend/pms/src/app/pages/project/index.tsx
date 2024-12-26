/**
 * External dependencies.
 */
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnSizingState,
} from "@tanstack/react-table";
import { useFrappeGetCall } from "frappe-react-sdk";
import _ from "lodash";

/**
 * Internal dependencies
 */

import ViewWrapper from "@/app/components/listview/ViewWrapper";
import { LoadMore } from "@/app/components/loadMore";
import { Spinner } from "@/app/components/spinner";
import { Typography } from "@/app/components/typography";
import { Separator } from "@/app/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { useToast } from "@/app/components/ui/use-toast";
import { useFrappeDocTypeCount } from "@/app/hooks/useFrappeDocCount";
import { Footer } from "@/app/layout/root";
import { parseFrappeErrorMsg, createFalseValuedObject } from "@/lib/utils";
import { RootState } from "@/store";
import { setProjectData, setStart, setFilters, setTotalCount } from "@/store/project";
import { ViewData } from "@/store/view";
import { DocMetaProps, sortOrder } from "@/types";
import { getColumnInfo } from "./columns";
import { Header as ProjectHeader } from "./Header";
import { getFilter, createFilter } from "./utils";

type ProjectProps = {
  viewData: ViewData;
  meta: DocMetaProps;
};

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
  const [hasViewUpdated, setHasViewUpdated] = useState(false);
  const [colSizing, setColSizing] = useState<ColumnSizingState>(viewData.columns ?? {});
  const [columnOrder, setColumnOrder] = useState<string[]>(viewData.rows ?? []);
  const projectState = useSelector((state: RootState) => state.project);
  const [columnVisibility, setColumnVisibility] = useState(createFalseValuedObject(viewData.rows));
  const dispatch = useDispatch();

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
      })
    );
    setViewInfo(viewData);
    setColSizing(viewData.columns);
    setColumnOrder(viewData.rows);
    setColumnVisibility(createFalseValuedObject(viewData.rows));
    setHasViewUpdated(false);
  }, [dispatch, viewData]);

  const { data, error, isLoading } = useFrappeGetCall(
    "next_pms.timesheet.api.project.get_projects",
    {
      fields: viewInfo.rows ?? ["*"],
      filters: getFilter(projectState),
      limit_start: projectState.start,
      limit: projectState.pageLength,
      currency: projectState.currency,
      order_by: `${projectState.orderColumn} ${projectState.order}`,
    },
    undefined,
    {
      revalidateOnFocus: false,
    }
  );
  const { data: count } = useFrappeDocTypeCount("Project", { filters: getFilter(projectState) });
  
  useEffect(() => {
    if (data) {
      dispatch(setProjectData(data.message));
    }
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast({
        variant: "destructive",
        description: err,
      });
    }
  }, [data, dispatch, error, toast]);

  useEffect(() => {
    if (count) {
      dispatch(setTotalCount(count));
    }
  }, [count, dispatch]);

  useEffect(() => {
    const updateViewData = {
      ...viewData,
      columns: { ...viewData.columns, ...colSizing },
      order_by: { field: projectState.orderColumn, order: projectState.order },
      filters: createFilter(projectState),
      rows: columnOrder,
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
    projectState.order,
    projectState.orderColumn,
    projectState.search,
    projectState.currency,
    projectState.selectedProjectType,
    projectState.selectedStatus,
    projectState.selectedBillingType,
    projectState.selectedBusinessUnit,
    viewData
  ]);

  const columns = getColumnInfo(
    meta.fields,
    viewInfo.rows,
    viewInfo.columns,
    meta.title_field,
    meta.doctype,
    projectState.currency
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
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
      columnOrder,
      columnSizing: colSizing,
    },
  });


  const handleColumnHide = (id: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  const updateColumnOrder = useCallback(
    (visibility: { [key: string]: boolean }) => {
      let newColumnOrder;
      if (Object.keys(visibility).length == 0) {
        newColumnOrder = columnOrder;
      } else {
        newColumnOrder = viewInfo.rows.filter((d) => visibility[d]).map((d) => d);
      }
      setColumnOrder(newColumnOrder);
    },
    [columnOrder, viewInfo.rows]
  );

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

  useEffect(() => {
    updateColumnOrder(columnVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnVisibility]);

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
          <Table className=" [&_td]:px-4 [&_th]:px-4 [&_th]:py-2 table-fixed" style={{ width: table.getTotalSize() }}>
            <TableHeader className=" border-t-0 sticky top-0 z-10 ">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className="group relative hover:cursor-col-resize"
                        {...{
                          onMouseDown: header.getResizeHandler(),
                          onTouchStart: header.getResizeHandler(),
                          style: {
                            userSelect: "none",
                            touchAction: "none",
                            width: header.getSize(),
                          },
                        }}
                      >
                        <div className="flex items-center h-full gap-1 group">
                          <span className="w-full">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          <Separator orientation="vertical" className="group-hover:w-[3px]  cursor-col-resize" />
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
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        className="truncate"
                        key={cell.id}
                        style={{
                          width: cell.column.getSize(),
                          minWidth: cell.column.columnDef.minSize,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="w-full">
                  <TableCell colSpan={viewData.rows.length} className="h-24 text-center">
                    No results
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </>
      )}
      <Footer>
        <div className="flex  justify-between items-center ">
          <LoadMore
            variant="outline"
            disabled={projectState.data.length == (count ?? 0) || isLoading}
            onClick={() => {
              dispatch(setStart());
            }}
          />
          <Typography variant="p" className="lg:px-5 font-semibold">
            {`${projectState.data.length} of ${count ?? 0}`}
          </Typography>
        </div>
      </Footer>
    </>
  );
};
export default Project;
