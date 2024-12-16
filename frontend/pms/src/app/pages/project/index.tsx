/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * External dependencies
 */
import { Filter, Ellipsis, Download, Plus } from "lucide-react";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnSizingState,
} from "@tanstack/react-table";
import _ from "lodash";

/**
 * Internal dependencies
 */
import { DeBounceInput } from "@/app/components/deBounceInput";
import { useQueryParamsState } from "@/lib/queryParam";
import { RootState } from "@/store";
import { Header, Footer } from "@/app/layout/root";
import { LoadMore } from "@/app/components/loadMore";
import {
  setProjectData,
  setSearch,
  setSelectedProjectType,
  setSelectedStatus,
  Status,
  setStart,
  setFilters,
  setSelectedBusinessUnit,
  setTotalCount,
  setCurrency,
  setSelectedBilingType,
  setOrderBy,
} from "@/store/project";
import { ComboxBox } from "@/app/components/comboBox";
import { cn, parseFrappeErrorMsg, createFalseValuedObject, canExport } from "@/lib/utils";
import { CreateView } from "@/app/components/listview/createView";
import { useToast } from "@/app/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";
import { Typography } from "@/app/components/typography";
import { Spinner } from "@/app/components/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { getFilter } from "./utils";
import { useFrappeDocTypeCount } from "@/app/hooks/useFrappeDocCount";
import { Button } from "@/app/components/ui/button";
import Sort from "@/app/components/listview/sort";
import { setViews, ViewData } from "@/store/view";
import { createFilter } from "./utils";
import { getColumnInfo } from "./columns";
import { Export } from "@/app/components/listview/export";
import { Separator } from "@/app/components/ui/separator";
import { sortOrder } from "@/types";
import ColumnSelector from "@/app/components/listview/ColumnSelector";
import ViewWrapper from "@/app/components/listview/ViewWrapper";

type ProjectProps = {
  viewData: ViewData;
  meta: any;
};
const Action = ({ createView, openExportDialog }: { createView: () => void; openExportDialog: () => void }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mr-2 [&_div]:cursor-pointer  [&_div]:gap-x-1">
        <DropdownMenuItem onClick={createView}>
          <Plus />
          <Typography variant="p">Create View </Typography>
        </DropdownMenuItem>
        {canExport("Project") && (
          <DropdownMenuItem onClick={openExportDialog}>
            <Download />
            <Typography variant="p">Export </Typography>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
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
  const user = useSelector((state: RootState) => state.user);
  const appInfo = useSelector((state: RootState) => state.app);
  const { call } = useFrappePostCall("next_pms.timesheet.doctype.pms_view_setting.pms_view_setting.update_view");
  const { toast } = useToast();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [hasViewUpdated, setHasViewUpdated] = useState(false);
  const [colSizing, setColSizing] = useState<ColumnSizingState>(viewData.columns ?? {});
  const [columnOrder, setColumnOrder] = useState<string[]>(viewData.rows ?? []);
  const [isCreateViewOpen, setIsCreateViewOpen] = useState(false);
  const projectState = useSelector((state: RootState) => state.project);
  const [columnVisibility, setColumnVisibility] = useState(createFalseValuedObject(viewData.rows));
  const dispatch = useDispatch();
  const [searchParam, setSearchParam] = useQueryParamsState("search", projectState.search);
  const [projectTypeParam, setProjectTypeParam] = useQueryParamsState<Array<string>>(
    "project-type",
    projectState.selectedProjectType
  );
  const [statusParam, setStatusParam] = useQueryParamsState<Array<Status>>("status", projectState.selectedStatus);
  const [billingTypeParam, setBillingTypeParam] = useQueryParamsState<Array<string>>(
    "billing-type",
    projectState.selectedBillingType
  );
  const [currencyParam, setCurrencyParam] = useQueryParamsState<string>("currency", "");
  const [businessUnitParam, setBusinessUnitParam] = useQueryParamsState<Array<string>>(
    "business-unit",
    projectState.selectedBusinessUnit
  );
  const billing_type = ["Non-Billable", "Retainer", "Fixed Cost", "Time and Material"];
  useEffect(() => {
    dispatch(
      setFilters({
        search: viewData.filters.search ?? "",
        selectedProjectType: viewData.filters.project_type ?? [],
        selectedStatus: viewData.filters.status ?? [],
        selectedBillingType: viewData.filters.billing_type ?? [],
        selectedBusinessUnit: viewData.filters.business_unit ?? [],
        currency: viewData.filters.currency ?? "",
        order: viewData.order_by.order ?? "desc",
        orderColumn: viewData.order_by.field ?? "modified",
      })
    );
    setViewInfo(viewData);
    setColSizing(viewData.columns);
    setColumnOrder(viewData.rows);
    setColumnVisibility(createFalseValuedObject(viewData.rows));
    setHasViewUpdated(false);
  }, [viewData]);

  const { data: projectType } = useFrappeGetCall(
    "frappe.client.get_list",
    {
      doctype: "Project Type",
      fields: ["name"],
      limit_page_length: 0,
    },
    undefined,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );
  const { data: businessUnit } = useFrappeGetCall(
    "frappe.client.get_list",
    {
      doctype: "Business Unit",
      fields: ["name"],
      limit_page_length: 0,
    },
    undefined,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  const { data, error, isLoading } = useFrappeGetCall(
    "next_pms.timesheet.api.project.get_projects",
    {
      fields: viewInfo.rows ?? ["*"],
      // eslint-disable-next-line
      //   @ts-ignore
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, dispatch, error, toast]);

  useEffect(() => {
    if (count) {
      dispatch(setTotalCount(count));
    }
  }, [count, dispatch]);

  useEffect(() => {
    const updateViewData = {
      ...viewInfo,
      columns: { ...viewInfo.columns, ...colSizing },
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
    projectState.orderColumn,
    projectState.order,
    projectState.search,
    projectState.selectedProjectType,
    projectState.selectedStatus,
    projectState.selectedBusinessUnit,
    projectState.selectedBillingType,
    projectState.currency,
  ]);
  useEffect(() => {
    setStatusParam(projectState.selectedStatus);
    setBusinessUnitParam(projectState.selectedBusinessUnit);
    setSearchParam(projectState.search);
    setProjectTypeParam(projectState.selectedProjectType);
    setBillingTypeParam(projectState.selectedBillingType);
    setCurrencyParam(projectState.currency);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    projectState.search,
    projectState.selectedProjectType,
    projectState.selectedStatus,
    projectState.selectedBusinessUnit,
    projectState.selectedBillingType,
    projectState.currency,
  ]);

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.trim();
      dispatch(setSearch(value));
    },
    [dispatch, setSearchParam]
  );
  const handleProjectTypeChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      dispatch(setSelectedProjectType(normalizedFilters));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch]
  );

  const handleStatusChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      dispatch(setSelectedStatus(normalizedFilters as Status[]));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch]
  );
  const handleBillingTypeChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      dispatch(setSelectedBilingType(normalizedFilters as Status[]));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch]
  );
  const handleCurrencyChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters[0] : filters;
      dispatch(setCurrency(normalizedFilters ?? ""));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch]
  );

  const handleBuChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      dispatch(setSelectedBusinessUnit(normalizedFilters));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch]
  );

  const columns = getColumnInfo(meta.fields, viewInfo.rows, viewInfo.columns, currencyParam);
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

  const updateView = () => {
    call({
      view: viewInfo,
    })
      .then((res) => {
        dispatch(setViews(res.message));
        toast({
          variant: "success",
          description: "View Updated",
        });
        setHasViewUpdated(false);
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
      });
  };
  const handleColumnHide = (id: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  const updateColumnOrder = (visibility: { [key: string]: boolean }) => {
    let newColumnOrder;
    if (Object.keys(visibility).length == 0) {
      newColumnOrder = columnOrder;
    } else {
      newColumnOrder = viewInfo.rows.filter((d) => visibility[d]).map((d) => d);
    }
    setColumnOrder(newColumnOrder);
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
  const handleSortChange = (order: sortOrder, orderColumn: string) => {
    dispatch(setOrderBy({ order, orderColumn }));
  };
  useEffect(() => {
    updateColumnSize(columnOrder);
  }, [columnOrder]);

  useEffect(() => {
    updateColumnOrder(columnVisibility);
  }, [columnVisibility]);

  return (
    <>
      <Header className="gap-x-3 flex items-center overflow-x-auto">
        <section id="filter-section" className="flex gap-x-2 items-center">
          <DeBounceInput placeholder="Project Name" value={searchParam} deBounceValue={200} callback={handleSearch} />

          <ComboxBox
            isMulti
            label="Project Type"
            shouldFilter
            value={projectTypeParam}
            onSelect={handleProjectTypeChange}
            leftIcon={<Filter className={cn(projectState.selectedProjectType.length != 0 && "fill-primary")} />}
            rightIcon={
              projectState.selectedProjectType.length > 0 && (
                <Badge className="px-1.5">{projectState.selectedProjectType.length}</Badge>
              )
            }
            data={projectType?.message.map((d: { name: string }) => ({
              label: d.name,
              value: d.name,
            }))}
            className="text-primary border-dashed gap-x-1 font-normal w-fit"
          />
          <ComboxBox
            isMulti
            label="Status"
            shouldFilter
            value={statusParam}
            onSelect={handleStatusChange}
            leftIcon={<Filter className={cn(projectState.selectedStatus.length != 0 && "fill-primary")} />}
            rightIcon={
              projectState.selectedStatus.length > 0 && (
                <Badge className="px-1.5">{projectState.selectedStatus.length}</Badge>
              )
            }
            data={projectState.statusList.map((d: string) => ({
              label: d,
              value: d,
            }))}
            className="text-primary border-dashed  font-normal w-fit"
          />
          <ComboxBox
            isMulti
            label="Business Unit"
            shouldFilter
            value={businessUnitParam}
            onSelect={handleBuChange}
            leftIcon={<Filter className={cn(projectState.selectedBusinessUnit.length != 0 && "fill-primary")} />}
            rightIcon={
              projectState.selectedBusinessUnit.length > 0 && (
                <Badge className="px-1.5">{projectState.selectedBusinessUnit.length}</Badge>
              )
            }
            data={
              businessUnit?.message?.map((d: { name: string }) => ({
                label: d.name,
                value: d.name,
              })) ?? []
            }
            className="text-primary border-dashed  font-normal w-fit"
          />
          <ComboxBox
            isMulti
            label="Billing Type"
            shouldFilter
            value={billingTypeParam}
            onSelect={handleBillingTypeChange}
            leftIcon={<Filter className={cn(projectState.selectedBillingType.length != 0 && "fill-primary")} />}
            rightIcon={
              projectState.selectedBillingType.length > 0 && (
                <Badge className="px-1.5">{projectState.selectedBillingType.length}</Badge>
              )
            }
            data={billing_type.map((d: string) => ({
              label: d,
              value: d,
            }))}
            className="text-primary border-dashed gap-x-1 font-normal w-fit"
          />
          <ComboxBox
            label="Currency"
            shouldFilter
            showSelected
            value={currencyParam ? [currencyParam] : []}
            onSelect={handleCurrencyChange}
            data={appInfo.currencies.map((d: string) => ({
              label: d,
              value: d,
            }))}
            className="text-primary border-dashed  font-normal w-fit"
          />
        </section>
        <div className="flex gap-x-2">
          {hasViewUpdated &&
            (user.user == viewInfo.owner || (viewInfo.public == true && user.user == "Administrator")) && (
              <Button onClick={updateView} variant="ghost">
                Save Changes
              </Button>
            )}
          <ColumnSelector
            onColumnHide={handleColumnHide}
            fieldMeta={meta?.fields}
            setColumnOrder={setColumnOrder}
            columnOrder={viewInfo.rows}
          />
          <Sort
            fieldMeta={meta.fields}
            rows={viewData.rows}
            orderBy={projectState.order}
            field={projectState.orderColumn}
            onSortChange={handleSortChange}
          />
          <Action
            createView={() => {
              setIsCreateViewOpen(true);
            }}
            openExportDialog={() => {
              setIsExportOpen(true);
            }}
          />
        </div>
      </Header>
      {isLoading && projectState.data.length == 0 ? (
        <Spinner isFull />
      ) : (
        <>
          {canExport("Project") && (
            <Export
              isOpen={isExportOpen}
              setIsOpen={setIsExportOpen}
              doctype="Project"
              pageLength={projectState.data.length}
              totalCount={projectState.totalCount}
              orderBy={`${projectState.orderColumn}  ${projectState.order}`}
              fields={viewData.rows.reduce((acc, d) => {
                if (d !== "name") {
                  const m = meta.fields.find((field: { fieldname: string }) => field.fieldname === d);
                  acc[d] = m?.label ?? d;
                }
                return acc;
              }, {})}
            />
          )}
          <CreateView
            isOpen={isCreateViewOpen}
            setIsOpen={setIsCreateViewOpen}
            dt="Project"
            filters={createFilter(projectState)}
            orderBy={{ field: projectState.orderColumn, order: projectState.order }}
            route="project"
            isDefault={false}
            isPublic={false}
            columns={viewInfo.columns}
            rows={viewInfo.rows}
          />
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
