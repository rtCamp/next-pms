import { Spinner } from "@/app/components/spinner";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/app/components/ui/table";
import { useToast } from "@/app/components/ui/use-toast";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { TaskState, setProjectFetchAgain, updateProjectData, setProjectData } from "@/store/task";
import {
  NestedRowTableType,
  ProjectNestedColumnsType,
  columnsToExcludeActionsInTablesType,
  setLocalStorageTaskStateType,
  subjectSearchType,
  setNestedProjectMutateCallType,
} from "@/types/task";
import { flexRender } from "@tanstack/react-table";
import { useFrappeGetCall } from "frappe-react-sdk";
import { GripVertical } from "lucide-react";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";

export const RowGroupedTable = ({
  table,
  columns,
  columnsToExcludeActionsInTables,
  setLocalStorageTaskState,
  task,
  subjectSearch,
  setMutateCall,
}: {
  table: NestedRowTableType;
  columns: ProjectNestedColumnsType;
  columnsToExcludeActionsInTables: columnsToExcludeActionsInTablesType;
  setLocalStorageTaskState: setLocalStorageTaskStateType;
  task: TaskState;
  subjectSearch: subjectSearchType;
  setMutateCall: setNestedProjectMutateCallType;
}) => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  let resizeObserver: ResizeObserver;
  //nested project task call
  const {
    data: nestedProjectData,
    isLoading: nestedProjectIsLoading,
    error: nestedProjectError,
    mutate: nestedProjectMutate,
  } = useFrappeGetCall("frappe_pms.timesheet.api.task.get_task_list_by_project", {
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
      {nestedProjectIsLoading && task.project.length == 0 ? (
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
