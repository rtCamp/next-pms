/**
 * External dependencies.
 */
import { useCallback, useEffect, useState } from "react";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { getUTCDateTime, getFormatedDate } from "@next-pms/design-system/date";
import { getCoreRowModel, getSortedRowModel, useReactTable, ColumnSizingState } from "@tanstack/react-table";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import _ from "lodash";

/**
 * Internal dependencies.
 */
import AddTime from "@/app/components/AddTime";
import ViewWrapper from "@/app/components/list-view/viewWrapper";
import { useToast } from "@/app/components/ui/use-toast";
import { LIKED_TASK_KEY } from "@/lib/constant";
import { addAction, toggleLikedByForTask } from "@/lib/storage";
import { parseFrappeErrorMsg, createFalseValuedObject } from "@/lib/utils";
import { RootState } from "@/store";
import { setStart, updateTaskData, setTaskData, setSelectedTask, setFilters, setReFetchData } from "@/store/task";
import { SetAddTimeDialog, SetTimesheet } from "@/store/timesheet";
import { ViewData } from "@/store/view";
import { DocMetaProps } from "@/types";
import { ColumnsType, columnsToExcludeActionsInTablesType } from "@/types/task";
import { AddTask } from "./addTask";
import { getColumn } from "./columns";
import { Header } from "./Header";
import { Table } from "./Table";
import { TaskLog } from "./TaskLog";
import { createFilter } from "./utils";

const Task = () => {
  const docType = "Task";
  return (
    <ViewWrapper docType={docType}>
      {({ viewData, meta }) => <TaskTable viewData={viewData} meta={meta.message} />}
    </ViewWrapper>
  );
};

export default Task;

interface TaskTableProps {
  viewData: ViewData;
  meta: DocMetaProps;
}

const TaskTable = ({ viewData, meta }: TaskTableProps) => {
  const task = useSelector((state: RootState) => state.task);
  const [viewInfo, setViewInfo] = useState<ViewData>(viewData);

  const user = useSelector((state: RootState) => state.user);
  const timesheet = useSelector((state: RootState) => state.timesheet);
  const columnsToExcludeActionsInTables: columnsToExcludeActionsInTablesType = ["liked", "timesheetAction"];

  const dispatch = useDispatch();
  const { toast } = useToast();

  const [hasViewUpdated, setHasViewUpdated] = useState(false);
  const [colSizing, setColSizing] = useState<ColumnSizingState>(viewData.columns ?? {});
  const [columnOrder, setColumnOrder] = useState<string[]>(viewData.rows ?? []);
  const [columnVisibility, setColumnVisibility] = useState(createFalseValuedObject(viewData.rows));

  const { call: toggleLikeCall } = useFrappePostCall("frappe.desk.like.toggle_like");

  useEffect(() => {
    dispatch(
      setFilters({
        search: viewData.filters.search ?? "",
        selectedProject: viewData.filters.projects ?? [],
        selectedStatus: viewData.filters.status ?? ["Open", "Working"],
      })
    );
    setViewInfo(viewData);
    setColSizing(viewData.columns);
    setColumnOrder(viewData.rows);
    setColumnVisibility(createFalseValuedObject(viewData.rows));
    setHasViewUpdated(false);
  }, [dispatch, viewData]);

  const handleColumnHide = (id: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  const updateColumnOrder = useCallback(
    (visibility: { [key: string]: boolean }) => {
      let newColumnOrder;
      if (Object.keys(visibility).length == 0) {
        newColumnOrder = columnOrder;
      } else {
        newColumnOrder = viewData.rows.filter((d) => visibility[d]).map((d) => d);
      }
      setColumnOrder(newColumnOrder!);
    },
    [columnOrder, viewData.rows]
  );

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnVisibility]);

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
    dispatch(SetTimesheet(timesheetData));
    dispatch(SetAddTimeDialog(true));
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
      dispatch(setReFetchData(false));
    }
  }, [dispatch, mutate, task.isNeedToFetchDataAfterUpdate]);

  useEffect(() => {
    if (data) {
      if (task.isNeedToFetchDataAfterUpdate) return;
      if (task.action === "SET") {
        dispatch(setTaskData(data.message));
      } else {
        dispatch(updateTaskData(data.message));
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
  }, [data, dispatch, error, viewInfo.filters.search]);

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
    dispatch(setSelectedTask({ task: taskName, isOpen: true }));
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

  const handleLoadMore = () => {
    if (task.isLoading) return;
    if (!task.hasMore) return;
    dispatch(setStart(task.start + task.pageLength));
  };

  return (
    <>
      <Header
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
            dispatch(setSelectedTask(data));
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
            dispatch(SetAddTimeDialog(false));
          }}
          workingFrequency={user.workingFrequency}
          workingHours={user.workingHours}
        />
      )}
      {task.isAddTaskDialogBoxOpen && <AddTask mutate={mutate} task={task} />}
    </>
  );
};
