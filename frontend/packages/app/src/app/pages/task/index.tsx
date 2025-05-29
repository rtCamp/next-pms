/**
 * External dependencies.
 */
import { useEffect, useReducer, useState } from "react";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { getUTCDateTime, getFormatedDate } from "@next-pms/design-system/date";
import { useToast } from "@next-pms/design-system/hooks";
import { getCoreRowModel, getSortedRowModel, useReactTable, ColumnSizingState } from "@tanstack/react-table";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import _ from "lodash";
/**
 * Internal dependencies.
 */
import AddTime from "@/app/components/add-time";
import ViewWrapper from "@/app/components/list-view/viewWrapper";
import { LIKED_TASK_KEY } from "@/lib/constant";
import { addAction, toggleLikedByForTask } from "@/lib/storage";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { RootState } from "@/store";
import { ViewData } from "@/store/view";
import { ColumnsType, columnsToExcludeActionsInTablesType } from "@/types/task";
import { AddTask } from "./components/addTask";
import { getColumn } from "./components/columns";
import { Header } from "./components/header";
import { Table } from "./components/table";
import { TaskLog } from "./components/taskLog";
import { initialState, reducer } from "./reducer";
import { createFilter } from "./utils";
import { initialState as timesheetInitialState, reducer as timesheetReducer } from "../timesheet/reducer";
import type { TaskTableProps } from "./components/types";

const Task = () => {
  const docType = "Task";
  return (
    <ViewWrapper docType={docType}>
      {({ viewData, meta }) => <TaskTable viewData={viewData} meta={meta.message} />}
    </ViewWrapper>
  );
};

export default Task;

const TaskTable = ({ viewData, meta }: TaskTableProps) => {
  const [task, taskDispatch] = useReducer(reducer, initialState);
  const [viewInfo, setViewInfo] = useState<ViewData>(viewData);

  const user = useSelector((state: RootState) => state.user);
  const [timesheet, timesheetDispatch] = useReducer(timesheetReducer, timesheetInitialState);
  const columnsToExcludeActionsInTables: columnsToExcludeActionsInTablesType = ["liked", "timesheetAction"];

  const dispatch = useDispatch();
  const { toast } = useToast();

  const [hasViewUpdated, setHasViewUpdated] = useState(false);
  const [colSizing, setColSizing] = useState<ColumnSizingState>(viewData.columns ?? {});
  const [columnOrder, setColumnOrder] = useState<string[]>(viewData.rows ?? []);

  const { call: toggleLikeCall } = useFrappePostCall("frappe.desk.like.toggle_like");

  useEffect(() => {
    taskDispatch({
      type: "SET_FILTERS",
      payload: {
        search: viewData.filters.search ?? "",
        selectedProject: viewData.filters.projects ?? [],
        selectedStatus: viewData.filters.status ?? ["Open", "Working"],
      },
    });
    setViewInfo(viewData);
    setColSizing(viewData.columns);
    setColumnOrder(viewData.rows);
    setHasViewUpdated(false);
  }, [dispatch, viewData, taskDispatch]);

  const handleColumnHide = (id: string) => {
    setColumnOrder((prev) => prev.filter((item) => item !== id));
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

  const handleAddTime = (taskName: string) => {
    const timesheetData = {
      name: "",
      parent: "",
      task: taskName,
      date: getFormatedDate(getUTCDateTime()),
      description: "",
      hours: 0,
      isUpdate: false,
      employee: user.employee,
    };
    timesheetDispatch({ type: "SET_TIMESHEET", payload: timesheetData });
    timesheetDispatch({ type: "SET_DIALOG_STATE", payload: true });
  };

  const { data, isLoading, error, mutate } = useFrappeGetCall(
    "next_pms.timesheet.api.task.get_task_list",
    {
      page_length: task.pageLength,
      start: task.start,
      projects: task.selectedProject,
      search: task.search,
      status: task.selectedStatus,
      fields: viewInfo?.rows,
    },
    undefined,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      revalidateOnMount: false,
    }
  );

  useEffect(() => {
    if (task.isNeedToFetchDataAfterUpdate) {
      mutate();
      taskDispatch({
        type: "SET_REFETCH_DATA",
        payload: false,
      });
    }
  }, [dispatch, mutate, task.isNeedToFetchDataAfterUpdate, taskDispatch]);

  useEffect(() => {
    if (data) {
      if (task.action === "SET") {
        taskDispatch({
          type: "SET_TASK_DATA",
          payload: data.message,
        });
      } else {
        taskDispatch({
          type: "UPDATE_TASK_DATA",
          payload: data.message,
        });
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
  }, [data, dispatch, error, viewInfo.filters.search, taskDispatch]);

  const handleLike = (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    const taskName = e.currentTarget.dataset.task;
    let likedBy = e.currentTarget.dataset.likedBy;
    let add: addAction = "Yes";
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
        toggleLikedByForTask(LIKED_TASK_KEY, taskName as string, user?.user, add);
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
      });
  };

  const openTaskLog = (taskName: string) => {
    taskDispatch({
      type: "SET_SELECTED_TASK",
      payload: { task: taskName, isOpen: true },
    });
  };

  useEffect(() => {
    const updateViewData = {
      ...viewData,
      columns: { ...viewData.columns, ...colSizing },
      order_by: { field: task.orderColumn, order: task.order },
      filters: createFilter(task),
      rows: columnOrder,
    };
    if (!_.isEqual(viewData, updateViewData)) {
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
    viewData,
  ]);

  const columns: ColumnsType = getColumn(
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

  const table = useReactTable({
    data: task.task,
    columns,
    enableColumnResizing: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: "onChange",
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColSizing,
    initialState: {
      sorting: [{ id: "liked", desc: false }],
    },
    state: {
      columnOrder,
      columnSizing: colSizing,
    },
  });

  const handleLoadMore = () => {
    if (task.isLoading) return;
    if (!task.hasMore) return;
    taskDispatch({
      type: "SET_START",
      payload: task.start + task.pageLength,
    });
  };

  return (
    <>
      <Header
        taskState={task}
        taskDispatch={taskDispatch}
        meta={meta}
        columnOrder={columnOrder}
        setColumnOrder={setColumnOrder}
        onColumnHide={handleColumnHide}
        view={viewInfo}
        stateUpdated={hasViewUpdated}
        setStateUpdated={setHasViewUpdated}
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
            taskDispatch({
              type: "SET_SELECTED_TASK",
              payload: data,
            });
          }}
        />
      )}

      <Table
        table={table}
        columns={columns}
        columnsToExcludeActionsInTables={columnsToExcludeActionsInTables}
        task={task}
        isLoading={isLoading}
        hasMore={task.hasMore}
        handleLoadMore={handleLoadMore}
      />
      {timesheet.isDialogOpen && (
        <AddTime
          employee={user.employee}
          task={timesheet.timesheet.task}
          initialDate={timesheet.timesheet.date}
          open={timesheet.isDialogOpen}
          onOpenChange={() => {
            timesheetDispatch({ type: "SET_DIALOG_STATE", payload: false });
          }}
          workingFrequency={user.workingFrequency}
          workingHours={user.workingHours}
        />
      )}
      {task.isAddTaskDialogBoxOpen && <AddTask dispatch={taskDispatch} mutate={mutate} task={task} />}
    </>
  );
};
