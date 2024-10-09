import { DeBounceInput } from "@/app/components/deBounceInput";
import { useQueryParamsState } from "@/lib/queryParam";
import { RootState } from "@/store";
import { useFrappeGetDocList, useFrappeGetDocCount } from "frappe-react-sdk";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Header, Footer, Main } from "@/app/layout/root";
import { LoadMore } from "@/app/components/loadMore";
import {
  ProjectState,
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
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  Row,
  useReactTable,
  Table as T,
} from "@tanstack/react-table";
import {
  CircleDollarSign,
  Filter,
  GripVertical,
  ArrowUpDown,
  EllipsisVertical,
  Columns2,
  RotateCcw,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Progress } from "@/app/components/ui/progress";
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
const projectTableMap = {
  hideColumn: [],
  columnWidth: {
    project_name: 180,
    status: 100,
    project_type: 100,
    percent_complete: 150,
    custom_budget_in_hours: 80,
    actual_time: 80,
    custom_budget_remaining_in_hours: 80,
  },
  columnSort: [],
};
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
  const { data: projectType } = useFrappeGetDocList(
    "Project Type",
    {
      limit: 100,
    },
    undefined,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  );
  const { data, error, isLoading, mutate } = useFrappeGetDocList("Project", {
    fields: [
      "name",
      "project_name",
      "status",
      "project_type",
      "percent_complete",
      "custom_budget_in_hours",
      "actual_time",
      "custom_budget_remaining_in_hours",
      "custom_is_billable",
    ],
    // eslint-disable-next-line
    //   @ts-ignore
    filters: getFilter(projectState),
    limit_start: projectState.start,
    orderBy: {
      field: "creation",
      order: "asc",
    },
  });

  const {
    data: count,
    isLoading: countIsLoading,
    // eslint-disable-next-line
    //   @ts-ignore
  } = useFrappeGetDocCount("Project", getFilter(projectState));

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
  }, [data, projectState.isFetchAgain, error]);

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

  const columns = getColumns(tableAttributeProps);
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
    // update All Sort,filter and columnWidth States when localStorage Changes (table config reset)
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
        <section id="filter-section" className="flex gap-x-2 overflow-x-auto">
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
            leftIcon={
              <Filter className={cn("h-4 w-4", projectState.selectedProjectType.length != 0 && "fill-primary")} />
            }
            rightIcon={
              projectState.selectedProjectType.length > 0 && (
                <Badge className="px-1.5">{projectState.selectedProjectType.length}</Badge>
              )
            }
            data={projectType?.map((d: { name: string }) => ({
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
            leftIcon={<Filter className={cn("h-4 w-4", projectState.selectedStatus.length != 0 && "fill-primary")} />}
            rightIcon={
              projectState.selectedStatus.length > 0 && (
                <Badge className="px-1.5">{projectState.selectedStatus.length}</Badge>
              )
            }
            data={projectState.statusList.map((d: string) => ({
              label: d,
              value: d,
            }))}
            className="text-primary border-dashed gap-x-1 font-normal w-fit"
          />
          <PageAction table={table} resetTable={resetTable} onColumnHide={handleColumnHide} />
        </section>
      </Header>
      {(isLoading || countIsLoading) && projectState.data.length == 0 ? (
        <Spinner isFull />
      ) : (
        <Table className="[&_td]:px-4 [&_th]:px-4 [&_th]:py-4 table-fixed w-full relative">
          <TableHeader className="[&_th]:h-10 border-t-0 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      className={cn("resizer", header.column.getIsResizing() && "isResizing")}
                      key={header.id}
                      style={{
                        width: header.getSize(),
                        position: "relative",
                      }}
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
                    <TableCell className="overflow-hidden" key={cell.id}>
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
      )}
      <Footer>
        <div className="flex  justify-between items-center ">
          <LoadMore
            variant="outline"
            disabled={projectState.data.length == (count ?? 0) || isLoading || countIsLoading}
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

const getFilter = (projectState: ProjectState) => {
  const filters = [];

  if (projectState.search) {
    filters.push(["project_name", "like", `%${projectState.search}%`]);
  }
  if (projectState.selectedProjectType.length > 0) {
    filters.push(["project_type", "in", projectState.selectedProjectType]);
  }
  if (projectState.selectedStatus.length > 0) {
    filters.push(["status", "in", projectState.selectedStatus]);
  }

  return filters;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getColumns = (tableAttributeProps: any) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sortPercentageComplete = (rowA: Row<ProjectData>, rowB: Row<ProjectData>, columnId: string) => {
    const firstRowPer = calculatePercentage(
      Number(rowA.getValue("actual_time")),
      Number(rowA.getValue("custom_budget_in_hours")),
    );
    const secondRowPer = calculatePercentage(
      Number(rowB.getValue("actual_time")),
      Number(rowB.getValue("custom_budget_in_hours")),
    );
    if (firstRowPer > secondRowPer) {
      return 1;
    } else if (firstRowPer < secondRowPer) {
      return -1;
    } else {
      return 0;
    }
  };
  type ColumnsType = ColumnDef<ProjectData>[];
  const columnWidth = tableAttributeProps?.columnWidth;

  const columns: ColumnsType = [
    {
      accessorKey: "project_name",
      size: Number(columnWidth["project_name"] ?? "350"),
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer w-full overflow-hidden"
            title={column.id}
            onClick={() => {
              column.toggleSorting();
            }}
          >
            <p className="truncate">Project Name</p>
            <ArrowUpDown
              className={cn(
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer flex-shrink-0",
                column.getIsSorted() === "desc" && "text-orange-500",
              )}
            />
          </div>
        );
      },
      cell: ({ getValue, row }) => {
        const value = getValue() as string;
        return (
          <a href={`/app/project/${row.original.name}`} className="hover:underline">
            <Typography variant="p" className="truncate" title={value}>
              {value}
            </Typography>
          </a>
        );
      },
    },
    {
      accessorKey: "status",
      size: Number(columnWidth["status"] ?? "150"),
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer w-full overflow-hidden "
            title={column.id}
            onClick={() => {
              column.toggleSorting();
            }}
          >
            <p className="truncate">Status</p>
            <ArrowUpDown
              className={cn(
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer flex-shrink-0",
                column.getIsSorted() === "desc" && "text-orange-500",
              )}
            />
          </div>
        );
      },
      cell: ({ getValue }) => {
        const value = getValue() as Status;
        return (
          <Badge variant={value === "Open" ? "secondary" : value === "Completed" ? "success" : "destructive"}>
            {value}
          </Badge>
        );
      },
    },
    {
      accessorKey: "project_type",
      size: Number(columnWidth["project_type"] ?? "150"),
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer w-full overflow-hidden "
            title={column.id}
            onClick={() => {
              column.toggleSorting();
            }}
          >
            <p className="truncate">Project Type</p>
            <ArrowUpDown
              className={cn(
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer flex-shrink-0",
                column.getIsSorted() === "desc" && "text-orange-500",
              )}
            />
          </div>
        );
      },
    },
    {
      accessorKey: "percent_complete",
      size: Number(columnWidth["percent_complete"] ?? "150"),
      sortingFn: sortPercentageComplete,
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer w-full overflow-hidden "
            title={column.id}
            onClick={() => {
              column.toggleSorting();
            }}
          >
            <p className="truncate">% Completed</p>
            <ArrowUpDown
              className={cn(
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer flex-shrink-0",
                column.getIsSorted() === "desc" && "text-orange-500",
              )}
            />
          </div>
        );
      },
      cell: ({ row }) => {
        const budget = Number(row.getValue("custom_budget_in_hours"));
        const spent = Number(row.getValue("actual_time"));
        const per = calculatePercentage(spent, budget);
        return budget ? (
          <div>
            <Typography
              variant="small"
              className={cn("text-primary float-right", spent > budget && "text-destructive")}
            >
              {per}%
            </Typography>
            <Progress
              value={per}
              className={cn("h-2 bg-success/20", spent > budget && "bg-destructive/20", budget == 0 && "bg-secondary")}
              indicatorClassName={cn("bg-success", spent > budget && "bg-destructive")}
            />
          </div>
        ) : null;
      },
    },
    {
      accessorKey: "custom_budget_in_hours",
      size: Number(columnWidth["custom_budget_in_hours"] ?? "150"),
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer w-full overflow-hidden "
            title={column.id}
            onClick={() => {
              column.toggleSorting();
            }}
          >
            <p className="truncate">Budget (Hours)</p>
            <ArrowUpDown
              className={cn(
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer flex-shrink-0",
                column.getIsSorted() === "desc" && "text-orange-500",
              )}
            />
          </div>
        );
      },
      cell: ({ getValue }) => {
        const value = Number(getValue());
        return value ? (
          <Typography variant="p" className="text-center">
            {value}h
          </Typography>
        ) : null;
      },
    },
    {
      accessorKey: "actual_time",
      size: Number(columnWidth["actual_time"] ?? "150"),
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer w-full overflow-hidden "
            title={column.id}
            onClick={() => {
              column.toggleSorting();
            }}
          >
            <p className="truncate">Budget Spent (Hours)</p>
            <ArrowUpDown
              className={cn(
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer flex-shrink-0",
                column.getIsSorted() === "desc" && "text-orange-500",
              )}
            />
          </div>
        );
      },
      cell: ({ getValue, row }) => {
        const value = Number(getValue());
        const budget = Number(row.getValue("custom_budget_in_hours"));
        return (
          <Typography variant="p" className={cn("text-center", value > budget && "text-warning")}>
            {value}h
          </Typography>
        );
      },
    },
    {
      accessorKey: "custom_budget_remaining_in_hours",
      size: Number(columnWidth["custom_budget_remaining_in_hours"] ?? "150"),
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer  w-full overflow-hidden"
            title={column.id}
            onClick={() => {
              column.toggleSorting();
            }}
          >
            <p className="truncate">Budget Remaining (Hours)</p>
            <ArrowUpDown
              className={cn(
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer flex-shrink-0",
                column.getIsSorted() === "desc" && "text-orange-500",
              )}
            />
          </div>
        );
      },
      cell: ({ getValue, row }) => {
        const value = Number(getValue());
        const budget = Number(row.getValue("custom_budget_in_hours"));
        return budget ? (
          <Typography
            variant="p"
            className={cn("text-center", value < 1 && "text-destructive", value >= budget && "text-success")}
          >
            {value}h
          </Typography>
        ) : null;
      },
    },
    {
      accessorKey: "custom_is_billable",
      size: 50,
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer  w-full overflow-hidden"
            title={column.id}
          >
            <p className="truncate">Billable</p>
          </div>
        );
      },
      cell: ({ getValue }) => {
        const value = getValue() as boolean;

        return (
          <span className="flex justify-center">
            <CircleDollarSign className={cn("w-4 h-4 stroke-gray-400", value && "stroke-success")} />
          </span>
        );
      },
    },
  ];
  return columns;
};

const getTableProps = () => {
  try {
    const data = JSON.parse(String(localStorage.getItem("project")));
    if (!data) {
      return projectTableMap;
    } else {
      return data;
    }
  } catch (error) {
    return projectTableMap;
  }
};

const calculatePercentage = (spent: number, budget: number) => {
  return budget == 0 ? 0 : Math.round((spent / budget) * 100);
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
        <EllipsisVertical className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="[&_div]:cursor-pointer">
        <DropdownMenuItem className="flex items-center gap-x-2" onClick={resetTable}>
          <RotateCcw className="w-4 h-4" />
          <Typography variant="p">Reset Table</Typography>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-x-2">
            <Columns2 className="w-4 h-4" />
            <Typography variant="p">Columns</Typography>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
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
