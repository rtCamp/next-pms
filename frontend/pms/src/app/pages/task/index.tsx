/**
 * External dependencies.
 */
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import React from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { useDispatch, useSelector } from "react-redux";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  VisibilityState,
  getExpandedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  ExpandedState,
  Table as T,
} from "@tanstack/react-table";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { Columns2, Ellipsis, Filter, GripVertical, LucideProps, Plus, RotateCcw } from "lucide-react";

/**
 * Internal dependencies.
 */
import AddTime from "@/app/components/addTime";
import { ComboxBox } from "@/app/components/comboBox";
import { DeBounceInput } from "@/app/components/deBounceInput";
import { LoadMore } from "@/app/components/loadMore";
import { Typography } from "@/app/components/typography";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { useToast } from "@/app/components/ui/use-toast";
import { Footer, Header } from "@/app/layout/root";
import { LOCAL_STORAGE_TASK } from "@/lib/constant";
import { useQueryParamsState } from "@/lib/queryParam";
import {
  cn,
  parseFrappeErrorMsg,
  createFalseValuedObject,
  getFormatedDate,
  getDateTimeForMultipleTimeZoneSupport,
  checkIsMobile,
} from "@/lib/utils";
import { RootState } from "@/store";
import {
  setStart,
  setSelectedProject,
  setGroupBy,
  setAddTaskDialog,
  updateTaskData,
  setTaskData,
  updateProjectData,
  setProjectData,
  setSelectedTask,
} from "@/store/task";
import { SetAddTimeDialog, SetTimesheet } from "@/store/timesheet";
import { TaskData, ProjectProps } from "@/types";
import {
  ColumnsType,
  ProjectNestedColumnsType,
  subjectSearchType,
  GroupByParamType,
  columnsToExcludeActionsInTablesType,
} from "@/types/task";
import { AddTask } from "./addTask";
import { flatTableColumnDefinition, nestedTableColumnDefinition } from "./columns";
import { FlatTable } from "./flatTable";
import { RowGroupedTable } from "./groupTable";
import { columnMap, getTableProps, localStorageTaskDataMap } from "./helper";
import { TaskLog } from "./taskLog";

const Task = () => {
  const docType = "Task";
  return (
    <ViewWrapper docType={docType}>
      {({ viewData, meta }) => <TaskTable viewData={viewData} meta={meta.message} />}
    </ViewWrapper>
  );
};

export default Task;

export const TaskPriority = ({ priority }: { priority: TaskData["priority"] }) => {
  const priorityCss = {
    Low: "bg-slate-200 text-slate-900 hover:bg-slate-200",
    Medium: "bg-warning/20 text-warning hover:bg-warning/20",
    High: "bg-orange-200 text-orange-900 hover:bg-orange-200",
    Urgent: "bg-destructive/20 text-destructive hover:bg-destructive/20",
  };
  return <Badge className={cn(priorityCss[priority])}>{priority}</Badge>;
};

interface TaskTableProps {
  viewData: ViewData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta: any;
}

const TaskTable = ({ viewData, meta }: TaskTableProps) => {
  // Redux states
  const task = useSelector((state: RootState) => state.task);
  const user = useSelector((state: RootState) => state.user);
  const timesheet = useSelector((state: RootState) => state.timesheet);

  // Redux dispatch Object
  const dispatch = useDispatch();

  // Toast object
  const { toast } = useToast();

  // View management
  const [viewInfo, setViewInfo] = useState<ViewData>(viewData);
  const { call } = useFrappePostCall("next_pms.timesheet.doctype.pms_view_setting.pms_view_setting.update_view");
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [hasViewUpdated, setHasViewUpdated] = useState(false);
  const [colSizing, setColSizing] = useState<ColumnSizingState>(viewData.columns ?? {});
  const [columnOrder, setColumnOrder] = useState<string[]>(viewData.rows ?? []);
  const [isCreateViewOpen, setIsCreateViewOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState(createFalseValuedObject(viewData.rows));

  // Query params management
  const [subjectSearchParam, setSubjectSearchParam] = useQueryParamsState<subjectSearchType>("search", task.search);
  const [projectParam, setProjectParam] = useQueryParamsState<string[]>("project", task.selectedProject || []);
  const [groupByParam, setGroupByParam] = useQueryParamsState<GroupByParamType>("groupby", task.groupBy || []);
  const [statusParam, setStatusParam] = useQueryParamsState<string[]>("status", task.selectedStatus || []);

  // Dialog box management
  const [expanded, setExpanded] = useState<ExpandedState>(true);

  // Table property management
  const { call: toggleLikeCall } = useFrappePostCall("frappe.desk.like.toggle_like");

  // On View Update
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
      newColumnOrder = viewData?.rows.filter((d) => visibility[d]).map((d) => d);
    }
    setColumnOrder(newColumnOrder!);
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
  }, [columnVisibility]);

  const groupByData = [
    {
      label: "Projects",
      value: "project",
    },
  ];

  // Add-time management
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
      revalidateIfStale: false,
    }
  );
  useEffect(() => {
    projectSearchMutate();
  }, [projectSearch]);

  useEffect(() => {
    setGroupByParam(task.groupBy);
  }, [setGroupByParam, task.groupBy]);

  // call to fetch task list from DB ( single data source for flat and nested table)
  const { data, isLoading, error, mutate } = useFrappeGetCall(
    "next_pms.timesheet.api.task.get_task_list",
    {
      page_length: task.pageLength,
      start: task.start,
      projects: task.selectedProject,
      search: subjectSearchParam,
      status: statusParam,
      fields: viewInfo?.rows,
    },
    undefined,
    {
      revalidateIfStale: false,
    }
  );

  useEffect(() => {
    dispatch(setGroupBy(groupByParam));
  }, [groupByParam]);

  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, error]);

  // Handle Like
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
    toggleLikeCall(data)
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

  // Filter Mutation Functions
  const handleProjectChange = useCallback(
    (value: string | string[]) => {
      setProjectParam(value as string[]);
      dispatch(setSelectedProject(value as string[]));
    },
    [dispatch, setProjectParam]
  );
  const handleStatusChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      setStatusParam(normalizedFilters as TaskStatusType[]);
      dispatch(setSelectedStatus(normalizedFilters as TaskStatusType[]));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch]
  );

  // can be removed in the next itteration
  const handleGroupByChange = useCallback(
    (value: string | string[]) => {
      dispatch(setGroupBy(value as string[]));
    },
    [dispatch]
  );

  // Task Log Management
  const openTaskLog = (taskName: string) => {
    dispatch(setSelectedTask({ task: taskName, isOpen: true }));
  };

  // useEffect when changing View States

  useEffect(() => {
    dispatch(
      setFilters({
        search: viewData.filters.search ?? "",
        selectedProject: viewData.filters.projects ?? [],
        selectedStatus: viewData.filters.status ?? ["Open", "Working"],
        groupBy: viewData.filters.groupBy ?? [],
      })
    );
    setViewInfo(viewData);
    setColSizing(viewData.columns);
    setColumnOrder(viewData.rows);
    setColumnVisibility(createFalseValuedObject(viewData.rows));
    setHasViewUpdated(false);
  }, [viewData]);

  // useEffect to render UI
  useEffect(() => {
    setStatusParam(task.selectedStatus);
    setSubjectSearchParam(task.search);
    setProjectParam(task.selectedProject);
    setGroupByParam(task.groupBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.search, task.selectedProject, task.selectedStatus, task.groupBy]);

  useEffect(() => {
    const updateViewData = {
      ...viewInfo,
      columns: { ...viewInfo.columns, ...colSizing },
      order_by: { field: task.orderColumn, order: task.order },
      filters: createFilter(task),
      rows: columnOrder,
    };
    if (!_.isEqual(updateViewData, viewData)) {
      setHasViewUpdated(true);
    } else {
      setHasViewUpdated(false);
    }
    setViewInfo(updateViewData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    colSizing,
    columnOrder,
    task.orderColumn,
    task.order,
    task.search,
    task.selectedProject,
    task.selectedStatus,
    task.groupBy,
  ]);

  const handleSubjectSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const searchStr = e.target.value.trim();
      setSubjectSearchParam(searchStr);
      dispatch(setSearch(searchStr));
    },
    [dispatch, setSubjectSearchParam]
  );

  // column definitions
  const columns: ColumnsType = flatTableColumnDefinition(
    meta.fields,
    viewInfo?.rows,
    viewInfo?.columns,
    meta.title_field,
    meta.doctype,
    openTaskLog,
    handleAddTime,
    user,
    handleLike
  );
  const nestedProjectColumns: ProjectNestedColumnsType = nestedTableColumnDefinition(
    meta.fields,
    viewInfo?.rows,
    viewInfo?.columns,
    openTaskLog,
    handleAddTime,
    user,
    handleLike
  );
  // Flat Table instance
  const table = useReactTable({
    data: task.task,
    columns,
    enableColumnResizing: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    columnResizeMode: "onChange",
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColSizing,
    initialState: {
      sorting: [{ id: "liked", desc: false }],
    },
    state: {
      columnVisibility,
      columnOrder,
      columnSizing: colSizing,
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
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColSizing,
    columnResizeMode: "onChange",
    state: {
      expanded,
      columnOrder,
      columnVisibility: { ...columnVisibility, project_name: true },
      columnSizing: colSizing,
    },
  });

  const columnsToExcludeActionsInTables: columnsToExcludeActionsInTablesType = ["liked", "timesheetAction"];

  // handle add Task
  const handleAddTask = () => {
    dispatch(setAddTaskDialog(true));
  };
  // handle project search combo box
  const handleProjectSearch = (searchString: string) => {
    setProjectSearch(searchString);
  };

  const loadMore = () => {
    dispatch(setStart(task.start + 20));
  };
  return (
    <>
      {/* filters and combo boxes */}
      <Header className="gap-x-3 flex items-center overflow-x-auto">
        <section id="filter-section" className="flex gap-x-2 items-center">
          {/* Task Search Filter */}
          <DeBounceInput
            placeholder="Search Subject..."
            deBounceValue={300}
            value={subjectSearchParam}
            callback={handleSubjectSearchChange}
          />

          {/* Projects comboBox */}
          <ComboxBox
            label="Projects"
            value={projectParam}
            isMulti
            showSelected={false}
            leftIcon={<Filter className={cn("h-4 w-4", projectParam.length != 0 && "fill-primary")} />}
            rightIcon={projectParam.length > 0 && <Badge className="px-1.5">{projectParam.length}</Badge>}
            data={projects?.message.map((item: ProjectProps) => ({
              label: item.project_name,
              value: item.name,
            }))}
            className="text-primary border-dashed gap-x-2 font-normal w-fit"
            onSelect={handleProjectChange}
            onSearch={handleProjectSearch}
          />

          {/* Status */}
          <ComboxBox
            label="Status"
            value={statusParam}
            leftIcon={<Filter className={cn("h-4 w-4", statusParam.length != 0 && "fill-primary")} />}
            rightIcon={statusParam.length > 0 && <Badge className="px-1.5">{statusParam.length}</Badge>}
            data={status}
            className="text-primary border-dashed gap-x-2 font-normal w-fit"
            onSelect={handleStatusChange}
            isMulti
            shouldFilter
          />

          {/* GroupBy */}
          {/* <ComboxBox
            label="GroupBy"
            value={groupByParam}
            showSelected={false}
            leftIcon={<Filter className={cn("h-4 w-4", task.groupBy.length != 0 && "fill-primary")} />}
            rightIcon={task.groupBy.length > 0 && <Badge className="px-1.5">{task.groupBy.length}</Badge>}
            data={groupByData}
            className="text-primary border-dashed gap-x-2 font-normal w-fit"
            onSelect={handleGroupByChange}
          /> */}
        </section>
        {/* More Tools */}
        <div className="flex gap-x-2">
          {hasViewUpdated &&
            (user.user == viewData?.owner || (viewData?.public == true && user.user == "Administrator")) && (
              <Button onClick={updateView} variant="ghost">
                Save Changes
              </Button>
            )}
          <div className="ml-auto flex gap-x-2 ">
            <Button onClick={handleAddTask} className="px-3" title="Add task">
              <Plus /> Task
            </Button>

            <ColumnSelector
              onColumnHide={handleColumnHide}
              fieldMeta={meta?.fields}
              setColumnOrder={setColumnOrder}
              columnOrder={viewInfo.rows}
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
        </div>
      </Header>
      {/* Action Items */}
      {canExport("Task") && (
        <Export
          isOpen={isExportOpen}
          setIsOpen={setIsExportOpen}
          doctype="Task"
          pageLength={task.pageLength}
          totalCount={task.total_count}
          orderBy={`modified  desc`}
          fields={viewData?.rows.reduce((acc, d) => {
            if (d !== "project_name") {
              const m = meta.fields.find((field: { fieldname: string }) => field.fieldname === d);
              acc[d] = m?.label ?? d;
            }
            return acc;
          }, {})}
        />
      )}
      <CreateView
        isOpen={isCreateViewOpen}
        setIsOpen={setIsCreateViewOpen}
        dt="Task"
        filters={createFilter(task)}
        orderBy={{ field: task.orderColumn, order: task.order }}
        route="task"
        isDefault={false}
        isPublic={false}
        columns={viewData.columns}
        rows={[...viewData.rows]}
      />
      {/* Task logs */}
      {task.isTaskLogDialogBoxOpen && (
        <TaskLog
          isOpen={task.isTaskLogDialogBoxOpen}
          task={task.selectedTask}
          onOpenChange={() => {
            const data = {
              isOpen: false,
              task: "",
            };
            dispatch(setSelectedTask(data));
          }}
        />
      )}
      {/* tables */}
      {groupByParam.length === 0 && task.groupBy ? (
        <FlatTable
          table={table}
          columns={columns}
          columnsToExcludeActionsInTables={columnsToExcludeActionsInTables}
          task={task}
          isLoading={isLoading}
        />
      ) : (
        <RowGroupedTable
          table={nestedProjectTable}
          columns={nestedProjectColumns}
          columnsToExcludeActionsInTables={columnsToExcludeActionsInTables}
          task={task}
          isLoading={isLoading}
        />
      )}
      {/* footer */}
      <Footer className="bg-blue-500">
        <div className="flex justify-between items-center">
          <LoadMore
            className="float-left"
            variant="outline"
            onClick={loadMore}
            disabled={task.task.length === task.total_count || isLoading}
          />

          <Typography variant="p" className="lg:px-5 font-semibold">
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
      {task.isAddTaskDialogBoxOpen && (
        <AddTask mutate={mutate} task={task} projects={projects} setProjectSearch={setProjectSearch} />
      )}
    </>
  );
};

// Action Button Menu
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
        {canExport("Task") && (
          <DropdownMenuItem onClick={openExportDialog}>
            <Download />
            <Typography variant="p">Export </Typography>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
