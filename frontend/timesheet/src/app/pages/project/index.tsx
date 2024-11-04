/* eslint-disable @typescript-eslint/no-explicit-any */
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
} from "@/store/project";
import { ComboxBox } from "@/app/components/comboBox";
import { cn, parseFrappeErrorMsg, createFalseValuedObject, checkIsMobile, NO_VALUE_FIELDS } from "@/lib/utils";
import { CreateView } from "@/app/components/listview/createView";
import { useToast } from "@/app/components/ui/use-toast";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnSizingState,
} from "@tanstack/react-table";
import { Filter, Columns2, GripVertical, Ellipsis, Download, Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";
import { Typography } from "@/app/components/typography";
import { Spinner } from "@/app/components/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
import _ from "lodash";
import { setViews, ViewData } from "@/store/view";
import { createFilter, defaultView } from "./utils";
import useFrappeDoctypeMeta from "@/app/hooks/useFrappeDoctypeMeta";
import { getColumnInfo } from "./columns";
import { Export } from "@/app/components/listview/export";
import { useSearchParams } from "react-router-dom";

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
}: {
  fieldMeta: Array<any>;
  onColumnHide: (id: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setColumnOrder: any;
  columnOrder: string[];
}) => {
  const fieldMap = columnOrder
    .map((row) => {
      const d = fieldMeta.find((f: { fieldname: string }) => f.fieldname === row);
      return d !== undefined ? d : null;
    })
    .filter((d) => d !== null);

  const fields = fieldMeta
    .filter((d) => !NO_VALUE_FIELDS.includes(d.fieldtype))
    .filter((d) => !columnOrder.includes(d.fieldname));

  const handleColumnAdd = (fieldname: string) => {
    setColumnOrder((old: string[]) => {
      const newOrder = [...old];
      newOrder.push(fieldname);
      return newOrder;
    });
  };

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
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Add Columns</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="[&_div]:cursor-pointer max-h-96 overflow-y-auto">
              {fields.map((field: any) => {
                return (
                  <DropdownMenuItem
                    className="capitalize cursor-pointer flex gap-x-2 items-center"
                    onClick={() => {
                      handleColumnAdd(field.fieldname);
                    }}
                  >
                    {field.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
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

  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view");
  const { call } = useContext(FrappeContext) as FrappeConfig;
  const dispatch = useDispatch();
  const [viewData, setViewData] = useState<ViewData | undefined>(undefined);

  useEffect(() => {
    if (!view) {
      const viewData = views.views.find((v) => v.dt === "Project" && v.default);
      setViewData(viewData);
      const filters = {
        search: viewData.filters.search ?? "",
        selectedProjectType: viewData.filters.project_type ?? JSON.parse(searchParams.get("project-type") ?? "[]"),
        selectedStatus: viewData.filters.status ?? JSON.parse(searchParams.get("status") ?? "[]"),
        selectedBusinessUnit: viewData.filters.business_unit ?? JSON.parse(searchParams.get("business-unit") ?? "[]"),
        order: viewData.order_by.order as "asc" | "desc",
        orderColumn: viewData.order_by.field,
      };
      dispatch(setFilters(filters));
    } else {
      const viewData = views.views.find((v) => v.name == view);
      if (!viewData) {
        searchParams.delete("view");
        setSearchParams(searchParams);
      }
      setViewData(viewData);
      const filters = {
        search: viewData.filters.search ?? "",
        selectedProjectType: viewData.filters.project_type ?? JSON.parse(searchParams.get("project-type") ?? "[]"),
        selectedStatus: viewData.filters.status ?? JSON.parse(searchParams.get("status") ?? "[]"),
        selectedBusinessUnit: viewData.filters.business_unit ?? JSON.parse(searchParams.get("business-unit") ?? "[]"),
        order: viewData.order_by.order as "asc" | "desc",
        orderColumn: viewData.order_by.field,
      };
      dispatch(setFilters(filters));
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

  const { doc } = useFrappeDoctypeMeta("Project");

  if (doc && viewData) {
    return <ProjectTable viewData={viewData} meta={doc} />;
  } else {
    return <Spinner isFull />;
  }
};

interface ProjectProps {
  viewData: ViewData;
  meta: any;
}

const ProjectTable = ({ viewData, meta }: ProjectProps) => {
  const [viewInfo, setViewInfo] = useState<ViewData>(viewData);

  const { call } = useFrappePostCall("frappe_pms.timesheet.doctype.pms_view_settings.pms_view_settings.update_view");
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
  const [businessUnitParam, setBusinessUnitParam] = useQueryParamsState<Array<string>>(
    "business-unit",
    projectState.selectedBusinessUnit
  );

  useEffect(() => {
    setViewInfo(viewData);
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

  const { data, error, isLoading,  } = useFrappeGetDocList("Project", {
    fields: viewData.rows ?? ["*"],
    // eslint-disable-next-line
    //   @ts-ignore
    filters: getFilter(projectState),
    limit_start: projectState.start,
    limit: projectState.pageLength,
    orderBy: {
      field: projectState.orderColumn,
      order: projectState.order as "asc" | "desc" | undefined,
    },
  });
  const { data: count } = useFrappeDocTypeCount("Project", { filters: getFilter(projectState) });

  useEffect(() => {
    if (data) {
      dispatch(setProjectData(data));
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

  const table = useReactTable({
    columns: getColumnInfo(meta.fields, viewData.rows, viewData.columns),
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

  useEffect(() => {
    updateColumnSize(columnOrder);
  }, [columnOrder]);

  useEffect(() => {
    updateColumnOrder(columnVisibility);
    dispatch(setProjectData([]));
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
          {hasViewUpdated && (
            <Button onClick={updateView} variant="ghost">
              Save Changes
            </Button>
          )}
          <ColumnSelector
            onColumnHide={handleColumnHide}
            fieldMeta={meta?.fields}
            setColumnOrder={setColumnOrder}
            columnOrder={viewData.rows}
          />
          <Sort
            fieldMeta={meta.fields}
            rows={viewData.rows}
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
            fields={viewData.rows.reduce((acc, d) => {
              if (d !== "name") {
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
            columns={viewInfo.columns}
            rows={viewInfo.rows}
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
