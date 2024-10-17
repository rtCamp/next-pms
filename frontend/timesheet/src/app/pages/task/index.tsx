import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { TaskData, ProjectProps } from "@/types";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
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
  setSelectedTask,
} from "@/store/task";
import { AddTask } from "./addTask";
import { FlatTable } from "./flatTable";
import {
  cn,
  parseFrappeErrorMsg,
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
import { Columns2, Ellipsis, Filter, GripVertical, LucideProps, Plus, RotateCcw } from "lucide-react";
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
import {
  DropdownMenu,
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
  ColumnsType,
  ProjectNestedColumnsType,
  subjectSearchType,
  GroupByParamType,
  columnsToExcludeActionsInTablesType,
  MoreTableOptionsDropDownType,
  tableAttributePropsType,
} from "@/types/task";
import { TaskLog } from "./taskLog";
import { Footer, Header } from "@/app/layout/root";
import { LoadMore } from "@/app/components/loadMore";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { Checkbox } from "@/app/components/ui/checkbox";
import { columnMap, getTableProps, localStorageTaskDataMap } from "./helper";
import { LOCAL_STORAGE_TASK } from "@/lib/constant";
import { flatTableColumnDefinition, nestedTableColumnDefinition } from "./columns";

const Task = () => {
  const task = useSelector((state: RootState) => state.task);
  const user = useSelector((state: RootState) => state.user);
  const timesheet = useSelector((state: RootState) => state.timesheet);
  const tableprop = useMemo(() => {
    return getTableProps();
  }, []);
  const [tableAttributeProps, setTableAttributeProps] = useState<tableAttributePropsType>(tableprop);
  const [columnOrder, setColumnOrder] = useState<string[]>(tableprop.columnOrder);
  const { call } = useFrappePostCall("frappe.desk.like.toggle_like");
  // States for maintaining tables and filters
  const [expanded, setExpanded] = useState<ExpandedState>(true);
  // LocalStorage States
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    createFalseValuedObject(tableAttributeProps?.hideColumn ?? {})
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
      revalidateOnFocus: false,
    }
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
    }
    if (data) {
      if (task.start !== 0) {
        dispatch(updateTaskData(data.message));
        dispatch(updateProjectData());
      } else {
        dispatch(setTaskData(data.message));
        dispatch(setProjectData());
      }
      dispatch(setFetchAgain(false));
    }
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast({
        variant: "destructive",
        description: err,
      });
      dispatch(setFetchAgain(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, error, task.isFetchAgain]);

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
    [dispatch]
  );
  const handleGroupByChange = useCallback(
    (value: string | string[]) => {
      dispatch(setGroupBy(value as string[]));
    },
    [dispatch]
  );

  const openTaskLog = (taskName: string) => {
    dispatch(setSelectedTask({ task: taskName, isOpen: true }));
  };
  // column definitions
  const columnWidth = tableAttributeProps?.columnWidth;
  const columns: ColumnsType = flatTableColumnDefinition(columnWidth, openTaskLog, handleAddTime, user, handleLike);
  const nestedProjectColumns: ProjectNestedColumnsType = nestedTableColumnDefinition(
    columnWidth,
    openTaskLog,
    handleAddTime,
    user,
    handleLike
  );
  // Flat Table instance
  const table = useReactTable({
    data: task.task,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    columnResizeMode: "onChange",
    onColumnOrderChange: setColumnOrder,
    initialState: {
      sorting: [{ id: "liked", desc: false }],
    },
    state: {
      columnVisibility,
      columnOrder,
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
    onColumnOrderChange: setColumnOrder,
    columnResizeMode: "onChange",
    state: {
      expanded,
      columnOrder,
      columnVisibility: { ...columnVisibility, project_name: true },
    },
  });

  const columnsToExcludeActionsInTables: columnsToExcludeActionsInTablesType = ["liked", "timesheetAction"];

  // LocalStorage related functions and utilities

  useEffect(() => {
    // set localStorage Map for Task
    if (!localStorage.getItem(LOCAL_STORAGE_TASK)) {
      localStorage.setItem(LOCAL_STORAGE_TASK, JSON.stringify(localStorageTaskDataMap));
      setTableAttributeProps(localStorageTaskDataMap);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_TASK, JSON.stringify(tableAttributeProps));
  }, [tableAttributeProps]);

  useEffect(() => {
    const updatedTableProp = {
      ...tableprop,
      columnOrder: columnOrder,
    };
    setTableAttributeProps(updatedTableProp);
  }, [columnOrder]);

  // handle ad Task
  const handleAddTask = () => {
    dispatch(setAddTaskDialog(true));
  };
  // handle project search combo box
  const handleProjectSearch = (searchString: string) => {
    setProjectSearch(searchString);
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
      iconClass: "",
      handleClick: () => {
        // update All Sort,filter and columnWidth States when localStorage Changes (table config reset)
        setTableAttributeProps(localStorageTaskDataMap);
        setColumnVisibility({});
        table.setColumnSizing({});
        table.setColumnOrder(localStorageTaskDataMap.columnOrder);
        nestedProjectTable.setColumnSizing({});
        nestedProjectTable.setColumnSizing({});
        nestedProjectTable.setColumnOrder(localStorageTaskDataMap.columnOrder);
      },
      type: "normal",
    },
    // Example to add nested submenu in more options
    // {
    //   title: "Columns",
    //   icon: Columns2,
    //   iconClass: "",
    //   type: "nestedSubMenu",
    //   render: () => {
    //     return renderColumnFilterList(table, groupByParam, columnsToExcludeActionsInTables, setLocalStorageTaskState);
    //   },
    // },
  ];

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
        <div
          id="filters"
          className="flex gap-x-2 w-full overflow-hidden md:overflow-x-auto h-full items-center overflow-x-auto"
        >
          {/* Task Search Filter */}
          <DeBounceInput
            placeholder="Search Subject..."
            className="max-w-40 max-md:w-40 m-1 focus-visible:ring-offset-0 focus-visible:ring-0"
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
            <Button onClick={handleAddTask} className="px-3" title="Add task">
              <Plus /> <span className="border border-l-0 h-4/5 border-gray-500 mx-1"></span> Task
            </Button>
            <ColumnSelector
              table={table}
              onColumnHide={handleColumnHide}
              setColumnOrder={setColumnOrder}
              columnOrder={columnOrder}
              groupByParam={groupByParam}
            />
            {/* More options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="focus-visible:ring-0">
                  <Ellipsis />
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
          setTableAttributeProps={setTableAttributeProps}
          task={task}
          isLoading={isLoading}
        />
      ) : (
        <RowGroupedTable
          table={nestedProjectTable}
          columns={nestedProjectColumns}
          columnsToExcludeActionsInTables={columnsToExcludeActionsInTables}
          setTableAttributeProps={setTableAttributeProps}
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
      {task.isAddTaskDialogBoxOpen && <AddTask task={task} projects={projects} setProjectSearch={setProjectSearch} />}
    </>
  );
};

export const TaskPriority = ({ priority }: { priority: TaskData["priority"] }) => {
  const priorityCss = {
    Low: "bg-slate-200 text-slate-900 hover:bg-slate-200",
    Medium: "bg-warning/20 text-warning hover:bg-warning/20",
    High: "bg-orange-200 text-orange-900 hover:bg-orange-200",
    Urgent: "bg-destructive/20 text-destructive hover:bg-destructive/20",
  };
  return <Badge className={cn(priorityCss[priority])}>{priority}</Badge>;
};

const ColumnSelector = ({
  table,
  onColumnHide,
  setColumnOrder,
  columnOrder,
  groupByParam,
}: {
  table: T<TaskData>;
  onColumnHide: (id: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setColumnOrder: any;
  columnOrder: string[];
  groupByParam: string[];
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="focus-visible:ring-0">
          <Columns2 />
          <Typography variant="p">Columns</Typography>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="[&_div]:cursor-pointer max-h-96 overflow-y-auto">
        <DndProvider backend={HTML5Backend}>
          {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .sort((a, b) => columnOrder.indexOf(a.id) - columnOrder.indexOf(b.id))
            .map((column) => {
              if (groupByParam.length > 0 && column.id === "project_name") return null;
              return (
                <ColumnItem
                  key={column.id}
                  id={column.id}
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
}: {
  id: string;
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
      <div
        className="w-full flex justify-between items-center"
        onClick={() => {
          toggleVisibility(!getIsVisible());
          onColumnHide(id);
        }}
        style={{
          opacity: isDragging ? 0.5 : 1,
        }}
      >
        <span className="mr-1">{columnMap[id as keyof typeof columnMap]}</span>
        <GripVertical className="flex-shrink-0" />
      </div>
    </DropdownMenuItem>
  );
};

export default Task;
