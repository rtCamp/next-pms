import { DeBounceInput } from "@/app/components/deBounceInput";
import { useQueryParamsState } from "@/lib/queryParam";
import { RootState } from "@/store";
import { useFrappeGetDocList, useFrappePostCall, useFrappeGetCall } from "frappe-react-sdk";
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
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, Table as T } from "@tanstack/react-table";
import { Filter, GripVertical, EllipsisVertical, Columns2, RotateCcw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
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
import { getColumn } from "./column";

const Project = () => {
  const projectState = useSelector((state: RootState) => state.project);
  const dispatch = useDispatch();
  const { toast } = useToast();
  let resizeObserver: ResizeObserver;
  const tableprop = useMemo(() => {
    return getTableProps();
  }, []);

  const [tableAttributeProps, setTableAttributeProps] = useState(tableprop);
  const [columnVisibility, setColumnVisibility] = useState(createFalseValuedObject(tableprop.hideColumn));
  const [sorting, setSorting] = useState(tableprop.columnSort);
  const [count, setCount] = useState<number>(0);
  const [searchParam, setSearchParam] = useQueryParamsState("search", "");
  const [projectTypeParam, setProjectTypeParam] = useQueryParamsState<Array<string>>("project-type", []);
  const [statusParam, setStatusParam] = useQueryParamsState<Array<Status>>("status", []);
  const { call } = useFrappePostCall("frappe.desk.reportview.get_count");

  const getCount = () => {
    call({ doctype: "Project", ...getFilter(projectState) })
      .then((res) => {
        setCount(res.message);
      })
      .catch(() => {});
  };

  useEffect(() => {
    const payload = {
      selectedProjectType: projectTypeParam,
      search: searchParam,
      selectedStatus: statusParam,
    };
    dispatch(setFilters(payload));
    getCount();
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
    const updatedTableProp = {
      ...tableprop,
      columnSort: sorting,
    };
    setTableAttributeProps(updatedTableProp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting]);
  useEffect(() => {
    localStorage.setItem("project", JSON.stringify(tableAttributeProps));
  }, [tableAttributeProps]);

  const columns = getColumn();
  const table = useReactTable({
    columns: columns,
    data: projectState.data,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    columnResizeMode: "onChange",
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      columnVisibility,
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
          <PageAction table={table} resetTable={resetTable} onColumnHide={handleColumnHide} />
        </section>
      </Header>
      {isLoading && projectState.data.length == 0 ? (
        <Spinner isFull />
      ) : (
        <Table className=" [&_td]:px-4 [&_th]:px-4 [&_th]:py-4 relative">
          <TableHeader className=" border-t-0 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      className={cn("resizer relative", header.column.getIsResizing() && "isResizing")}
                      key={header.id}
                      onMouseDown={(event) => {
                        const container = event.currentTarget;
                        resizeObserver = new ResizeObserver((entries) => {
                          entries.forEach(() => {
                            setTableAttributeProps((prev: typeof tableAttributeProps) => {
                              return {
                                ...prev,
                                columnWidth: { ...prev.columnWidth, [header.id]: header.getSize() },
                              };
                            });
                          });
                        });
                        resizeObserver.observe(container);
                      }}
                      onMouseUp={() => {
                        if (resizeObserver) {
                          resizeObserver.disconnect();
                        }
                      }}
                    >
                      <div className="grid grid-cols-[80%_20%] place-items-center h-full gap-1 group">
                        {flexRender(header.column.columnDef.header, header.getContext())}

                        <GripVertical
                          className="w-4 h-4 max-lg:hidden cursor-col-resize flex justify-center items-center "
                          {...{ onMouseDown: header.getResizeHandler(), onTouchStart: header.getResizeHandler() }}
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
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
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
                      {column.id.replace("_", " ")}
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
