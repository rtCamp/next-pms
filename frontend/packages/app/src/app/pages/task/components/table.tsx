/**
 * External dependencies.
 */
import { mergeClassNames } from "@next-pms/design-system";
import {
  Spinner,
  Separator,
  Skeleton,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table as RootTable,
  Button,
} from "@next-pms/design-system/components";
import { useInfiniteScroll } from "@next-pms/hooks";
import { flexRender } from "@tanstack/react-table";
import { LockKeyhole, LockOpen } from "lucide-react";

/**
 * Internal dependencies.
 */
import type { ColumnsType, columnsToExcludeActionsInTablesType, TaskTableType } from "@/types/task";
import type { TaskState } from "../types";

export const Table = ({
  table,
  columns,
  columnsToExcludeActionsInTables,
  task,
  isLoading,
  hasMore,
  handleLoadMore,
}: {
  table: TaskTableType;
  columns: ColumnsType;
  columnsToExcludeActionsInTables: columnsToExcludeActionsInTablesType;
  task: TaskState;
  isLoading: boolean;
  hasMore: boolean;
  handleLoadMore: () => void;
}) => {
  const cellRef = useInfiniteScroll({
    isLoading: isLoading,
    hasMore: hasMore,
    next: handleLoadMore,
  });

  return (
    <>
      {isLoading && task.task.length == 0 ? (
        <Spinner isFull />
      ) : (
        <RootTable className="[&_td]:px-4 [&_th]:px-4 [&_th]:py-2 table-fixed w-full relative ">
          <TableHeader className=" border-t-0 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const column = header.column;
                  const columnId = column.id;
                  const isPinned = column.getIsPinned() === "left";
                  const leftPosition = isPinned ? column.getStart("left") : undefined;
                  return (
                    <TableHead
                      className={mergeClassNames("group", isPinned && "sticky z-10 bg-slate-200 dark:bg-gray-900")}
                      key={header.id}
                      style={{
                        userSelect: "none",
                        touchAction: "none",
                        width: header.getSize(),
                        left: leftPosition,
                        position: isPinned ? "sticky" : "relative",
                        zIndex: isPinned ? 10 : undefined,
                      }}
                      {...{
                        onMouseDown: header.getResizeHandler(),
                        onTouchStart: header.getResizeHandler(),
                      }}
                    >
                      <div className="w-full h-full flex items-center justify-between group gap-2">
                        {!columnsToExcludeActionsInTables.includes(header.id) && (
                          <Button
                            variant="ghost"
                            title={isPinned ? "Unpin Column" : "Pin Column"}
                            className="cursor-pointer outline-none p-1 py-2 h-5 hover:bg-transparent shrink-0"
                            onClick={() => {
                              if (isPinned) {
                                table.getColumn(columnId)?.pin(false);
                              } else {
                                table.getColumn(columnId)?.pin("left");
                              }
                            }}
                          >
                            {isPinned ? <LockKeyhole className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
                          </Button>
                        )}
                        <div className="w-full dark:group-hover:!text-white truncate">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </div>
                        {!columnsToExcludeActionsInTables.includes(header.id) && (
                          <Separator
                            orientation="vertical"
                            className={mergeClassNames(
                              "group-hover:w-[3px] dark:bg-primary cursor-col-resize shrink-0",
                              isPinned && "bg-slate-300"
                            )}
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
              table.getRowModel().rows.map((row) => {
                return (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell, cellIndex) => {
                      const isPinned = cell.column.getIsPinned() === "left";
                      const isFirstUnpinnedCell =
                        !isPinned &&
                        cellIndex === row.getVisibleCells().findIndex((c) => c.column.getIsPinned() !== "left");
                      const needToAddRef = task.hasMore && isFirstUnpinnedCell;
                      return (
                        <TableCell
                          ref={needToAddRef ? cellRef : null}
                          className={mergeClassNames(
                            "overflow-hidden",
                            isPinned && "sticky z-1 bg-slate-100 dark:bg-gray-900"
                          )}
                          style={{
                            width: cell.column.getSize(),
                            minWidth: cell.column.columnDef.minSize,
                            left: isPinned ? cell.column.getStart("left") : undefined,
                            zIndex: isPinned ? 1 : undefined,
                          }}
                          key={cell.id}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results
                </TableCell>
              </TableRow>
            )}
            {hasMore && (
              <TableRow className="w-full overflow-hidden">
                <TableCell colSpan={columns.length} className="text-center p-0">
                  <Skeleton className="h-10 w-full" />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </RootTable>
      )}
    </>
  );
};
