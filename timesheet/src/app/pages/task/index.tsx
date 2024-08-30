import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Spinner } from "@/app/components/spinner";
import { TaskData, ProjectProps, ProjectNestedTaskData } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  setStart,
  setTaskData,
  setSelectedProject,
  setFetchAgain,
  setGroupBy,
  updateProjectData,
  setProjectData,
} from "@/store/task";
import { cn, parseFrappeErrorMsg, floatToTime, getFormatedDate, deBounce } from "@/lib/utils";
import { useToast } from "@/app/components/ui/use-toast";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Typography } from "@/app/components/typography";
import { ComboxBox } from "@/app/components/comboBox";
import { useQueryParamsState } from "@/lib/queryParam";
import { ArrowUpDown, ChevronDown, ChevronUp, Filter, GripVertical, Heart } from "lucide-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  VisibilityState,
  getExpandedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { updateData } from "@/store/team";
import { SetAddTimeDialog, SetTimesheet } from "@/store/timesheet";
import { AddTime } from "@/app/pages/timesheet/addTime";
import React from "react";
import { Input } from "@/app/components/ui/input";

const Task = () => {
  const task = useSelector((state: RootState) => state.task);
  const user = useSelector((state: RootState) => state.user);
  const timesheet = useSelector((state: RootState) => state.timesheet);
  const { call } = useFrappePostCall("frappe.desk.like.toggle_like");
  // States for maintaining tables and filters
  const [expanded, setExpanded] = useState<boolean>(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [projectParam, setProjectParam] = useQueryParamsState<string[]>("project", []);
  const [groupByParam, setGroupByParam] = useQueryParamsState<string[]>("groupby", []);
  const [subjectSearch, setSubjectSearch] = useState<string>("");
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  //task search change (input)
  const updateSubjectSearch = useCallback(deBounce((searchStr) => {
    setSubjectSearch(searchStr);
    if (groupByParam.length === 0) mutate();
    else {
      nestedProjectMutate();
    }
  }, 700),[]);

  const handleSubjectSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateSubjectSearch(e.target.value.trim());
  },[]);


  // GroupBy Data for ComboBox
  const groupByData = [
    {
      label: "Projects",
      value: "project",
    },
  ];
  //

  const dispatch = useDispatch();
  const { toast } = useToast();

  useEffect(() => {
    dispatch(setSelectedProject(projectParam));
  }, []);
  useEffect(() => {
    dispatch(setGroupBy(groupByParam));
  }, []);

  const handleAddTime = (taskName: string) => {
    const timesheetData = {
      name: "",
      parent: "",
      task: taskName,
      date: getFormatedDate(new Date()),
      description: "",
      hours: 0,
      isUpdate: false,
      employee: user.employee,
    };
    dispatch(SetTimesheet(timesheetData));
    dispatch(SetAddTimeDialog(true));
  };
  const { data: projects } = useFrappeGetCall(
    "frappe.client.get_list",
    {
      doctype: "Project",
      fields: ["name", "project_name"],
    },
    "projects",
    {
      shouldRetryOnError: false,
    }
  );
  const { data, isLoading, error, mutate } = useFrappeGetCall("timesheet_enhancer.api.utils.get_task_for_employee", {
    page_length: 20,
    start: task.start,
    project: task.selectedProject,
    search: subjectSearch,
  });
  //nested project task call
  const {
    data: nestedProjectData,
    isLoading: nestedProjectIsLoading,
    error: nestedProjectError,
    mutate: nestedProjectMutate,
  } = useFrappeGetCall("timesheet_enhancer.api.utils.get_project_task", {
    project: task.selectedProject.length == 0 ? null : task.selectedProject,
    task_search: subjectSearch,
  });

  const loadMore = () => {
    dispatch(setStart(task.start + 20));
  };

  useEffect(() => {
    if (task.isFetchAgain) {
      mutate();
      dispatch(setFetchAgain(false));
    }
    if (data) {
      if (task.start !== 0) {
        dispatch(updateData(data.message));
      }
      dispatch(setTaskData(data.message));
    }
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast({
        variant: "destructive",
        description: err,
      });
    }
  }, [data, dispatch, error, mutate, task.isFetchAgain, task.start, toast]);

  //nested projectdata side-effects
  useEffect(() => {
    if (task.isFetchAgain) {
      mutate();
      dispatch(setFetchAgain(false));
    }
    if (nestedProjectData) {
      if (task.start !== 0) {
        dispatch(updateProjectData(nestedProjectData.message));
      }
      dispatch(setProjectData(nestedProjectData.message));
    }
    if (nestedProjectError) {
      const err = parseFrappeErrorMsg(nestedProjectError);
      toast({
        variant: "destructive",
        description: err,
      });
    }
  }, [nestedProjectData, dispatch, nestedProjectError, nestedProjectMutate, task.isFetchAgain, task.start, toast]);

  useEffect(() => {
    setProjectParam(task.selectedProject);
  }, [setProjectParam, task.selectedProject]);

  useEffect(() => {
    setGroupByParam(task.groupBy);
    nestedProjectMutate();
  }, [setGroupByParam, task.groupBy]);

  const handleLike = (e: React.MouseEvent<SVGSVGElement>) => {
    const taskName = e.currentTarget.dataset.task;
    let likedBy = e.currentTarget.dataset.likedBy;
    let add = "Yes";
    if (likedBy) {
      likedBy = JSON.parse(likedBy);
      if (likedBy && likedBy.includes(user.user)) {
        add = "No";
      }
    }
    const data = {
      name: taskName,
      add: add,
      doctype: "Task",
    };
    call(data)
      .then(() => {
        if (groupByParam.length > 0) {
          nestedProjectMutate();
        } else {
          mutate();
        }
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
      });
  };
  const handleProjectChange = useCallback(
    (value: string | string[]) => {
      dispatch(setSelectedProject(value as string[]));
    },
    [dispatch]
  );
  const handleGroupByChange = useCallback(
    (value: string | string[]) => {
      dispatch(setGroupBy(value as string[]));
    },
    [dispatch]
  );
  // coumn definitions
  const columns: ColumnDef<TaskData>[] = [
    {
      accessorKey: "project_name",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer w-full "
            title={column.id}
            onClick={() => {
              if (!column.getIsSorted()) {
                return column.toggleSorting(true);
              }
              column.toggleSorting(column.getIsSorted() === "asc");
            }}
          >
            <p className="truncate">Project Name</p>
            <ArrowUpDown className="h-4 w-4 group-hover:text-orange-500 transition-colors ease duration-200 hover:cursor-pointer" />
          </div>
        );
      },
      cell: ({ row }) => {
        return (
          <Typography title={row.original.project_name} variant="p" className="max-w-sm truncate cursor-pointer">
            {row.original.project_name}
          </Typography>
        );
      },
    },
    {
      accessorKey: "subject",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer w-full"
            title={column.id}
            onClick={() => {
              if (!column.getIsSorted()) {
                return column.toggleSorting(true);
              }
              column.toggleSorting(column.getIsSorted() === "asc");
            }}
          >
            <p className="truncate">Subject</p>
            <ArrowUpDown className="h-4 w-4 group-hover:text-orange-500 transition-colors ease duration-200 hover:cursor-pointer" />
          </div>
        );
      },
      cell: ({ row }) => {
        return (
          <Typography
            variant="p"
            title={row.original.subject}
            className="max-w-sm truncate cursor-pointer"
            onClick={() => {
              handleAddTime(row.original.name);
            }}
          >
            {row.original.subject}
          </Typography>
        );
      },
    },
    {
      accessorKey: "due_date",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <p className="truncate">Due Date</p>
            <ArrowUpDown className="h-4 w-4 group-hover:text-orange-500 transition-colors ease duration-200 hover:cursor-pointer" />
          </div>
        );
      },
      cell: ({ row, getValue }) => {
        return (
          <Typography variant="p" className="truncate w-4/5">
            {getValue()}
          </Typography>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <p className="truncate">Status</p>
            <ArrowUpDown className="h-4 w-4 group-hover:text-orange-500 transition-colors ease duration-200 hover:cursor-pointer" />
          </div>
        );
      },
      cell: ({ row }) => {
        return <TaskStatus status={row.original.status} />;
      },
    },
    {
      accessorKey: "priority",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <p className="truncate">Priority</p>
            <ArrowUpDown className="h-4 w-4 group-hover:text-orange-500 transition-colors ease duration-200 hover:cursor-pointer" />
          </div>
        );
      },
      cell: ({ row }) => {
        return <TaskPriority priority={row.original.priority} />;
      },
    },
    {
      accessorKey: "expected_time",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <p className="truncate">Expected Hours</p>
            <ArrowUpDown className="h-4 w-4 group-hover:text-orange-500 transition-colors ease duration-200 hover:cursor-pointer" />
          </div>
        );
      },
      cell: ({ row }) => {
        return (
          <Typography variant="p" className="text-center truncate">
            {floatToTime(row.original.expected_time)}
          </Typography>
        );
      },
    },
    {
      accessorKey: "actual_time",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <p className="truncate">Hour Spent</p>
            <ArrowUpDown className="h-4 w-4 group-hover:text-orange-500 transition-colors ease duration-200 hover:cursor-pointer" />
          </div>
        );
      },
      cell: ({ row }) => {
        return (
          <Typography variant="p" className="text-center truncate">
            {floatToTime(row.original.actual_time)}
          </Typography>
        );
      },
    },
    {
      accessorKey: "#",
      header: "",
      size: 30, // Default size
      minSize: 20, // Minimum size
      maxSize: 30, // Maximum size
      cell: ({ row }) => {
        return (
          <span title="Like">
            <Heart
              className={cn(
                "w-4 h-4 hover:cursor-pointer",
                isLiked(row.original._liked_by, user.user) && "fill-red-600"
              )}
              data-task={row.original.name}
              data-liked-by={row.original._liked_by}
              onClick={handleLike}
            />
          </span>
        );
      },
    },
  ];
  const nestedProjectColumns: ColumnDef<ProjectNestedTaskData>[] = [
    {
      accessorKey: "project_name",
      enableHiding: false,
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer w-full "
            title={column.id}
            onClick={() => {
              if (!column.getIsSorted()) {
                return column.toggleSorting(true);
              }
              column.toggleSorting(column.getIsSorted() === "asc");
            }}
          >
            <p className="truncate">Project Name</p>
            <ArrowUpDown className="h-4 w-4 group-hover:text-orange-500 transition-colors ease duration-200 hover:cursor-pointer" />
          </div>
        );
      },
      cell: ({ row, getValue }) => {
        return (
          <>
            <div
              title={`${row.getIsExpanded() ? "Collapse" : "Expand"}`}
              onClick={() => {
                row.toggleExpanded();
              }}
              className="flex gap-1 cursor-pointer items-center "
            >
              {getValue() ? (
                row.getIsExpanded() ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )
              ) : null}
              <div className="truncate w-4/5">{getValue()}</div>
            </div>
          </>
        );
      },
    },
    {
      accessorKey: "subject",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer w-full"
            title={column.id}
            onClick={() => {
              if (!column.getIsSorted()) {
                return column.toggleSorting(true);
              }
              column.toggleSorting(column.getIsSorted() === "asc");
            }}
          >
            <p className="truncate">Subject</p>
            <ArrowUpDown className="h-4 w-4 group-hover:text-orange-500 transition-colors ease duration-200 hover:cursor-pointer" />
          </div>
        );
      },
      cell: ({ row, getValue }) => {
        return (
          <Typography
            variant="p"
            title={getValue()}
            className="truncate cursor-pointer"
            onClick={() => {
              handleAddTime(getValue());
            }}
          >
            {getValue()}
          </Typography>
        );
      },
    },
    {
      accessorKey: "due_date",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <div className="truncate w-4/5">Due Date</div>
            <ArrowUpDown className="h-4 w-4 group-hover:text-orange-500 transition-colors ease duration-200 hover:cursor-pointer" />
          </div>
        );
      },
      cell: ({ row, getValue }) => {
        return (
          <Typography variant="p" className="truncate w-4/5">
            {getValue()}
          </Typography>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <div className="truncate w-4/5">Status</div>
            <ArrowUpDown className="h-4 w-4 group-hover:text-orange-500 transition-colors ease duration-200 hover:cursor-pointer" />
          </div>
        );
      },
      cell: ({ row, getValue }) => {
        return getValue() && <TaskStatus status={getValue()} />;
      },
    },
    {
      id: "priority",
      accessorKey: "priority",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <div className="truncate w-4/5">Priority</div>
            <ArrowUpDown className="h-4 w-4 group-hover:text-orange-500 transition-colors ease duration-200 hover:cursor-pointer" />
          </div>
        );
      },
      cell: ({ row, getValue }) => {
        return getValue() && <TaskPriority priority={getValue()} />;
      },
    },
    {
      id: "expected_time",
      accessorKey: "expected_time",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <div className="truncate w-4/5">Expected Hours</div>
            <ArrowUpDown className="h-4 w-4 group-hover:text-orange-500 transition-colors ease duration-200 hover:cursor-pointer" />
          </div>
        );
      },
      cell: ({ row, getValue }) => {
        const hour = getValue();
        return (
          <Typography variant="p" className="text-center truncate">
            {hour !== undefined && floatToTime(getValue())}
          </Typography>
        );
      },
    },
    {
      id: "actual_time",
      accessorKey: "actual_time",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <div className="truncate w-4/5">Hour Spent</div>

            <ArrowUpDown className="h-4 w-4 group-hover:text-orange-500 transition-colors ease duration-200 hover:cursor-pointer" />
          </div>
        );
      },
      cell: ({ row, getValue }) => {
        const hour = getValue();
        return (
          <Typography variant="p" className="text-center truncate">
            {hour !== undefined && floatToTime(getValue())}
          </Typography>
        );
      },
    },
    {
      accessorKey: "#",
      header: "",
      size: 30, // Default size
      minSize: 20, // Minimum size
      maxSize: 30, // Maximum size
      cell: ({ row }) => {
        return (
          row.depth !== 0 && (
            <Heart
              className={cn(
                "w-4 h-4 hover:cursor-pointer",
                isLiked(row.original._liked_by, user.user) && "fill-red-600"
              )}
              data-task={row.original.name}
              data-liked-by={row.original._liked_by}
              onClick={handleLike}
            />
          )
        );
      },
    },
  ];
  // Flat Table instance
  const table = useReactTable({
    data: task.task,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    columnResizeMode: "onChange",
    state: {
      sorting,
      columnVisibility,
      columnFilters,
    },
  });
  // Nested Table instance
  const nestedProjectTable = useReactTable({
    data: task.project,
    columns: nestedProjectColumns,
    getSubRows: (row) => row.tasks,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onExpandedChange: setExpanded,
    onSortingChange: setSorting,
    columnResizeMode: "onChange",
    state: {
      sorting,
      expanded,
      columnVisibility: { ...columnVisibility, project_name: true },
    },
  });

  return (
    <>
      {/* Styles for table column-resizing */}
      <style>
        {`
            th,
            td {
              padding: 8px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }

            .resizer {
              position: absolute;
              right: 0;
              top: 0;
              bottom: 0;
              width: 5px;
              background-color: transparent;
            }

            .isResizing {
              background-color: #dedfe091;
            }
      `}
      </style>
      <div className="md:w-full h-full justify-between flex flex-col relative">
        {/* filters and combo boxes */}
        <div id="filters" className="flex gap-x-2 mb-3 w-full overflow-hidden p-1 max-md:overflow-scroll">
          <div className="flex gap-2 xl:w-2/5">
            {/* Task Search Filter */}
            <Input
              placeholder="Search Subject..."
              className="placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-800 w-full min-w-40"
              onChange={handleSubjectSearchChange}
            />
          </div>

          {/* Projects comboBox */}
          <ComboxBox
            label="Projects"
            value={task.selectedProject}
            isMulti
            showSelected={false}
            leftIcon={<Filter className={cn("h-4 w-4", task.selectedProject.length != 0 && "fill-primary")} />}
            rightIcon={
              task.selectedProject.length > 0 && <Badge className="px-1.5">{task.selectedProject.length}</Badge>
            }
            data={projects?.message.map((item: ProjectProps) => ({
              label: item.project_name,
              value: item.name,
            }))}
            className="text-primary border-dashed gap-x-2 font-normal w-fit"
            onSelect={handleProjectChange}
          />
          {/* GroupBy comboBox */}
          <ComboxBox
            label="GroupBy"
            value={task.groupBy}
            showSelected={false}
            leftIcon={<Filter className={cn("h-4 w-4", task.groupBy.length != 0 && "fill-primary")} />}
            rightIcon={task.groupBy.length > 0 && <Badge className="px-1.5">{task.groupBy.length}</Badge>}
            data={groupByData?.map((item) => ({
              label: item.label,
              value: item.value,
            }))}
            className="text-primary border-dashed gap-x-2 font-normal w-fit"
            onSelect={handleGroupByChange}
          />
          {/* Hide Column select */}
          <HideColumn table={table} groupBy={groupByParam} />
        </div>
        {/* tables */}
        {isLoading || nestedProjectIsLoading ? (
          <Spinner isFull />
        ) : (
          <div className="overflow-hidden w-full overflow-y-scroll" style={{ height: "calc(100vh - 8rem)" }}>
            {groupByParam.length === 0 ? (
              <Table className="[&_td]:px-2  [&_th]:px-2 table-fixed">
                <TableHeader className="[&_th]:h-10">
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
                          >
                            <div className="w-full h-full flex items-center justify-between group">
                              <div className="w-full">
                                {flexRender(header.column.columnDef.header, header.getContext())}
                              </div>
                              {header.id !== "#" && (
                                <div
                                  {...{
                                    onMouseDown: header.getResizeHandler(),
                                    onTouchStart: header.getResizeHandler(),
                                    className: `cursor-col-resize flex justify-center items-center h-full`,
                                  }}
                                >
                                  <GripVertical className="w-4 h-4 max-lg:hidden" />
                                </div>
                              )}
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
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            ) : (
              <Table className="[&_td]:px-2  [&_th]:px-2 table-fixed">
                <TableHeader>
                  {nestedProjectTable.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          className={`resizer overflow-hidden ${header.column.getIsResizing() ? "isResizing" : null}`}
                          key={header.id}
                          style={{
                            width: header.getSize(),
                            position: "relative",
                          }}
                        >
                          <div className="w-full h-full flex items-center justify-between group">
                            <div className="w-full">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </div>
                            {header.id !== "#" && (
                              <div
                                {...{
                                  onMouseDown: header.getResizeHandler(),
                                  onTouchStart: header.getResizeHandler(),
                                  className: `cursor-col-resize flex justify-center items-center h-full`,
                                }}
                              >
                                <GripVertical className="w-4 h-4 max-lg:hidden" />
                              </div>
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="relative">
                  {nestedProjectTable.getRowModel().rows?.length ? (
                    nestedProjectTable.getRowModel().rows.map((row) => {
                      return (
                        <React.Fragment key={row.id}>
                          <TableRow
                            style={{
                              width: `${table.getState().columnSizingInfo.deltaOffset}px)`,
                            }}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell className="overflow-hidden" key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        )}
        {/* footer */}
        <div className="w-full flex justify-between items-center mt-5">
          <Button
            className="float-left"
            variant="outline"
            onClick={loadMore}
            disabled={
              task.groupBy.length === 0
                ? task.task.length == task.total_count
                : task.project.length == task.total_project_count
            }
          >
            Load More
          </Button>
          <Typography variant="p" className="px-5 font-semibold">
            {`${task.groupBy.length === 0 ? task.task.length | 0 : task.project.length | 0} of ${
              task.groupBy.length === 0 ? task.total_count | 0 : task.total_project_count | 0
            }`}
          </Typography>
        </div>
        {/* addTime */}
        {timesheet.isDialogOpen && <AddTime />}
      </div>
    </>
  );
};

const isLiked = (likedBy: string, user: string) => {
  if (likedBy) {
    likedBy = JSON.parse(likedBy);
    if (likedBy && likedBy.includes(user)) {
      return true;
    }
  }
  return false;
};
const TaskPriority = ({ priority }: { priority: TaskData["priority"] }) => {
  const priorityCss = {
    Low: "bg-slate-200 text-slate-900 hover:bg-slate-200",
    Medium: "bg-warning/20 text-warning hover:bg-warning/20",
    High: "bg-orange-200 text-orange-900 hover:bg-orange-200",
    Urgent: "bg-destructive/20 text-destructive hover:bg-destructive/20",
  };
  return <Badge className={cn(priorityCss[priority])}>{priority}</Badge>;
};

const TaskStatus = ({ status }: { status: TaskData["status"] }) => {
  const statusCss = {
    Open: "bg-slate-200 text-slate-900 hover:bg-slate-200",
    Working: "bg-warning/20 text-warning hover:bg-warning/20",
    "Pending Review": "bg-warning/20 text-warning hover:bg-warning/20",
    Overdue: "bg-destructive/20 text-destructive hover:bg-destructive/20",
    Template: "bg-slate-200 text-slate-900 hover:bg-slate-200",
    Completed: "bg-success/20 text-success hover:bg-success/20",
    Cancelled: "bg-destructive/20 text-destructive hover:bg-destructive/20",
  };
  return <Badge className={cn(statusCss[status])}>{status}</Badge>;
};

const HideColumn = ({ table, groupBy }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-auto focus-visible:ring-0">
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {table
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => {
            if (column.id === "#") {
              return null;
            }
            if (groupBy.length > 0 && column.id === "project_name") {
              return null;
            }
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default Task;
