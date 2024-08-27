import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Spinner } from "@/app/components/spinner";
import { TaskData, ProjectProps } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { setStart, setTaskData, setSelectedProject, setFetchAgain } from "@/store/task";
import { cn, parseFrappeErrorMsg, floatToTime, getFormatedDate } from "@/lib/utils";
import { useToast } from "@/app/components/ui/use-toast";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Typography } from "@/app/components/typography";
import { ComboxBox } from "@/app/components/comboBox";
import { useQueryParamsState } from "@/lib/queryParam";
import { ArrowUpDown, Filter, Heart } from "lucide-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  VisibilityState,
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

const Task = () => {
  const task = useSelector((state: RootState) => state.task);
  const user = useSelector((state: RootState) => state.user);
  const timesheet = useSelector((state: RootState) => state.timesheet);
  const { call } = useFrappePostCall("frappe.desk.like.toggle_like");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [projectParam, setProjectParam] = useQueryParamsState<string[]>("project", []);

  const dispatch = useDispatch();
  const { toast } = useToast();

  useEffect(() => {
    dispatch(setSelectedProject(projectParam));
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
    console.log("timesheetData", timesheetData);
    dispatch(SetTimesheet(timesheetData));
    dispatch(SetAddTimeDialog(true));
  }
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

  useEffect(() => {
    setProjectParam(task.selectedProject);
  }, [setProjectParam, task.selectedProject]);

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
    [dispatch]
  );
  const columns: ColumnDef<TaskData>[] = [
    {
      accessorKey: "#",
      header: "",
      cell: ({ row }) => {
        return (
          <Heart
            className={cn("w-4 h-4 hover:cursor-pointer", isLiked(row.original._liked_by, user.user) && "fill-red-600")}
            data-task={row.original.name}
            data-liked-by={row.original._liked_by}
            onClick={handleLike}
          />
        );
      },
    },
    {
      accessorKey: "subject",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Subject
            <ArrowUpDown className="h-4 w-4 group-hover:text-orange-500 transition-colors ease duration-200 hover:cursor-pointer" />
          </div>
        );
      },
      cell: ({ row }) => {
        return (
          <Typography variant="p" className="max-w-sm truncate" onClick={() => { handleAddTime(row.original.name)}}>
            {row.original.subject}
          </Typography>
        );
      },
    },
    {
      accessorKey: "project_name",
      header: "Project Name",
    },
    {
      accessorKey: "due_date",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Due Date
            <ArrowUpDown className="h-4 w-4 group-hover:text-orange-500 transition-colors ease duration-200 hover:cursor-pointer" />
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
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
            className="flex items-center gap-x-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Priority
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
      header: "Expected Hours",
      cell: ({ row }) => {
        return (
          <Typography variant="p" className="text-center">
            {floatToTime(row.original.expected_time)}
          </Typography>
        );
      },
    },
    {
      accessorKey: "actual_time",
      header: "Hour Spent",
      cell: ({ row }) => {
        return (
          <Typography variant="p" className="text-center">
            {floatToTime(row.original.actual_time)}
          </Typography>
        );
      },
    },
  ];
  const table = useReactTable({
    data: task.task,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnVisibility,
    },
  });

  if (isLoading) {
    return <Spinner isFull />;
  }
  return (
    <div>
      <div id="filters" className="flex gap-x-2 mb-3">
        <ComboxBox
          label="Projects"
          value={task.selectedProject}
          isMulti
          showSelected={false}
          leftIcon={<Filter className={cn("h-4 w-4", task.selectedProject.length != 0 && "fill-primary")} />}
          rightIcon={task.selectedProject.length > 0 && <Badge className="px-1.5">{task.selectedProject.length}</Badge>}
          data={projects?.message.map((item: ProjectProps) => ({
            label: item.project_name,
            value: item.name,
          }))}
          className="text-primary border-dashed gap-x-2 font-normal w-fit"
          onSelect={handleProjectChange}
        />
        <HideColumn table={table} />
      </div>
      <div className="overflow-y-scroll" style={{ height: "calc(100vh - 8rem)" }}>
        <Table className="[&_td]:px-2  [&_th]:px-2">
          <TableHeader className="[&_th]:h-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
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
      </div>
      <div className="w-full flex justify-between items-center mt-5">
        <Button
          className="float-left"
          variant="outline"
          onClick={loadMore}
          disabled={task.task.length == task.total_count}
        >
          Load More
        </Button>
        <Typography variant="p" className="px-5 font-semibold">
          {`${task.task.length | 0} of ${task.total_count | 0}`}
        </Typography>
      </div>
      {timesheet.isDialogOpen && <AddTime />}
    </div>
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
    Low: "bg-slate-200 text-slate-900",
    Medium: "bg-warning/20 text-warning",
    High: "bg-orange-200 text-orange-900",
    Urgent: "bg-destructive/20 text-destructive",
  };
  return <Badge className={cn(priorityCss[priority])}>{priority}</Badge>;
};

const TaskStatus = ({ status }: { status: TaskData["status"] }) => {
  const statusCss = {
    Open: "bg-slate-200 text-slate-900",
    Working: "bg-warning/20 text-warning",
    "Pending Review": "bg-warning/20 text-warning",
    Overdue: "bg-destructive/20 text-destructive",
    Template: "bg-slate-200 text-slate-900",
    Completed: "bg-success/20 text-success",
    Cancelled: "bg-destructive/20 text-destructive",
  };
  return <Badge className={cn(statusCss[status])}>{status}</Badge>;
};

const HideColumn = ({ table }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-auto">
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
