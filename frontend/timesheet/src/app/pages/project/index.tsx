import { DeBounceInput } from "@/app/components/deBounceInput";
import { useQueryParamsState } from "@/lib/queryParam";
import { RootState } from "@/store";
import { useFrappeGetDocList, useFrappeGetDocCount } from "frappe-react-sdk";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import { cn, parseFrappeErrorMsg } from "@/lib/utils";
import { useToast } from "@/app/components/ui/use-toast";
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { ArrowUpDown, Filter } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Progress } from "@/app/components/ui/progress";
import { Badge } from "@/app/components/ui/badge";
import { Typography } from "@/app/components/typography";
import { Spinner } from "@/app/components/spinner";
import { Button } from "@/app/components/ui/button";
const Project = () => {
  const projectState = useSelector((state: RootState) => state.project);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const tableprop = getTableProps();
  const [tableAttributeProps, setTableAttributeProps] = useState(tableprop);
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
      "custom_budget_spent_in_hours",
      "custom_budget_remaining_in_hours",
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
    const map = getTableProps();
    if (!localStorage.getItem("project")) {
      localStorage.setItem("project", JSON.stringify(map));
      setTableAttributeProps(map);
    }
  }, []);
  useEffect(() => {
    const updatedTableProp = {
      ...tableprop,
      columnSort: sorting,
    };
    localStorage.setItem("project", JSON.stringify(updatedTableProp));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting]);
  const columns = getColumns(tableAttributeProps);
  const table = useReactTable({
    columns: columns,
    data: projectState.data,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <>
      <section id="filter-section" className="flex gap-x-3 mb-3">
        <DeBounceInput placeholder="Project Name" value={searchParam} deBounceValue={200} callback={handleSearch} />
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
      </section>
      {(isLoading || countIsLoading) && projectState.data.length == 0 ? (
        <Spinner isFull />
      ) : (
        <div className="overflow-hidden w-full overflow-y-auto" style={{ height: "calc(100vh - 8rem)" }}>
          <Table className="[&_td]:px-2  [&_th]:px-2 table-fixed">
            <TableHeader className="[&_th]:h-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        style={{
                          width: header.getSize(),
                          position: "relative",
                        }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell className="overflow-hidden" key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="h-24 text-center">No results.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex  justify-between items-center mt-3">
        <Button
          variant="outline"
          disabled={projectState.data.length == (count ?? 0) || isLoading || countIsLoading}
          onClick={() => {
            dispatch(setStart(projectState.start + 20));
          }}
        >
          Load More
        </Button>
        <Typography variant="p" className="px-5 font-semibold">
          {`${projectState.data.length} of ${count ?? 0}`}
        </Typography>
      </div>
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
  type ColumnsType = ColumnDef<ProjectData>[];
  const columnWidth = tableAttributeProps?.columnWidth;

  const columns: ColumnsType = [
    {
      accessorKey: "project_name",
      size: Number(columnWidth["project_name"] ?? "350"),
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer w-full "
            title={column.id}
            onClick={() => {
              column.toggleSorting();
            }}
          >
            <p className="truncate">Project Name</p>
            <ArrowUpDown
              className={cn(
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer",
                column.getIsSorted() === "desc" && "text-orange-500",
              )}
            />
          </div>
        );
      },
      cell: ({ getValue }) => {
        const value = getValue() as string;
        return (
          <Typography variant="p" className="truncate" title={value}>
            {value}
          </Typography>
        );
      },
    },
    {
      accessorKey: "status",
      size: Number(columnWidth["status"] ?? "150"),
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer w-full "
            title={column.id}
            onClick={() => {
              column.toggleSorting();
            }}
          >
            <p className="truncate">Status</p>
            <ArrowUpDown
              className={cn(
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer",
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
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer w-full "
            title={column.id}
            onClick={() => {
              column.toggleSorting();
            }}
          >
            <p className="truncate">Project Type</p>
            <ArrowUpDown
              className={cn(
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer",
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
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer w-full "
            title={column.id}
            onClick={() => {
              column.toggleSorting();
            }}
          >
            <p className="truncate">% Completed</p>
            <ArrowUpDown
              className={cn(
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer",
                column.getIsSorted() === "desc" && "text-orange-500",
              )}
            />
          </div>
        );
      },
      cell: ({ row }) => {
        const budget = Number(row.getValue("custom_budget_in_hours"));
        const spent = Number(row.getValue("custom_budget_spent_in_hours"));
        const per = budget == 0 ? 0 : Math.round((spent / budget) * 100);
        return (
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
        );
      },
    },
    {
      accessorKey: "custom_budget_in_hours",
      size: Number(columnWidth["custom_budget_in_hours"] ?? "150"),
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer w-full "
            title={column.id}
            onClick={() => {
              column.toggleSorting();
            }}
          >
            <p className="truncate">Budget (Hours)</p>
            <ArrowUpDown
              className={cn(
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer",
                column.getIsSorted() === "desc" && "text-orange-500",
              )}
            />
          </div>
        );
      },
      cell: ({ getValue }) => {
        const value = Number(getValue());
        return (
          <Typography variant="p" className="text-center">
            {value}h
          </Typography>
        );
      },
    },
    {
      accessorKey: "custom_budget_spent_in_hours",
      size: Number(columnWidth["custom_budget_spent_in_hours"] ?? "150"),
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer w-full "
            title={column.id}
            onClick={() => {
              column.toggleSorting();
            }}
          >
            <p className="truncate">Budget Spent (Hours)</p>
            <ArrowUpDown
              className={cn(
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer",
                column.getIsSorted() === "desc" && "text-orange-500",
              )}
            />
          </div>
        );
      },
      cell: ({ getValue, row }) => {
        const value = Number(getValue());
        return (
          <Typography
            variant="p"
            className={cn("text-center", value > Number(row.getValue("custom_budget_in_hours")) && "text-warning")}
          >
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
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer w-full "
            title={column.id}
            onClick={() => {
              column.toggleSorting();
            }}
          >
            <p className="truncate">Budget Remaining (Hours)</p>
            <ArrowUpDown
              className={cn(
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer",
                column.getIsSorted() === "desc" && "text-orange-500",
              )}
            />
          </div>
        );
      },
      cell: ({ getValue, row }) => {
        const value = Number(getValue());
        return (
          <Typography
            variant="p"
            className={cn(
              "text-center",
              value < 1 && "text-destructive",
              value >= Number(row.getValue("custom_budget_in_hours")) && "text-success",
            )}
          >
            {value}h
          </Typography>
        );
      },
    },
  ];
  return columns;
};

const getTableProps = () => {
  const projectTableMap = {
    hideColumn: [],
    columnWidth: {
      project_name: "250",
      status: "120",
      project_type: "150",
      percent_complete: "150",
      custom_budget_in_hours: "150",
      custom_budget_spent_in_hours: "150",
      custom_budget_remaining_in_hours: "150",
    },
    columnSort: [],
  };
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
export default Project;
