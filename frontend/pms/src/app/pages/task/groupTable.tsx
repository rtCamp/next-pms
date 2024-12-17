import { Spinner } from "@/app/components/spinner";
import { Separator } from "@/app/components/ui/separator";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/app/components/ui/table";
import { TaskState } from "@/store/task";
import {
  NestedRowTableType,
  ProjectNestedColumnsType,
  columnsToExcludeActionsInTablesType,
} from "@/types/task";
import { flexRender } from "@tanstack/react-table";

import React from "react";

export const RowGroupedTable = ({
  table,
  columns,
  columnsToExcludeActionsInTables,
  task,
  isLoading,
}: {
  table: NestedRowTableType;
  columns: ProjectNestedColumnsType;
  columnsToExcludeActionsInTables: columnsToExcludeActionsInTablesType;
  task: TaskState;
  isLoading: boolean;
}) => {
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
                    className="group"
                    key={header.id}
                    {...{
                      onMouseDown: header.getResizeHandler(),
                      onTouchStart: header.getResizeHandler(),
                      style: {
                        userSelect: "none",
                        touchAction: "none",
                        width: header.getSize(),
                      },
                    }}
                  >
                    <div className="w-full h-full flex items-center justify-between group">
                      <div className="w-full">{flexRender(header.column.columnDef.header, header.getContext())}</div>
                      {!columnsToExcludeActionsInTables.includes(header.id) && (
                        <Separator
                          orientation="vertical"
                          className="group-hover:w-[3px]  cursor-col-resize"
                          {...{
                            onMouseDown: header.getResizeHandler(),
                            onTouchStart: header.getResizeHandler(),
                            style: {
                              userSelect: "none",
                              touchAction: "none",
                            },
                          }}
                        />
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
                  No results
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </>
  );
};
