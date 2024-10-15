import { DeBounceInput } from "@/app/components/deBounceInput";
import { useQueryParamsState } from "@/lib/queryParam";
import { RootState } from "@/store";
import { useFrappeGetDocList, useFrappeGetCall } from "frappe-react-sdk";
import { useCallback, useEffect, useMemo, useState } from "react";
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
} from "@/store/project";
import { ComboxBox } from "@/app/components/comboBox";
import { cn, parseFrappeErrorMsg, createFalseValuedObject } from "@/lib/utils";
import { useToast } from "@/app/components/ui/use-toast";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  Table as T,
  ColumnSizingState,
} from "@tanstack/react-table";
import { Filter, EllipsisVertical, Columns2, RotateCcw } from "lucide-react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";
import { Typography } from "@/app/components/typography";
import { Spinner } from "@/app/components/spinner";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { getFilter, getTableProps, projectTableMap } from "./helper";
import { DraggableColumnHeader, getColumn } from "./column";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Export } from "@/app/components/export";
import { useFrappeDocTypeCount } from "@/app/hooks/useFrappeDocCount";

const Project = () => {
  const projectState = useSelector((state: RootState) => state.project);
  const dispatch = useDispatch();
  const { toast } = useToast();

  const tableprop = useMemo(() => {
    return getTableProps();
  }, []);
  const [colSizing, setColSizing] = useState<ColumnSizingState>({});
  const [columnOrder, setColumnOrder] = useState<string[]>(tableprop.columnOrder);
  const [tableAttributeProps, setTableAttributeProps] = useState(tableprop);
  const [columnVisibility, setColumnVisibility] = useState(createFalseValuedObject(tableprop.hideColumn));
  const [sorting, setSorting] = useState(tableprop.columnSort);
  // const [count, setCount] = useState<number>(0);
  const [searchParam, setSearchParam] = useQueryParamsState("search", "");
  const [projectTypeParam, setProjectTypeParam] = useQueryParamsState<Array<string>>("project-type", []);
  const [statusParam, setStatusParam] = useQueryParamsState<Array<Status>>("status", []);

  useEffect(() => {
    const payload = {
      selectedProjectType: projectTypeParam,
      search: searchParam,
      selectedStatus: statusParam,
    };
    dispatch(setFilters(payload));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    },
  );
  const { data, error, isLoading, mutate } = useFrappeGetDocList(
    "Project",
    {
      fields: ["*"],
      // eslint-disable-next-line
      //   @ts-ignore
      filters: getFilter(projectState),
      limit_start: projectState.start,
      orderBy: {
        field: "modified",
        order: "desc",
      },
    },
    undefined,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  );
  const { data: count, mutate: countMutate } = useFrappeDocTypeCount(
    "Project",
    { filters: getFilter(projectState) },
    undefined,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  );

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.trim();
      dispatch(setSearch(value));
      setSearchParam(value);
    },
    [dispatch, setSearchParam],
  );
  const handleProjectTypeChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      dispatch(setSelectedProjectType(normalizedFilters));
      setProjectTypeParam(normalizedFilters);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch],
  );

  const handleStatusChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      dispatch(setSelectedStatus(normalizedFilters as Status[]));
      setStatusParam(normalizedFilters as Status[]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch],
  );

  useEffect(() => {
    if (projectState.isFetchAgain) {
      mutate();
      countMutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectState.isFetchAgain]);

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
    const updatedWidth = { ...tableAttributeProps.columnWidth, ...colSizing };
    const updatedTableProp = {
      ...tableprop,
      columnSort: sorting,
      columnWidth: updatedWidth,
      columnOrder: columnOrder,
    };
    setTableAttributeProps(updatedTableProp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting, colSizing, columnOrder]);

  useEffect(() => {
    localStorage.setItem("project", JSON.stringify(tableAttributeProps));
  }, [tableAttributeProps]);

  const columns = getColumn();
  const table = useReactTable({
    columns: columns,
    data: projectState.data,
    enableColumnResizing: true,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    columnResizeMode: "onChange",
    getSortedRowModel: getSortedRowModel(),
    onColumnSizingChange: setColSizing,
    onColumnOrderChange: setColumnOrder,
    state: {
      sorting,
      columnVisibility,
      columnOrder,
      columnSizing: colSizing,
    },
  });

  const resetTable = () => {
    setTableAttributeProps(projectTableMap);
    setSorting([]);
    setColumnVisibility({});
    table.setColumnSizing(projectTableMap.columnWidth);
  };

  const handleColumnHide = (id: string) => {
    const prev = tableAttributeProps;
    if (prev.hideColumn.includes(id)) {
      const mutatedHideColumn = [...prev.hideColumn];
      const index = mutatedHideColumn.indexOf(id);
      if (index > -1) {
        mutatedHideColumn.splice(index, 1);
      }
      const attr = { ...prev, hideColumn: mutatedHideColumn };
      setTableAttributeProps(attr);
    } else {
      const mutatedHideColumnSet = new Set([...prev.hideColumn, id]);
      const attr = { ...prev, hideColumn: [...mutatedHideColumnSet] };
      setTableAttributeProps(attr);
    }
  };

  return (
    <>
      <Header>
        <section id="filter-section" className="flex gap-x-2 overflow-x-auto items-center">
          <div className="xl:w-2/5">
            <DeBounceInput
              placeholder="Project Name"
              value={searchParam}
              deBounceValue={200}
              className="max-w-full min-w-40"
              callback={handleSearch}
            />
          </div>
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
          <Export
            headers={table.getHeaderGroups()[0].headers.map((header) => ({
              value: header.column.id,
              label: header.column.id.replace("custom_", "").replace(/_/g, " "),
            }))}
            rows={projectState.data}
          />
          <PageAction table={table} resetTable={resetTable} onColumnHide={handleColumnHide} />
        </section>
      </Header>
      {isLoading && projectState.data.length == 0 ? (
        <Spinner isFull />
      ) : (
        <DndProvider backend={HTML5Backend}>
          <Table className=" [&_td]:px-4 [&_th]:px-4 [&_th]:py-4 table-fixed" style={{ width: table.getTotalSize() }}>
            <TableHeader className=" border-t-0 sticky top-0 z-10 ">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return <DraggableColumnHeader key={header.id} header={header} reorder={setColumnOrder} />;
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
        </DndProvider>
      )}
      <Footer>
        <div className="flex  justify-between items-center ">
          <LoadMore
            variant="outline"
            disabled={projectState.data.length == (count ?? 0) || isLoading}
            onClick={() => {
              dispatch(setStart(projectState.start + 20));
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

const PageAction = ({
  table,
  resetTable,
  onColumnHide,
}: {
  table: T<ProjectData>;
  resetTable: () => void;
  onColumnHide: (id: string) => void;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <EllipsisVertical />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="[&_div]:cursor-pointer">
        <DropdownMenuItem className="flex items-center gap-x-2" onClick={resetTable}>
          <RotateCcw />
          <Typography variant="p">Reset Table</Typography>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-x-2">
            <Columns2 />
            <Typography variant="p">Columns</Typography>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="max-h-96 overflow-y-auto">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize cursor-pointer"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => {
                        column.toggleVisibility(!!value);
                        onColumnHide(column.id);
                      }}
                    >
                      {column.id.replace(/_/g, " ")}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default Project;
