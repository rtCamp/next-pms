import { DeBounceInput } from "@/app/components/deBounceInput";
import { useQueryParamsState } from "@/lib/queryParam";
import { RootState } from "@/store";
import {
  useFrappeGetDocList,
  useFrappeGetCall,
  FrappeContext,
  FrappeConfig,
  useFrappePostCall,
} from "frappe-react-sdk";
import { useCallback, useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Header, Footer } from "@/app/layout/root";
import _ from "lodash";
import { LoadMore } from "@/app/components/loadMore";
import {
  setProjectData,
  setSearch,
  setSelectedProjectType,
  setSelectedStatus,
  Status,
  updateProjectData,
  setStart,
  setFilters,
  setSelectedBusinessUnit,
  setTotalCount,
} from "@/store/project";
import { ComboxBox } from "@/app/components/comboBox";
import { cn, parseFrappeErrorMsg, createFalseValuedObject, checkIsMobile } from "@/lib/utils";
import { CreateView } from "@/app/components/listview/createView";
import { useToast } from "@/app/components/ui/use-toast";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnSizingState,
} from "@tanstack/react-table";
import { Filter, Columns2, RotateCcw, GripVertical, Ellipsis, Download, Plus } from "lucide-react";
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
import { getFilter } from "./helper";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useFrappeDocTypeCount } from "@/app/hooks/useFrappeDocCount";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import Sort from "./sort";
import { TouchBackend } from "react-dnd-touch-backend";
import { useLocation } from "react-router-dom";
import { setViews, ViewData } from "@/store/view";
import { createFilter, defaultView } from "./utils";
import useFrappeDoctypeMeta from "@/app/hooks/useFrappeDoctypeMeta";
import { getColumnInfo } from "./columns";
import { Export } from "@/app/components/listview/export";

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
        <DropdownMenuItem onClick={openExportDialog}>
          <Download />
          <Typography variant="p">Export </Typography>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const ColumnSelector = ({
  fieldMeta,
  onColumnHide,
  setColumnOrder,
  columnOrder,
  defaultColumnOrder,
}: {
  fieldMeta: Array<any>;
  onColumnHide: (id: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setColumnOrder: any;
  columnOrder: string[];
  defaultColumnOrder: string[];
}) => {
  const fieldMap = defaultColumnOrder
    .map((row) => {
      const d = fieldMeta.find((f: { fieldname: string }) => f.fieldname === row);
      return d !== undefined ? d : null;
    })
    .filter((d) => d !== null);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Columns2 />
          <Typography variant="p">Columns</Typography>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="[&_div]:cursor-pointer max-h-96 overflow-y-auto">
        <DndProvider backend={checkIsMobile() ? TouchBackend : HTML5Backend}>
          {fieldMap
            .sort((a, b) => columnOrder.indexOf(a.fieldname) - columnOrder.indexOf(b.fieldname))
            .map((field: any) => {
              const isVisible = columnOrder.includes(field.fieldname);
              return (
                <ColumnItem
                  key={field.fieldname}
                  id={field.fieldname}
                  label={field.label}
                  onColumnHide={onColumnHide}
                  isVisible={isVisible}
                  toggleVisibility={() => {}}
                  reOrder={setColumnOrder}
                />
              );
            })}
        </DndProvider>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
const ColumnItem = ({
  id,
  onColumnHide,
  reOrder,
  isVisible,
  label,
  toggleVisibility,
}: {
  id: string;
  onColumnHide: (id: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reOrder: any;
  label: string;
  isVisible: boolean;
  toggleVisibility: (value?: boolean) => void;
}) => {
  const [{ isDragging }, dragRef] = useDrag({
    type: "COLUMN",
    item: { id: id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });
  const [, dropRef] = useDrop({
    accept: "COLUMN",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hover: (draggedColumn: any) => {
      if (draggedColumn.id !== id) {
        reOrder((old: string[]) => {
          const newOrder = [...old];
          const fromIndex = newOrder.indexOf(draggedColumn.id);
          const toIndex = newOrder.indexOf(id);
          newOrder.splice(fromIndex, 1);
          newOrder.splice(toIndex, 0, draggedColumn.id);
          return newOrder;
        });
      }
    },
  });
  return (
    <DropdownMenuItem
      key={id}
      className="capitalize cursor-pointer flex gap-x-2 items-center"
      ref={(node) => dragRef(dropRef(node))}
    >
      <Checkbox
        checked={isVisible}
        onCheckedChange={(value) => {
          toggleVisibility(!!value);
          onColumnHide(id);
        }}
      />
      <span
        onClick={() => {
          toggleVisibility(!isVisible);
          onColumnHide(id);
        }}
        className="w-full flex justify-between"
        style={{
          opacity: isDragging ? 0.5 : 1,
        }}
      >
        {label}
        <GripVertical />
      </span>
    </DropdownMenuItem>
  );
};

const Project = () => {
  const views = useSelector((state: RootState) => state.view);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const view = queryParams.get("view");
  const { call } = useContext(FrappeContext) as FrappeConfig;
  const dispatch = useDispatch();
  const [viewData, setViewData] = useState<ViewData | undefined>(undefined);

  useEffect(() => {
    if (!view) {
      const viewData = views.views.find((v) => v.dt === "Project" && v.default);
      setViewData(viewData);
    } else {
      const viewData = views.views.find((v) => v.name == view);
      setViewData(viewData);
    }
  }, [view, views.views]);

  useEffect(() => {
    const defaultDtView = views.views.find((v) => v.dt === "Project" && v.default);
    if (!defaultDtView) {
      call
        .post("frappe_pms.timesheet.doctype.pms_view_settings.pms_view_settings.create_view", {
          view: defaultView(),
        })
        .then((res) => {
          dispatch(setViews(res.message));
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!viewData) return;
    const filters = {
      search: viewData.filters.search ?? "",
      selectedProjectType: viewData.filters.project_type ?? JSON.parse(queryParams.get("project-type") ?? "[]"),
      selectedStatus: viewData.filters.status ?? JSON.parse(queryParams.get("status") ?? "[]"),
      selectedBusinessUnit: viewData.filters.business_unit ?? JSON.parse(queryParams.get("business-unit") ?? "[]"),
      order: viewData.order_by.order as "asc" | "desc",
      orderColumn: viewData.order_by.field,
    };
    dispatch(setFilters(filters));
  }, [viewData]);

  const { doc } = useFrappeDoctypeMeta("Project");

  if (doc && viewData) {
    return (
      <ProjectTable
        view={view}
        viewData={viewData}
        defaultView={views.views.find((v) => v.dt === "Project" && v.default) ?? defaultView()}
        meta={doc}
      />
    );
  } else {
    return <Spinner isFull />;
  }
};

interface ProjectProps {
  view: string | null;
  viewData: ViewData;
  defaultView: ViewData;
  meta: any;
}
const ProjectTable = ({ view, viewData, meta, defaultView }: ProjectProps) => {
  const [viewInfo, setViewInfo] = useState<ViewData>(viewData);

  const { call } = useFrappePostCall("frappe_pms.timesheet.doctype.pms_view_settings.pms_view_settings.update_view");
  const { toast } = useToast();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  const [colSizing, setColSizing] = useState<ColumnSizingState>(viewInfo.columns ?? {});
  const [columnOrder, setColumnOrder] = useState<string[]>(viewInfo.rows ?? []);
  const [isCreateViewOpen, setIsCreateViewOpen] = useState(false);
  const projectState = useSelector((state: RootState) => state.project);
  const [columnVisibility, setColumnVisibility] = useState(createFalseValuedObject(viewInfo.rows));
  const dispatch = useDispatch();
  const [searchParam, setSearchParam] = useQueryParamsState("search", projectState.search ?? "");
  const [projectTypeParam, setProjectTypeParam] = useQueryParamsState<Array<string>>(
    "project-type",
    projectState.selectedProjectType
  );
  const [statusParam, setStatusParam] = useQueryParamsState<Array<Status>>("status", projectState.selectedStatus);
  const [businessUnitParam, setBusinessUnitParam] = useQueryParamsState<Array<string>>(
    "business-unit",
    projectState.selectedBusinessUnit
  );

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
  const { data, error, isLoading } = useFrappeGetDocList(
    "Project",
    {
      fields: viewInfo.rows ?? ["*"],
      // eslint-disable-next-line
      //   @ts-ignore
      filters: getFilter(projectState),
      limit_start: projectState.start,
      limit: projectState.pageLength,
      orderBy: {
        field: projectState.orderColumn,
        order: projectState.order as "asc" | "desc" | undefined,
      },
    },
    undefined,
    {
      // shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );
  const { data: count } = useFrappeDocTypeCount("Project", { filters: getFilter(projectState) }, undefined, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
  });

  useEffect(() => {
    if (data) {
      if (projectState.data.length === 0) {
        dispatch(setProjectData(data));
      } else {
        dispatch(updateProjectData(data));
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
  }, [data, error]);

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
    setHasChanged(true);
    setViewInfo(updateViewData);
    // dispatch(refreshData());
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
  ]);

  useEffect(() => {
    setStatusParam(projectState.selectedStatus);
    setBusinessUnitParam(projectState.selectedBusinessUnit);
    setSearchParam(projectState.search);
    setProjectTypeParam(projectState.selectedProjectType);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    projectState.search,
    projectState.selectedProjectType,
    projectState.selectedStatus,
    projectState.selectedBusinessUnit,
  ]);

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.trim();
      dispatch(setSearch(value));
      setSearchParam(value);
    },
    [dispatch, setSearchParam]
  );
  const handleProjectTypeChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      dispatch(setSelectedProjectType(normalizedFilters));
      setProjectTypeParam(normalizedFilters);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch]
  );

  const handleStatusChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      dispatch(setSelectedStatus(normalizedFilters as Status[]));
      setStatusParam(normalizedFilters as Status[]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch]
  );

  const handleBuChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      dispatch(setSelectedBusinessUnit(normalizedFilters));
      setBusinessUnitParam(normalizedFilters);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch]
  );

  const columns = getColumnInfo(meta.fields, viewInfo.rows ?? [], viewInfo.columns);
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
        setHasChanged(false);
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
      newColumnOrder = defaultView.rows.filter((d) => visibility[d]).map((d) => d);
    }
    setColumnOrder(newColumnOrder);
  };

  useEffect(() => {
    updateColumnOrder(columnVisibility);
  }, [columnVisibility]);

  return (
    <>
      <Header className="gap-x-3 flex items-center overflow-x-auto">
        <section id="filter-section" className="flex gap-x-2 items-center">
          <DeBounceInput
            placeholder="Project Name"
            value={searchParam}
            deBounceValue={200}
            className="max-w-40 min-w-40 "
            callback={handleSearch}
          />

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
        </section>
        <div className="flex gap-x-2">
          {!_.isEqual(viewInfo, viewData) && !viewInfo.public && hasChanged && (
            <Button variant="ghost" onClick={updateView}>
              Save Changes
            </Button>
          )}
          <ColumnSelector
            onColumnHide={handleColumnHide}
            fieldMeta={meta?.fields}
            setColumnOrder={setColumnOrder}
            columnOrder={columnOrder}
            defaultColumnOrder={defaultView.rows}
          />
          <Sort
            fieldMeta={meta.fields}
            rows={defaultView.rows}
            orderBy={projectState.order}
            field={projectState.orderColumn}
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
          <Export
            isOpen={isExportOpen}
            setIsOpen={setIsExportOpen}
            doctype="Project"
            pageLength={projectState.data.length}
            totalCount={projectState.totalCount}
            orderBy={`${projectState.orderColumn}  ${projectState.order}`}
              fields={viewInfo.rows.reduce((acc, d) => {
                if (d !== 'name') {
                  const m = meta.fields.find((field: { fieldname: string }) => field.fieldname === d);
                  acc[d] = m?.label ?? d;
                }
              return acc;
            }, {})}
          />
          <CreateView
            isOpen={isCreateViewOpen}
            setIsOpen={setIsCreateViewOpen}
            dt="Project"
            filters={createFilter(projectState)}
            orderBy={{ field: projectState.orderColumn, order: projectState.order }}
            route="project"
            isDefault={false}
            isPublic={false}
            columns={viewData?.columns}
            rows={table.getVisibleFlatColumns().map((d) => d.id)}
          />
          <Table className=" [&_td]:px-4 [&_th]:px-4 [&_th]:py-4 table-fixed" style={{ width: table.getTotalSize() }}>
            <TableHeader className=" border-t-0 sticky top-0 z-10 ">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className="relative"
                        style={{
                          width: header.getSize(),
                        }}
                      >
                        <div className="flex items-center h-full gap-1 group">
                          <span className="w-full">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          <GripVertical
                            className="  cursor-col-resize flex justify-center items-center shrink-0"
                            {...{
                              onMouseDown: header.getResizeHandler(),
                              onTouchStart: header.getResizeHandler(),
                              style: {
                                userSelect: "none",
                                touchAction: "none",
                              },
                            }}
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
                  <TableCell colSpan={columns.length} className="h-24 text-center">
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
            disabled={projectState.data.length == (projectState.totalCount ?? 0) || isLoading}
            onClick={() => {
              dispatch(setStart(projectState.start + projectState.pageLength));
            }}
          />
          <Typography variant="p" className="lg:px-5 font-semibold">
            {`${projectState.data.length} of ${projectState.totalCount ?? 0}`}
          </Typography>
        </div>
      </Footer>
    </>
  );
};
export default Project;
