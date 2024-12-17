import { Spinner } from "@/app/components/spinner";
import { Separator } from "@/app/components/ui/separator";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/app/components/ui/table";
import { TaskState } from "@/store/task";
import {
  FlatTableType,
  ColumnsType,
  columnsToExcludeActionsInTablesType,
} from "@/types/task";
import { flexRender } from "@tanstack/react-table";

export const FlatTable = ({
  table,
  columns,
  columnsToExcludeActionsInTables,
  task,
  isLoading,
}: {
  table: FlatTableType;
  columns: ColumnsType;
  columnsToExcludeActionsInTables: columnsToExcludeActionsInTablesType;
  task: TaskState;
  isLoading: boolean;
}) => {
  return (
    <>
      {isLoading && task.task.length == 0 ? (
        <Spinner isFull />
      ) : (
        <Table className="[&_td]:px-4 [&_th]:px-4 [&_th]:py-2 table-fixed w-full relative">
          <TableHeader className=" border-t-0 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
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
                      style={{
                        width: header.getSize(),
                        position: "relative",
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
                    <TableCell className="overflow-hidden" key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
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
