import { DeBounceInput } from "@/app/components/deBounceInput";
import { useQueryParamsState } from "@/lib/queryParam";
import { RootState } from "@/store";
import { useFrappeGetDocList, useFrappeGetCall } from "frappe-react-sdk";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Header, Footer } from "@/app/layout/root";
import { LoadMore } from "@/app/components/loadMore";
import {
  setProjectData,
  setSearch,
  setSelectedProjectType,
  setSelectedStatus,
  Status,
  updateProjectData,
  ProjectData,
  setStart,
  setFilters,
  setSelectedBusinessUnit,
  setTotalCount,
} from "@/store/project";
import { ComboxBox } from "@/app/components/comboBox";
import { cn, parseFrappeErrorMsg, createFalseValuedObject, checkIsMobile } from "@/lib/utils";
import { useToast } from "@/app/components/ui/use-toast";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  Table as T,
  ColumnSizingState,
} from "@tanstack/react-table";
import { Filter, Columns2, RotateCcw, GripVertical, Ellipsis, Download } from "lucide-react";
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
import { getFilter, getTableProps, projectTableMap, getFieldInfo } from "./helper";
import { getColumn } from "./column";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useFrappeDocTypeCount } from "@/app/hooks/useFrappeDocCount";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import Sort from "./sort";
import { TouchBackend } from "react-dnd-touch-backend";
import { Export } from "@/app/components/listview/export";
import { useParams } from "react-router-dom";
import useFrappeDoctypeMeta from "@/app/hooks/useFrappeDoctypeMeta";

const Project = () => {
  const { type } = useParams();
  const projectState = useSelector((state: RootState) => state.project);
  const dispatch = useDispatch();
  const { toast } = useToast();

  const [tableprop, setTableprop] = useState(getTableProps(type));
  const [colSizing, setColSizing] = useState<ColumnSizingState>({});
  const [columnOrder, setColumnOrder] = useState<string[]>(tableprop.columnOrder);

  const [columnVisibility, setColumnVisibility] = useState(createFalseValuedObject(tableprop.hideColumn));
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [searchParam, setSearchParam] = useQueryParamsState("search", "");
  const [projectTypeParam, setProjectTypeParam] = useQueryParamsState<Array<string>>("project-type", []);
  const [statusParam, setStatusParam] = useQueryParamsState<Array<Status>>("status", []);
  const [businessUnitParam, setBusinessUnitParam] = useQueryParamsState<Array<string>>("business-unit", []);
  const { doc } = useFrappeDoctypeMeta("Project");
  const rows = getFieldInfo(type);
  useEffect(() => {
    const props = getTableProps(type);
    setTableprop(props);
     setColumnOrder(props.columnOrder); 
     setColumnVisibility(createFalseValuedObject(props.hideColumn));
    const payload = {
      selectedProjectType: projectTypeParam,
      search: searchParam,
      selectedStatus: statusParam,
      selectedBusinessUnit: businessUnitParam,
      order: props.order,
      orderColumn: props.orderColumn,
    };
    dispatch(setFilters(payload));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const { data: projectType } = useFrappeGetCall(
    "frappe.client.get_list",
    {
      doctype: "Project Type",
      fields: ["name"],
      limit_page_length: "null",
    },
    undefined,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );
  const { data: businessUnit, error: buError } = useFrappeGetCall(
    "frappe.client.get_list",
    {
      doctype: "Business Unit",
      fields: ["name"],
      limit_page_length: "null",
    },
    undefined,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  const { data, isLoading } = useFrappeGetDocList("Project", {
    fields: rows,
    // eslint-disable-next-line
    //   @ts-ignore
    filters: getFilter(projectState,type),
    limit_start: projectState.start,
    limit: projectState.pageLength,
    orderBy: {
      field: projectState.orderColumn,
      order: projectState.order as "asc" | "desc" | undefined,
    },
  });

  const { data: count } = useFrappeDocTypeCount("Project", { filters: getFilter(projectState, type) });

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

  useEffect(() => {
    if (data) {
      if (projectState.data.length === 0) {
        dispatch(setProjectData(data));
      } else {
        dispatch(updateProjectData(data));
      }
    }

    // if (error) {
    //   const err = parseFrappeErrorMsg(error);
    //   toast({
    //     variant: "destructive",
    //     description: err,
    //   });
    // }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (count) {
      dispatch(setTotalCount(count));
    }
  }, [count, dispatch]);

  useEffect(() => {
    if (buError) {
      const err = parseFrappeErrorMsg(buError);
      toast({
        variant: "destructive",
        description: err,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buError]);
  useEffect(() => {
    const updatedWidth = { ...tableprop.columnWidth, ...colSizing };
    const updatedTableProp = {
      ...tableprop,
      columnWidth: updatedWidth,
      columnOrder: columnOrder,
    };
    setTableprop(updatedTableProp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colSizing, columnOrder]);

  useEffect(() => {
    const updateTableProps = {
      ...tableprop,
      order: projectState.order,
      orderColumn: projectState.orderColumn,
    };
    setTableprop(updateTableProps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectState.order, projectState.orderColumn]);

  useEffect(() => {
    const key = `__listview::project:${type ? type : "all"}`;
    localStorage.setItem(key, JSON.stringify(tableprop));
  }, [tableprop]);

  const columns = getColumn(type, doc?.fields);
  const table = useReactTable({
    columns: columns,
    data: projectState.data,
    enableColumnResizing: true,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    columnResizeMode: "onChange",
    getSortedRowModel: getSortedRowModel(),
    onColumnSizingChange: setColSizing,
    onColumnOrderChange: setColumnOrder,
    state: {
      columnVisibility,
      columnOrder,
      columnSizing: colSizing,
    },
  });

  const resetTable = () => {
    setTableprop(projectTableMap);
    setColumnVisibility({});
    setColumnOrder(projectTableMap.columnOrder);
    table.setColumnSizing(projectTableMap.columnWidth);
  };
  const openExportDialog = () => {
    setIsExportOpen(true);
  };
  const handleColumnHide = (id: string) => {
    const prev = tableprop;
    if (prev.hideColumn.includes(id)) {
      const mutatedHideColumn = [...prev.hideColumn];
      const index = mutatedHideColumn.indexOf(id);
      if (index > -1) {
        mutatedHideColumn.splice(index, 1);
      }
      const attr = { ...prev, hideColumn: mutatedHideColumn };
      setTableprop(attr);
    } else {
      const mutatedHideColumnSet = new Set([...prev.hideColumn, id]);
      const attr = { ...prev, hideColumn: [...mutatedHideColumnSet] };
      setTableprop(attr);
    }
  };

  const getRows = () => {
    const fields: Record<string, string> = {};
    rows
      .filter((field) => field !== "name")
      .forEach((field: string) => {
        const meta = doc?.fields.find((f: { fieldname: string }) => f.fieldname === field);
        if (meta) {
          fields[field] = meta.label;
        }
      });
    return fields;
  };

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
          <ColumnSelector
            table={table}
            onColumnHide={handleColumnHide}
            setColumnOrder={setColumnOrder}
            columnOrder={columnOrder}
            metaFields={doc?.fields}
          />
          <Sort metaFields={doc?.fields} type={type} />
          <Action resetTable={resetTable} openExport={openExportDialog} />
        </div>
      </Header>
      {isLoading && projectState.data.length == 0 ? (
        <Spinner isFull />
      ) : (
        <>
          <Export
            doctype="Project"
            totalCount={projectState.totalCount}
            orderBy={`${projectState.orderColumn} ${projectState.order}`}
            pageLength={projectState.data.length}
            fields={getRows()}
            isOpen={isExportOpen}
            setIsOpen={setIsExportOpen}
            filters={getFilter(projectState,type)}
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

const Action = ({
  resetTable,
  openExport,
}: {
  openExport: React.Dispatch<React.SetStateAction<boolean>>;
  resetTable: () => void;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mr-2 [&_div]:cursor-pointer  [&_div]:gap-x-1">
        <DropdownMenuItem onClick={openExport}>
          <Download />
          <Typography variant="p">Export </Typography>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={resetTable}>
          <RotateCcw />
          <Typography variant="p">Reset Table</Typography>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const ColumnSelector = ({
  table,
  onColumnHide,
  setColumnOrder,
  columnOrder,
  metaFields,
}: {
  table: T<ProjectData>;
  onColumnHide: (id: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setColumnOrder: any;
  metaFields: any;
  columnOrder: string[];
}) => {
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
          {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .sort((a, b) => columnOrder.indexOf(a.id) - columnOrder.indexOf(b.id))
            .map((column) => {
              const label = metaFields.find((f: { fieldname: string }) => f.fieldname == column.id)?.label;

              return (
                <ColumnItem
                  key={column.id}
                  id={column.id}
                  label={label}
                  onColumnHide={onColumnHide}
                  getIsVisible={column.getIsVisible}
                  toggleVisibility={column.toggleVisibility}
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
  getIsVisible,
  toggleVisibility,
  label,
}: {
  id: string;
  label: string;
  onColumnHide: (id: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reOrder: any;
  getIsVisible: () => boolean;
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
        checked={getIsVisible()}
        onCheckedChange={(value) => {
          toggleVisibility(!!value);
          onColumnHide(id);
        }}
      />
      <span
        onClick={() => {
          toggleVisibility(!getIsVisible());
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
export default Project;
