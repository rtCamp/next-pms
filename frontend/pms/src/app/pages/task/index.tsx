/**
 * External dependencies.
 */
import { useCallback, useEffect, useState } from "react";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCoreRowModel, getSortedRowModel, useReactTable, ColumnSizingState } from "@tanstack/react-table";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import _ from "lodash";

/**
 * Internal dependencies.
 */
import AddTime from "@/app/components/addTime";
import ViewWrapper from "@/app/components/listview/ViewWrapper";
import { LoadMore } from "@/app/components/loadMore";
import { Typography } from "@/app/components/typography";
import { ToastAction } from "@/app/components/ui/toast";
import { useToast } from "@/app/components/ui/use-toast";
import { Footer } from "@/app/layout/root";
import {
  parseFrappeErrorMsg,
  createFalseValuedObject,
  getFormatedDate,
  getDateTimeForMultipleTimeZoneSupport,
} from "@/lib/utils";
import { RootState } from "@/store";
import { setStart, updateTaskData, setTaskData, setSelectedTask, setFilters } from "@/store/task";
import { SetAddTimeDialog, SetTimesheet } from "@/store/timesheet";
import { setViews, ViewData } from "@/store/view";
import { DocMetaProps } from "@/types";
import { ColumnsType, columnsToExcludeActionsInTablesType } from "@/types/task";
import { AddTask } from "./addTask";
import { getColumn } from "./columns";
import { FlatTable } from "./flatTable";
import { Header } from "./Header";
import { TaskLog } from "./taskLog";
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
  const [viewInfo, setViewInfo] = useState<ViewData>(viewData);

  const task = useSelector((state: RootState) => state.task);
  const user = useSelector((state: RootState) => state.user);
  const timesheet = useSelector((state: RootState) => state.timesheet);

  const dispatch = useDispatch();
  const { toast, remove } = useToast();

  const { call } = useFrappePostCall("next_pms.timesheet.doctype.pms_view_setting.pms_view_setting.update_view");
  const [hasViewUpdated, setHasViewUpdated] = useState(false);
  const [colSizing, setColSizing] = useState<ColumnSizingState>(viewData.columns ?? {});
  const [columnOrder, setColumnOrder] = useState<string[]>(viewData.rows ?? []);
  const [columnVisibility, setColumnVisibility] = useState(createFalseValuedObject(viewData.rows));

  // Table property management
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
  const updateColumnOrder = useCallback(
    (visibility: { [key: string]: boolean }) => {
      let newColumnOrder;
      if (Object.keys(visibility).length == 0) {
        newColumnOrder = columnOrder;
      } else {
        newColumnOrder = viewInfo.rows.filter((d) => visibility[d]).map((d) => d);
      }
      setColumnOrder(newColumnOrder!);
    },
    [columnOrder, viewInfo.rows]
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

  // call to fetch task list from DB ( single data source for flat and nested table)
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
      revalidateIfStale: false,
    }
  );

  useEffect(() => {
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
  }, [data, dispatch, error, task.start, toast]);

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

  // Task Log Management
  const openTaskLog = (taskName: string) => {
    dispatch(setSelectedTask({ task: taskName, isOpen: true }));
  };

  useEffect(() => {
    const updateViewData = {
      ...viewInfo,
      columns: { ...viewInfo.columns, ...colSizing },
      order_by: { field: task.orderColumn, order: task.order },
      filters: createFilter(task),
      rows: columnOrder,
    };
    if (!_.isEqual(updateViewData, viewInfo)) {
      setHasViewUpdated(true);
    } else {
      setHasViewUpdated(false);
    }
    setViewInfo(updateViewData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colSizing, columnOrder, task.orderColumn, task.order, task.search, task.selectedProject, task.selectedStatus]);

  // column definitions
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

  const columnsToExcludeActionsInTables: columnsToExcludeActionsInTablesType = ["liked", "timesheetAction"];

  const loadMore = () => {
    dispatch(setStart(task.start + 20));
  };
  useEffect(() => {
    if (hasViewUpdated) {
      remove();
      toast({
        description: "View has been updated.",
        action: (
          <ToastAction altText="Save" onClick={updateView}>
            Save Changes
          </ToastAction>
        ),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasViewUpdated, toast]);
  console.log(hasViewUpdated);
  return (
    <>
      <Header
        meta={meta}
        columnOrder={columnOrder}
        setColumnOrder={setColumnOrder}
        onColumnHide={handleColumnHide}
        view={viewData}
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

      <FlatTable
        table={table}
        columns={columns}
        columnsToExcludeActionsInTables={columnsToExcludeActionsInTables}
        task={task}
        isLoading={isLoading}
      />

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
      {task.isAddTaskDialogBoxOpen && <AddTask mutate={mutate} task={task} />}
    </>
  );
};
