import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Spinner } from "@/app/components/spinner";
import { TaskData, ProjectProps, ProjectNestedTaskData } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  setStart,
  setProjectStart,
  setTaskData,
  setSelectedProject,
  setFetchAgain,
  setProjectFetchAgain,
  setGroupBy,
  updateTaskData,
  updateProjectData,
  setProjectData,
  setAddTaskDialog,
  TaskState,
  AddTaskType,
} from "@/store/task";
import { cn, parseFrappeErrorMsg, floatToTime, getFormatedDate, deBounce } from "@/lib/utils";
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
  Filter,
  GripVertical,
  Heart,
  LoaderCircle,
  MoreVertical,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
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
  ColumnSizing,
} from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { AppendData, SetAddTimeDialog, setData, SetFetchAgain, SetTimesheet } from "@/store/timesheet";
import { AddTime } from "@/app/pages/timesheet/addTime";
import React from "react";
import { Input } from "@/app/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Textarea } from "@/app/components/ui/textarea";

const Task = () => {
  const task = useSelector((state: RootState) => state.task);
  const user = useSelector((state: RootState) => state.user);
  const timesheet = useSelector((state: RootState) => state.timesheet);
  const { call } = useFrappePostCall("frappe.desk.like.toggle_like");
  // States for maintaining tables and filters
  const [expanded, setExpanded] = useState<boolean>(true);
  const localStorageTaskDataMap = {
    hideColumn: [],
    groupBy: [],
    projects: [],
    columnWidth: [],
    columnSort: [],
  };
  const [localStorageTaskState, setLocalStorageTaskState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("task"));
    } catch (error) {
      return localStorageTaskDataMap;
    }
  });
  const [sorting, setSorting] = useState<SortingState>(() => {
    try {
      return JSON.parse(localStorage.getItem("task")).columnSort;
    } catch (error) {
      return [];
    }
  });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    createFalseValuedObject(localStorageTaskState?.hideColumn ?? {}),
  );
  const [projectParam, setProjectParam] = useQueryParamsState<string[]>("project", []);
  const [groupByParam, setGroupByParam] = useQueryParamsState<string[]>("groupby", []);
  const [subjectSearch, setSubjectSearch] = useState<string>("");
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  //task search change (input)
  const updateSubjectSearch = useCallback(
    deBounce((searchStr) => {
      setSubjectSearch(searchStr);
      if (groupByParam.length === 0) mutate();
      else {
        nestedProjectMutate();
      }
    }, 700),
    [],
  );

  const handleSubjectSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateSubjectSearch(e.target.value.trim());
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
    if (groupByParam.length === 0) {
      dispatch(setFetchAgain(true));
    }
  }, [groupByParam]);

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
  // Frappe Call for Project comboBox Data
  const [projectSearch, setProjectSearch] = useState("");
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
    if (groupByParam.length > 0) {
      return dispatch(setProjectStart(task.projectStart + 20));
    }
    dispatch(setStart(task.start + 20));
  };

  useEffect(() => {
    setProjectParam(task.selectedProject);
  }, [setProjectParam, task.selectedProject]);

  useEffect(() => {
    setGroupByParam(task.groupBy);
  }, [setGroupByParam, task.groupBy]);
  const [nestedProjectMutateCall, setNestedProjectMutateCall] = useState();
  const [flatTaskMutateCall, setFlatTaskMutateCall] = useState();

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
          nestedProjectMutateCall();
        } else {
          flatTaskMutateCall();
        }
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        console.log(err);
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
  // coumn definitions
  const columns: ColumnDef<TaskData>[] = [
    {
      accessorKey: "project_name",
      size: localStorageTaskState?.columnWidth["project_name"] ?? "150",
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
      size: localStorageTaskState?.columnWidth["subject"] ?? "150",
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
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer",
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
      size: localStorageTaskState?.columnWidth["due_date"] ?? "150",
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
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer",
                column.getIsSorted() === "desc" && "text-orange-500",
              )}
            />
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
      size: localStorageTaskState?.columnWidth["status"] ?? "150",
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
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer",
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
      size: localStorageTaskState?.columnWidth["priority"] ?? "150",
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
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer",
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
      size: localStorageTaskState?.columnWidth["expected_time"] ?? "150",
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
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer",
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
      size: localStorageTaskState?.columnWidth["actual_time"] ?? "150",
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
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer",
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
  const nestedProjectColumns: ColumnDef<ProjectNestedTaskData>[] = [
    {
      accessorKey: "project_name",
      size: localStorageTaskState?.columnWidth["project_name"] ?? "150",
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
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer",
                column.getIsSorted() === "desc" && "text-orange-500",
              )}
            />
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
      size: localStorageTaskState?.columnWidth["subject"] ?? "150",
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
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer",
                column.getIsSorted() === "desc" && "text-orange-500",
              )}
            />
          </div>
        );
      },
      cell: ({ row, getValue }) => {
        return (
          <Typography variant="p" title={getValue()} className="truncate cursor-pointer">
            {getValue()}
          </Typography>
        );
      },
    },
    {
      accessorKey: "due_date",
      size: localStorageTaskState?.columnWidth["due_date"] ?? "150",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <div className="truncate w-4/5">Due Date</div>
            <ArrowUpDown
              className={cn(
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer",
                column.getIsSorted() === "desc" && "text-orange-500",
              )}
            />
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
      size: localStorageTaskState?.columnWidth["status"] ?? "150",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <div className="truncate w-4/5">Status</div>
            <ArrowUpDown
              className={cn(
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer",
                column.getIsSorted() === "desc" && "text-orange-500",
              )}
            />
          </div>
        );
      },
      cell: ({ row, getValue }) => {
        return getValue() && <TaskStatus status={getValue()} />;
      },
    },
    {
      id: "priority",
      size: localStorageTaskState?.columnWidth["priority"] ?? "150",
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
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer",
                column.getIsSorted() === "desc" && "text-orange-500",
              )}
            />
          </div>
        );
      },
      cell: ({ row, getValue }) => {
        return getValue() && <TaskPriority priority={getValue()} />;
      },
    },
    {
      id: "expected_time",
      size: localStorageTaskState?.columnWidth["expected_time"] ?? "150",
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
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer",
                column.getIsSorted() === "desc" && "text-orange-500",
              )}
            />
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
      size: localStorageTaskState?.columnWidth["actual_time"] ?? "150",
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
                "h-4 w-4 transition-colors ease duration-200 hover:cursor-pointer",
                column.getIsSorted() === "desc" && "text-orange-500",
              )}
            />
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
                isLiked(row.original._liked_by, user.user) && "fill-red-600",
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

  const columnsToExcludeActionsInTables: string[] = ["#", "timesheetAction"];

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
    setLocalStorageTaskState((prev) => {
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
  const MoreTableOptionsDropDownData = [
    {
      title: "Reset table",
      icon: RotateCcw,
      iconClass: "h-4 w-4 text-blue-500",
      handleClick: () => {
        setLocalStorageTaskState(localStorageTaskDataMap);
        // update All Sort,filter and columnWidth States when localStorage Changes (table config reset)
        setSorting([]);
        setColumnVisibility({});
        table.setColumnSizing([]);
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
        <div id="filters" className="flex gap-x-2 mb-3 w-full overflow-hidden p-1 max-md:overflow-x-scroll">
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
          {/* Hide Column select */}
          <HideColumn
            table={table}
            groupBy={groupByParam}
            columnsToExcludeActionsInTables={columnsToExcludeActionsInTables}
            setLocalStorageTaskState={setLocalStorageTaskState}
          />
          {/* more button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="h-8 w-8 cursor-pointer ml-auto">
                <MoreVertical className="h-3.5 w-3.5" />
                <span className="sr-only">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {MoreTableOptionsDropDownData?.map((dropdownItem) => {
                return (
                  <DropdownMenuItem
                    key={dropdownItem.title}
                    onClick={dropdownItem.handleClick}
                    className="cursor-pointer flex gap-2 items-center justify-center"
                  >
                    <dropdownItem.icon className={cn(dropdownItem.iconClass)} />
                    <Typography variant="p">{dropdownItem.title}</Typography>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Add Task Button */}
          <Button onClick={handleAddTask} title="Add task">
            {" "}
            <Plus className="h-4 w-4 mr-2" /> Add Task
          </Button>
        </div>
        {/* tables */}
        <div className="overflow-hidden w-full overflow-y-scroll" style={{ height: "calc(100vh - 8rem)" }}>
          {groupByParam.length === 0 && task.groupBy ? (
            <FlatTable
              table={table}
              columns={columns}
              columnsToExcludeActionsInTables={columnsToExcludeActionsInTables}
              setLocalStorageTaskState={setLocalStorageTaskState}
              task={task}
              subjectSearch={subjectSearch}
              toast={toast}
              setMutateCall={setFlatTaskMutateCall}
            />
          ) : (
            <RowGroupedTable
              table={nestedProjectTable}
              columns={nestedProjectColumns}
              columnsToExcludeActionsInTables={columnsToExcludeActionsInTables}
              setLocalStorageTaskState={setLocalStorageTaskState}
              task={task}
              subjectSearch={subjectSearch}
              toast={toast}
              setMutateCall={setNestedProjectMutateCall}
            />
          )}
        </div>
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
        {/* addTask */}
        {task.isAddTaskDialogBoxOpen && (
          <AddTask task={task} projects={projects} setProjectSearch={setProjectSearch} toast={toast} />
        )}
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
  return (
    <div
      title={status}
      className={cn(
        statusCss[status],
        "py-1 px-2 truncate  w-fit max-w-40 text-xs font-bold text-center cursor-pointer rounded-full ",
      )}
    >
      {status}
    </div>
  );
};

const HideColumn = ({ table, groupBy, columnsToExcludeActionsInTables, setLocalStorageTaskState }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className=" focus-visible:ring-0">
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {table
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
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default Task;

//one time utility for asssigning All keys of an object to false
const createFalseValuedObject = (obj) => {
  const newFalseValueObject = {};
  if (Object.keys(obj).length > 0) {
    for (const key of obj) {
      newFalseValueObject[key] = false;
    }
  }
  return newFalseValueObject;
};

const FlatTable = ({
  table,
  columns,
  columnsToExcludeActionsInTables,
  setLocalStorageTaskState,
  task,
  subjectSearch,
  toast,
  setMutateCall,
}) => {
  const dispatch = useDispatch();
  let resizeObserver;
  const { data, isLoading, error, mutate } = useFrappeGetCall("frappe_pms.timesheet.api.utils.get_task_for_employee", {
    page_length: 20,
    start: task.start,
    project: task.selectedProject,
    search: subjectSearch,
  });
  useEffect(() => {
    if (task.isFetchAgain) {
      mutate();
      dispatch(setFetchAgain(false));
    }
    if (data) {
      if (task.start !== 0) {
        dispatch(updateTaskData(data.message));
      } else {
        dispatch(setTaskData(data.message));
      }
    }
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast({
        variant: "destructive",
        description: err,
      });
    }
  }, [data, dispatch, error, mutate, task.isFetchAgain, task.start, toast]);
  useEffect(() => {
    setMutateCall(() => mutate);
  }, []);
  return (
    <>
      {isLoading ? (
        <Spinner isFull />
      ) : (
        <Table className="[&_td]:px-2  [&_th]:px-2 table-fixed">
          <TableHeader className="[&_th]:h-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      className={cn("resizer", header.column.getIsResizing() && "isResizing")}
                      key={header.id}
                      onMouseDown={(event) => {
                        const container = event.currentTarget;
                        resizeObserver = new ResizeObserver((entries) => {
                          for (const entry of entries) {
                            setLocalStorageTaskState((prev) => {
                              return {
                                ...prev,
                                columnWidth: { ...prev.columnWidth, [header.id]: header.getSize() },
                              };
                            });
                          }
                        });
                        resizeObserver.observe(container);
                      }}
                      onMouseUp={() => {
                        if (resizeObserver) {
                          resizeObserver.disconnect();
                        }
                      }}
                      style={{
                        width: header.getSize(),
                        position: "relative",
                      }}
                    >
                      <div className="w-full h-full flex items-center justify-between group">
                        <div className="w-full">{flexRender(header.column.columnDef.header, header.getContext())}</div>
                        {!columnsToExcludeActionsInTables.includes(header.id) && (
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
      )}
    </>
  );
};

const RowGroupedTable = ({
  table,
  columns,
  columnsToExcludeActionsInTables,
  setLocalStorageTaskState,
  task,
  subjectSearch,
  toast,
  setMutateCall,
}) => {
  const dispatch = useDispatch();
  let resizeObserver;
  //nested project task call
  const {
    data: nestedProjectData,
    isLoading: nestedProjectIsLoading,
    error: nestedProjectError,
    mutate: nestedProjectMutate,
  } = useFrappeGetCall("frappe_pms.timesheet.api.utils.get_project_task", {
    page_length: 20,
    project: task.selectedProject.length == 0 ? null : task.selectedProject,
    task_search: subjectSearch,
  });
  useEffect(() => {
    setMutateCall(() => nestedProjectMutate);
  }, []);
  //nested projectdata side-effects
  useEffect(() => {
    if (task.projectIsFetchAgain) {
      nestedProjectMutate();
      dispatch(setProjectFetchAgain(false));
    }
    if (nestedProjectData) {
      if (task.projectStart !== 0) {
        dispatch(updateProjectData(nestedProjectData.message));
      } else {
        dispatch(setProjectData(nestedProjectData.message));
      }
    }
    if (nestedProjectError) {
      const err = parseFrappeErrorMsg(nestedProjectError);
      toast({
        variant: "destructive",
        description: err,
      });
    }
  }, [
    nestedProjectData,
    dispatch,
    nestedProjectError,
    nestedProjectMutate,
    task.projectIsFetchAgain,
    task.projectStart,
    toast,
  ]);
  return (
    <>
      {nestedProjectIsLoading ? (
        <Spinner isFull />
      ) : (
        <Table className="[&_td]:px-2  [&_th]:px-2 table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    className={`resizer overflow-hidden ${header.column.getIsResizing() ? "isResizing" : null}`}
                    key={header.id}
                    style={{
                      width: header.getSize(),
                      position: "relative",
                    }}
                    onMouseDown={(event) => {
                      const container = event.currentTarget;
                      resizeObserver = new ResizeObserver((entries) => {
                        for (const entry of entries) {
                          setLocalStorageTaskState((prev) => {
                            return {
                              ...prev,
                              columnWidth: { ...prev.columnWidth, [header.id]: header.getSize() },
                            };
                          });
                        }
                      });
                      resizeObserver.observe(container);
                    }}
                    onMouseUp={() => {
                      if (resizeObserver) {
                        resizeObserver.disconnect();
                      }
                    }}
                  >
                    <div className="w-full h-full flex items-center justify-between group">
                      <div className="w-full">{flexRender(header.column.columnDef.header, header.getContext())}</div>
                      {!columnsToExcludeActionsInTables.includes(header.id) && (
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
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
    </>
  );
};

const AddTask = ({ task, projects, setProjectSearch, toast }) => {
  const dispatch = useDispatch();
  const expectedTimeSchema = z.preprocess(
    (val, ctx) => {
      if (!val.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["expected_time"],
          message: "Please enter a valid time in Hours",
        });
        return null;
      }
      const processedValue = Number(val);
      if (isNaN(processedValue)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["expected_time"],
          message: "Invalid Time format. Please enter a valid time in Hours",
        });
        return null;
      }
      return processedValue;
    },
    z.union([
      z.string({
        invalid_type_error: "Please enter a valid number for hours.",
      }),
      z.number({
        invalid_type_error: "Please enter a valid number for hours.",
      }),
    ]),
  );
  const TaskSchema = z.object({
    subject: z
      .string({
        required_error: "Please add a subject.",
      })
      .trim()
      .min(1, { message: "Please add a subject." }),
    project: z
      .string({
        required_error: "Please select a project.",
      })
      .trim()
      .min(1, { message: "Please select a project." }),
    expected_time: expectedTimeSchema,
    description: z
      .string({
        required_error: "Please enter description.",
      })
      .trim()
      .min(4, "Please enter valid description."),
  });
  const { call } = useFrappePostCall("frappe_pms.timesheet.api.utils.add_task");
  const form = useForm<z.infer<typeof TaskSchema>>({
    resolver: zodResolver(TaskSchema),
    defaultValues: {
      subject: "",
      project: "",
      expected_time: "",
      description: "",
    },
    mode: "onSubmit",
  });
  const handleSubmit = (data: z.infer<typeof TaskSchema>) => {
    const sanitizedTaskData: AddTaskType = {
      subject: data.subject.trim(),
      description: data.description.trim(),
      expected_time: String(data.expected_time),
      project: data.project.trim(),
    };
    call(sanitizedTaskData)
      .then((res) => {
        toast({
          variant: "success",
          description: res.message,
        });
        dispatch(setProjectFetchAgain(true));
        closeAddTaskDialog();
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
      });
  };
  const closeAddTaskDialog = () => {
    dispatch(setAddTaskDialog(false));
    setProjectSearch("");
    form.reset();
  };
  const handleSubjectChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    form.setValue("subject", event.target.value);
  };
  const handleTimeChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    form.setValue("expected_time", event.target.value);
  };
  const handleProjectChange = (data: string[] | string) => {
    form.setValue("project", data[0]);
  };
  const handleProjectSearch = (searchString: string) => {
    setProjectSearch(searchString);
  };
  return (
    <>
      <Dialog onOpenChange={closeAddTaskDialog} open={task.isAddTaskDialogBoxOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="pb-6">Add Task</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="flex flex-col gap-y-6">
                <div className="flex gap-x-4 items-start">
                  {/* subject field */}
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel className="flex gap-2 items-center">
                          <p className="text-sm">Subject</p>
                        </FormLabel>
                        <FormControl>
                          <>
                            <div className="relative flex items-center">
                              <Input
                                placeholder="New subject"
                                className="placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                                {...field}
                                type="text"
                                onChange={handleSubjectChange}
                              />
                            </div>
                          </>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* expected time  */}
                  <FormField
                    control={form.control}
                    name="expected_time"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel className="flex gap-2 items-center text-sm">Expected Time</FormLabel>
                        <FormControl>
                          <FormControl>
                            <>
                              <div className="relative flex items-center">
                                <Input
                                  placeholder="Time(in hours)"
                                  className="placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                                  {...field}
                                  type="text"
                                  onChange={handleTimeChange}
                                />
                              </div>
                            </>
                          </FormControl>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {/* project combobox */}
                <FormField
                  control={form.control}
                  name="project"
                  render={() => (
                    <FormItem>
                      <FormLabel>Projects</FormLabel>
                      <FormControl>
                        <ComboxBox
                          label="Search Project"
                          showSelected
                          value={form.getValues("project") ? [form.getValues("project")] : []}
                          data={projects?.message?.map((item: ProjectProps) => ({
                            label: item.project_name,
                            value: item.name,
                          }))}
                          onSelect={handleProjectChange}
                          onSearch={handleProjectSearch}
                          rightIcon={<Search className="h-4 w-4 stroke-slate-400" />}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Explain the subject"
                          rows={4}
                          className="w-full placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="sm:justify-start w-full">
                  <div className="flex gap-x-4 w-full">
                    <Button disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting && <LoaderCircle className="animate-spin w-4 h-4" />}
                      Add Task
                    </Button>
                    <Button variant="secondary" type="button" onClick={closeAddTaskDialog}>
                      Cancel
                    </Button>
                  </div>
                </DialogFooter>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};
