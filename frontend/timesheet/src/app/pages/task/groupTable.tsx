import { Spinner } from "@/app/components/spinner";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/app/components/ui/table";
import { TaskState, setSelectedTask } from "@/store/task";
import {
  NestedRowTableType,
  ProjectNestedColumnsType,
  columnsToExcludeActionsInTablesType,
  setLocalStorageTaskStateType,
} from "@/types/task";
import { flexRender } from "@tanstack/react-table";
import { GripVertical } from "lucide-react";
import React from "react";
import { useDispatch } from "react-redux";

export const RowGroupedTable = ({
  table,
  columns,
  columnsToExcludeActionsInTables,
  setLocalStorageTaskState,
  task,
  isLoading,
}: {
  table: NestedRowTableType;
  columns: ProjectNestedColumnsType;
  columnsToExcludeActionsInTables: columnsToExcludeActionsInTablesType;
  setLocalStorageTaskState: setLocalStorageTaskStateType;
  task: TaskState;
  isLoading: boolean;
}) => {
  const dispatch = useDispatch();
  let resizeObserver: ResizeObserver;
  return (
    <>
      {isLoading && task.project.length == 0 ? (
        <Spinner isFull />
      ) : (
        <Table className="[&_td]:px-4 [&_th]:px-4 [&_th]:py-4 table-fixed w-full relative">
          <TableHeader className="[&_th]:h-10 border-t-0 sticky top-0 z-10">
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
                      data-state={row.depth !== 0 && row.getIsSelected() ? "selected" : ""}
                      onClick={() => {
                        if (row.depth !== 0) {
                          const data = {
                            task: row.original.name,
                            isOpen: true,
                          };
                          dispatch(setSelectedTask(data));
                        }
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
