import { Spinner } from "@/app/components/spinner";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/app/components/ui/table";
import { useToast } from "@/app/components/ui/use-toast";
import { parseFrappeErrorMsg, cn } from "@/lib/utils";
import { TaskState, updateTaskData, setTaskData, setSelectedTask } from "@/store/task";
import { setFetchAgain } from "@/store/team";
import {
  FlatTableType,
  ColumnsType,
  columnsToExcludeActionsInTablesType,
  setLocalStorageTaskStateType,
  subjectSearchType,
  setFlatTaskMutateCallType,
} from "@/types/task";
import { flexRender } from "@tanstack/react-table";
import { useFrappeGetCall } from "frappe-react-sdk";
import { GripVertical } from "lucide-react";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

export const FlatTable = ({
  table,
  columns,
  columnsToExcludeActionsInTables,
  setLocalStorageTaskState,
  task,
  subjectSearch,
  setMutateCall,
}: {
  table: FlatTableType;
  columns: ColumnsType;
  columnsToExcludeActionsInTables: columnsToExcludeActionsInTablesType;
  setLocalStorageTaskState: setLocalStorageTaskStateType;
  task: TaskState;
  subjectSearch: subjectSearchType;
  setMutateCall: setFlatTaskMutateCallType;
}) => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  let resizeObserver: ResizeObserver;
  const { data, isLoading, error, mutate } = useFrappeGetCall("frappe_pms.timesheet.api.task.get_task_list", {
    page_length: 20,
    start: task.start,
    projects: task.selectedProject,
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
      {isLoading && task.task.length == 0 ? (
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
                          entries.forEach(() => {
                            setLocalStorageTaskState((prev) => {
                              return {
                                ...prev,
                                columnWidth: { ...prev.columnWidth, [header.id]: header.getSize() },
                              };
                            });
                          });
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
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => {
                    const data = {
                      task: row.original.name,
                      isOpen: true,
                    };
                    dispatch(setSelectedTask(data));
                    console.log(data);
                  }}
                >
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
