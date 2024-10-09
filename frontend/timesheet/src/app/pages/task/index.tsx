import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { TaskData, ProjectProps } from "@/types";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  setStart,
  setSelectedProject,
  setFetchAgain,
  setGroupBy,
  setAddTaskDialog,
  updateTaskData,
  setTaskData,
  updateProjectData,
  setProjectData,
} from "@/store/task";
import { AddTask } from "./addTask";
import { FlatTable } from "./flatTable";
import {
  cn,
  parseFrappeErrorMsg,
  isLiked,
  floatToTime,
  createFalseValuedObject,
  getFormatedDate,
  getDateTimeForMultipleTimeZoneSupport,
} from "@/lib/utils";
import { useToast } from "@/app/components/ui/use-toast";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Typography } from "@/app/components/typography";
import { ComboxBox } from "@/app/components/comboBox";
import { useQueryParamsState } from "@/lib/queryParam";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Clock,
  Columns2,
  Filter,
  Heart,
  LucideProps,
  MoreVertical,
  Plus,
  RotateCcw,
} from "lucide-react";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  VisibilityState,
  getExpandedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  ExpandedState,
} from "@tanstack/react-table";
import { TaskStatus } from "./taskStatus";
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
import { SetAddTimeDialog, SetTimesheet } from "@/store/timesheet";
import AddTime from "@/app/components/addTime";
import { RowGroupedTable } from "./groupTable";
import React from "react";
import { DeBounceInput } from "@/app/components/deBounceInput";
import {
  setLocalStorageTaskStateType,
  FlatTableType,
  ColumnsType,
  ProjectNestedColumnsType,
  subjectSearchType,
  GroupByParamType,
  columnsToExcludeActionsInTablesType,
  localStorageTaskType,
  MoreTableOptionsDropDownType,
} from "@/types/task";
import { TaskLog } from "./taskLog";
import { Footer, Header, Main } from "@/app/layout/root";

const Task = () => {
  const task = useSelector((state: RootState) => state.task);
  const user = useSelector((state: RootState) => state.user);
  const timesheet = useSelector((state: RootState) => state.timesheet);
  const { call } = useFrappePostCall("frappe.desk.like.toggle_like");
  // States for maintaining tables and filters
  const [expanded, setExpanded] = useState<ExpandedState>(true);
  // LocalStorage States
  const localStorageTaskDataMap = {
    hideColumn: [],
    groupBy: [],
    projects: [],
    columnWidth: {
      subject: "150",
      due_date: "150",
      project_name: "150",
      status: "150",
      priority: "150",
      expected_time: "150",
      actual_time: "150",
    },
    columnSort: [],
  };
  const [localStorageTaskState, setLocalStorageTaskState] = useState<localStorageTaskType>(() => {
    try {
      return JSON.parse(String(localStorage.getItem("task")));
    } catch (error) {
      return localStorageTaskDataMap;
    }
  });
  const [sorting, setSorting] = useState<SortingState>(() => {
    try {
      return JSON.parse(String(localStorage.getItem("task"))).columnSort;
    } catch (error) {
      return [];
    }
  });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    createFalseValuedObject(localStorageTaskState?.hideColumn ?? {}),
  );
  const [projectParam, setProjectParam] = useQueryParamsState<string[]>("project", []);
  const [groupByParam, setGroupByParam] = useQueryParamsState<GroupByParamType>("groupby", []);
  const [subjectSearchParam, setSubjectSearchParam] = useQueryParamsState<subjectSearchType>("search", "");
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const handleSubjectSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const searchStr = e.target.value.trim();
    setSubjectSearchParam(searchStr);
    dispatch(setStart(0));
    mutate();
  }, []);

  // GroupBy Data for ComboBox
  const groupByData = [
    {
      label: "Projects",
      value: "project",
    },
  ];

  const dispatch = useDispatch();
  const { toast } = useToast();

  useEffect(() => {
    dispatch(setSelectedProject(projectParam));
  }, []);

  useEffect(() => {
    dispatch(setGroupBy(groupByParam));
  }, [groupByParam]);

  const handleAddTime = (taskName: string) => {
    const timesheetData = {
      name: "",
      parent: "",
      task: taskName,
      date: getFormatedDate(getDateTimeForMultipleTimeZoneSupport()),
      description: "",
      hours: 0,
      isUpdate: false,
      employee: user.employee,
    };
    dispatch(SetTimesheet(timesheetData));
    dispatch(SetAddTimeDialog(true));
  };
  // Frappe Call for Project comboBox Data
  const [projectSearch, setProjectSearch] = useState<string>("");
  const { data: projects, mutate: projectSearchMutate } = useFrappeGetCall(
    "frappe.client.get_list",
    {
      doctype: "Project",
      fields: ["name", "project_name"],
      or_filters: [
        ["name", "like", `%${projectSearch}%`],
        ["project_name", "like", `%${projectSearch}%`],
      ],
    },
    "projects",
    {
      shouldRetryOnError: false,
    },
  );
  useEffect(() => {
    projectSearchMutate();
  }, [projectSearch]);

  const loadMore = () => {
    dispatch(setStart(task.start + 20));
  };

  useEffect(() => {
    setProjectParam(task.selectedProject);
  }, [setProjectParam, task.selectedProject]);

  useEffect(() => {
    setGroupByParam(task.groupBy);
  }, [setGroupByParam, task.groupBy]);

  // call to fetch task list from DB ( single data source for flat and nested table)
  const { data, isLoading, error, mutate } = useFrappeGetCall("frappe_pms.timesheet.api.task.get_task_list", {
    page_length: 20,
    start: task.start,
    projects: task.selectedProject,
    search: subjectSearchParam,
  });
  useEffect(() => {
    if (task.isFetchAgain) {
      mutate();
      dispatch(setFetchAgain(false));
    }
    if (data) {
      if (task.start !== 0) {
        dispatch(updateTaskData(data.message));
        dispatch(updateProjectData());
      } else {
        dispatch(setTaskData(data.message));
        dispatch(setProjectData());
      }
    }
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast({
        variant: "destructive",
        description: err,
      });
    }
  }, [data, dispatch, error, mutate, task.isFetchAgain, task.start, toast, groupByParam]);

  const handleLike = (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
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
        mutate();
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
    [dispatch],
  );
  const handleGroupByChange = useCallback(
    (value: string | string[]) => {
      dispatch(setGroupBy(value as string[]));
    },
    [dispatch],
  );

  // column definitions
  const columns: ColumnsType = [
    {
      accessorKey: "project_name",
      size: Number(localStorageTaskState?.columnWidth["project_name"] ?? "150"),
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
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer flex-shrink-0",
                column.getIsSorted() === "desc" && "text-orange-500",
              )}
            />
          </div>
        );
      },
      cell: ({ row }) => {
        return (
          <Typography
            title={String(row.original.project_name ?? "")}
            variant="p"
            className="max-w-sm truncate cursor-pointer"
          >
            {row.original.project_name}
          </Typography>
        );
      },
    },
    {
      accessorKey: "subject",
      size: Number(localStorageTaskState?.columnWidth["subject"] ?? "150"),
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
        return (
          <Typography variant="p" title={row.original.subject} className="max-w-sm truncate cursor-pointer">
            {row.original.subject}
          </Typography>
        );
      },
    },
    {
      accessorKey: "due_date",
      size: Number(localStorageTaskState?.columnWidth["due_date"] ?? "150"),
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer"
            onClick={() => {
              column.toggleSorting();
            }}
          >
            <p className="truncate">Due Date</p>
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
        return (
          <Typography variant="p" className="truncate w-4/5">
            {getValue() as ReactNode}
          </Typography>
        );
      },
    },
    {
      accessorKey: "status",
      size: Number(localStorageTaskState?.columnWidth["status"] ?? "150"),

      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer"
            onClick={() => {
              column.toggleSorting(column.getIsSorted() === "asc");
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
      cell: ({ row }) => {
        return <TaskStatus status={row.original.status} />;
      },
    },
    {
      accessorKey: "priority",

      size: Number(localStorageTaskState?.columnWidth["priority"] ?? "150"),
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer"
            onClick={() => {
              column.toggleSorting(column.getIsSorted() === "asc");
            }}
          >
            <p className="truncate">Priority</p>
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
        return <TaskPriority priority={row.original.priority} />;
      },
    },
    {
      accessorKey: "expected_time",
      size: Number(localStorageTaskState?.columnWidth["expected_time"] ?? "150"),
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer"
            onClick={() => {
              column.toggleSorting(column.getIsSorted() === "asc");
            }}
          >
            <p className="truncate">Expected Hours</p>
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
        return (
          <Typography variant="p" className="text-center truncate">
            {floatToTime(row.original.expected_time)}
          </Typography>
        );
      },
    },
    {
      accessorKey: "actual_time",
      size: Number(localStorageTaskState?.columnWidth["actual_time"] ?? "150"),
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer"
            onClick={() => {
              column.toggleSorting(column.getIsSorted() === "asc");
            }}
          >
            <p className="truncate">Hour Spent</p>
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
        return (
          <Typography variant="p" className="text-center truncate">
            {floatToTime(row.original.actual_time)}
          </Typography>
        );
      },
    },
    {
      accessorKey: "timesheetAction",
      header: "",
      size: 60, // Default size
      minSize: 60, // Minimum size
      maxSize: 60, // Maximum size
      cell: ({ row }) => {
        return (
          <div title="Add Timesheet" className="w-full flex justify-center items-center">
            <Clock
              className={"w-4 h-4 hover:cursor-pointer hover:text-blue-600"}
              onClick={() => {
                handleAddTime(row.original.name);
              }}
            />
          </div>
        );
      },
    },
    {
      accessorKey: "liked",
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
                isLiked(row.original._liked_by, user.user) && "fill-red-600",
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
  const nestedProjectColumns: ProjectNestedColumnsType = [
    {
      accessorKey: "project_name",
      size: Number(localStorageTaskState?.columnWidth["project_name"] ?? "150"),
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
            <ArrowUpDown
              className={cn(
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer flex-shrink-0",
                column.getIsSorted() === "desc" && "text-orange-500",
              )}
            />
          </div>
        );
      },
      cell: ({ row, getValue }) => {
        if (row.depth !== 0) return null;
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
              <div className="truncate w-4/5">{getValue() as ReactNode}</div>
            </div>
          </>
        );
      },
    },
    {
      accessorKey: "subject",
      size: Number(localStorageTaskState?.columnWidth["subject"] ?? "150"),
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
        return (
          <Typography variant="p" title={String(getValue())} className="truncate cursor-pointer">
            {getValue() as ReactNode}
          </Typography>
        );
      },
    },
    {
      accessorKey: "due_date",
      size: Number(localStorageTaskState?.columnWidth["due_date"] ?? "150"),
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <div className="truncate w-4/5">Due Date</div>
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
        return (
          <Typography variant="p" className="truncate w-4/5">
            {getValue() as ReactNode}
          </Typography>
        );
      },
    },
    {
      accessorKey: "status",

      size: Number(localStorageTaskState?.columnWidth["status"] ?? "150"),
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <div className="truncate w-4/5">Status</div>
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
        return getValue() && <TaskStatus status={getValue() as TaskData["status"]} />;
      },
    },
    {
      id: "priority",

      size: Number(localStorageTaskState?.columnWidth["priority"] ?? "150"),
      accessorKey: "priority",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <div className="truncate w-4/5">Priority</div>
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
        return getValue() && <TaskPriority priority={getValue() as TaskData["priority"]} />;
      },
    },
    {
      id: "expected_time",
      size: Number(localStorageTaskState?.columnWidth["expected_time"] ?? "150"),
      accessorKey: "expected_time",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <div className="truncate w-4/5">Expected Hours</div>
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
        const hour = getValue();
        return (
          <Typography variant="p" className="text-center truncate">
            {hour !== undefined && floatToTime(Number(getValue()))}
          </Typography>
        );
      },
    },
    {
      id: "actual_time",
      size: Number(localStorageTaskState?.columnWidth["actual_time"] ?? "150"),
      accessorKey: "actual_time",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <div className="truncate w-4/5">Hour Spent</div>

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
        const hour = getValue();
        return (
          <Typography variant="p" className="text-center truncate">
            {hour !== undefined && floatToTime(Number(getValue()))}
          </Typography>
        );
      },
    },
    {
      accessorKey: "timesheetAction",
      header: "",
      size: 60, // Default size
      minSize: 60, // Minimum size
      maxSize: 60, // Maximum size
      cell: ({ row }) => {
        return (
          row.depth !== 0 && (
            <div title="Add Timesheet" className="w-full flex justify-center items-center">
              <Clock
                className={"w-4 h-4 hover:cursor-pointer hover:text-blue-600"}
                onClick={() => {
                  handleAddTime(row.original.name);
                }}
              />
            </div>
          )
        );
      },
    },
    {
      accessorKey: "liked",
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
                isLiked(row.original?._liked_by, user.user) && "fill-red-600",
              )}
              data-task={row.original.name}
              data-liked-by={row.original?._liked_by}
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
    initialState: {
      sorting: [{ id: "liked", desc: false }],
    },
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

  const columnsToExcludeActionsInTables: columnsToExcludeActionsInTablesType = ["liked", "timesheetAction"];

  // LocalStorage related functions and utilities

  useEffect(() => {
    // set localStorage Map for Task
    if (!localStorage.getItem("task")) {
      localStorage.setItem("task", JSON.stringify(localStorageTaskDataMap));
      setLocalStorageTaskState(localStorageTaskDataMap);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("task", JSON.stringify(localStorageTaskState));
  }, [localStorageTaskState]);

  useEffect(() => {
    setLocalStorageTaskState((prev: localStorageTaskType) => {
      return { ...prev, columnSort: sorting };
    });
  }, [sorting]);

  // handle ad Task
  const handleAddTask = () => {
    dispatch(setAddTaskDialog(true));
  };
  // handle project search combo box
  const handleProjectSearch = (searchString: string) => {
    setProjectSearch(searchString);
  };
  // More DropDown Items here
  const renderColumnFilterList = (
    table: FlatTableType,
    groupBy: GroupByParamType,
    columnsToExcludeActionsInTables: columnsToExcludeActionsInTablesType,
    setLocalStorageTaskState: setLocalStorageTaskStateType,
  ): ReactNode => {
    return table
      .getAllColumns()
      .filter((column) => column.getCanHide())
      .map((column) => {
        if (columnsToExcludeActionsInTables?.includes(column.id)) {
          return null;
        }
        if (groupBy.length > 0 && column.id === "project_name") {
          return null;
        }
        return (
          <DropdownMenuCheckboxItem
            key={column.id}
            className="capitalize cursor-pointer"
            checked={column.getIsVisible()}
            onCheckedChange={(value) => {
              column.toggleVisibility(!!value);
              setLocalStorageTaskState((prev) => {
                if (prev.hideColumn.includes(column.id)) {
                  const mutatedHideColumn = [...prev.hideColumn];
                  const index = mutatedHideColumn.indexOf(column.id);
                  if (index > -1) {
                    mutatedHideColumn.splice(index, 1);
                  }
                  return { ...prev, hideColumn: mutatedHideColumn };
                }
                const mutatedHideColumnSet = new Set([...prev.hideColumn, column.id]);
                return { ...prev, hideColumn: [...mutatedHideColumnSet] };
              });
            }}
          >
            {column.id.replace("_", " ")}
          </DropdownMenuCheckboxItem>
        );
      });
  };

  const MoreTableOptionsDropDownData: {
    title: string;
    icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
    iconClass: string;
    handleClick?: () => void;
    type: MoreTableOptionsDropDownType;
    render?: () => ReactNode;
  }[] = [
    {
      title: "Reset Table",
      icon: RotateCcw,
      iconClass: "h-4 w-4 ",
      handleClick: () => {
        setLocalStorageTaskState(localStorageTaskDataMap);
        // update All Sort,filter and columnWidth States when localStorage Changes (table config reset)
        setSorting([]);
        setColumnVisibility({});
        table.setColumnSizing({});
        nestedProjectTable.setColumnSizing({});
      },
      type: "normal",
    },
    {
      title: "Columns",
      icon: Columns2,
      iconClass: "h-4 w-4 ",
      type: "nestedSubMenu",
      render: () => {
        return renderColumnFilterList(table, groupByParam, columnsToExcludeActionsInTables, setLocalStorageTaskState);
      },
    },
  ];

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
      `}
      </style>
      {/* filters and combo boxes */}
      <Header>
        <div id="filters" className="flex gap-x-2 w-full overflow-hidden md:overflow-x-auto h-full overflow-x-auto">
          <div className="flex gap-2 xl:w-2/5">
            {/* Task Search Filter */}
            <DeBounceInput
              placeholder="Search Subject..."
              className="max-w-full min-w-40"
              deBounceValue={400}
              value={subjectSearchParam}
              callback={handleSubjectSearchChange}
            />
          </div>

          {/* Projects comboBox */}
          <ComboxBox
            label="Projects"
            value={projectParam}
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
            onSearch={handleProjectSearch}
          />
          {/* GroupBy comboBox */}
          <ComboxBox
            label="GroupBy"
            value={groupByParam}
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
          <div className="ml-auto flex h-full gap-x-2 justify-center items-center">
            {/* more button */}
            {/* Add Task Button */}
            <Button onClick={handleAddTask} className="px-3" title="Add task">
              <Plus className="h-4 w-4 mr-1" /> Add Task
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none h-full">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-full w-fit min-w-10 cursor-pointer border-0 outline-none"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">More</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {MoreTableOptionsDropDownData?.map((dropdownItem) => {
                  if (dropdownItem.type === "normal") {
                    return (
                      <DropdownMenuItem
                        key={dropdownItem.title}
                        onClick={dropdownItem.handleClick}
                        className="cursor-pointer flex gap-2 items-center justify-start"
                      >
                        <dropdownItem.icon className={cn(dropdownItem.iconClass)} />
                        <Typography variant="p">{dropdownItem.title}</Typography>
                      </DropdownMenuItem>
                    );
                  }
                  return (
                    <DropdownMenuSub key={dropdownItem.title}>
                      <DropdownMenuSubTrigger className="cursor-pointer flex gap-2 items-center justify-start">
                        <dropdownItem.icon className={cn(dropdownItem.iconClass)} />
                        <Typography variant="p">{dropdownItem.title}</Typography>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>{dropdownItem?.render()}</DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Header>
      {/* tables */}
      {task.isTaskLogDialogBoxOpen && <TaskLog />}
      {groupByParam.length === 0 && task.groupBy ? (
        <FlatTable
          table={table}
          columns={columns}
          columnsToExcludeActionsInTables={columnsToExcludeActionsInTables}
          setLocalStorageTaskState={setLocalStorageTaskState}
          task={task}
          isLoading={isLoading}
        />
      ) : (
        <RowGroupedTable
          table={nestedProjectTable}
          columns={nestedProjectColumns}
          columnsToExcludeActionsInTables={columnsToExcludeActionsInTables}
          setLocalStorageTaskState={setLocalStorageTaskState}
          task={task}
          isLoading={isLoading}
        />
      )}
      {/* footer */}
      <Footer>
        <div className="flex justify-between items-center">
          <Button
            className="float-left"
            variant="outline"
            onClick={loadMore}
            disabled={task.task.length === task.total_count}
          >
            Load More
          </Button>
          <Typography variant="p" className="px-5 font-semibold">
            {`${task.task.length | 0} of ${task.total_count | 0}`}
          </Typography>
        </div>
      </Footer>
      {/* addTime */}
      {timesheet.isDialogOpen && (
        <AddTime
          employee={user.employee}
          task={timesheet.timesheet.task}
          initialDate={timesheet.timesheet.date}
          open={timesheet.isDialogOpen}
          onOpenChange={() => {
            dispatch(SetAddTimeDialog(false));
          }}
          workingFrequency={user.workingFrequency}
          workingHours={user.workingHours}
        />
      )}

      {task.isAddTaskDialogBoxOpen && <AddTask task={task} projects={projects} setProjectSearch={setProjectSearch} />}
    </>
  );
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

export default Task;
