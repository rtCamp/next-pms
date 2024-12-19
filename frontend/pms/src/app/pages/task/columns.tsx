/**
 * External dependencies.
 */
import React, { ReactNode } from "react";
import { ChevronDown, ChevronUp, Clock, Heart } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
/**
 * Internal dependencies.
 */
import { TaskData } from "@/types";
import { cn, isLiked, floatToTime } from "../../../lib/utils";
import { UserState } from "../../../store/user";
import { ColumnsType, ProjectNestedColumnsType } from "../../../types/task";
import { Typography } from "../../components/typography";
import { TaskStatus } from "./taskStatus";
import { TaskPriority } from "./index";
import { DataCell } from "@/app/components/listview/DataCell";

export type columnWidthType = {
  subject: string;
  due_date: string;
  project_name: string;
  status: string;
  priority: string;
  expected_time: string;
  actual_time: string;
};
export type openTaskLogType = (taskName: string) => void;
export type handleAddTimeType = (taskName: string) => void;
export type handleLikeType = (e: React.MouseEvent<SVGSVGElement>) => void;

export const flatTableColumnDefinition = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fieldMeta: Array<any>,
  fieldInfo: Array<string>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columnInfo: any,
  title_field: string,
  docType: string,
  openTaskLog: openTaskLogType,
  handleAddTime: handleAddTimeType,
  user: UserState,
  handleLike: handleLikeType
): ColumnsType => {
  const columns: ColumnsType = [];
  const ProjectNameColumn: ColumnDef<TaskData> = {
    accessorKey: "project_name",
    size: columnInfo["project_name"] ?? 150,
    header: ({ column }) => {
      return (
        <div
          className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer w-full "
          title={column.id}
        >
          <p className="truncate">Project Name</p>
        </div>
      );
    },
    cell: ({ row }) => {
      return (
        <Typography
          title={String(row.original.project_name ?? "")}
          variant="p"
          className="max-w-sm py-1 truncate cursor-pointer"
        >
          {row.original.project_name}
        </Typography>
      );
    },
  };
  columns.push(ProjectNameColumn);
  fieldInfo.forEach((f) => {
    const meta = fieldMeta.find((field) => field.fieldname === f);
    if (!meta) return;
    const col = {
      accessorKey: meta.fieldname,
      size: columnInfo[meta.fieldname] ?? 150,
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer w-full "
            title={column.id}
          >
            <p className="truncate" id={column.id}>
              {meta.label}
            </p>
          </div>
        );
      },
      cell: ({ getValue, row }) => {
        const value = getValue() as string;

        if (meta.fieldname === "subject") {
          return (
            <Typography
              onClick={() => {
                openTaskLog(row.original.name);
              }}
              title={String(value ?? "")}
              variant="p"
              className="max-w-sm py-1 truncate cursor-pointer hover:underline"
            >
              {value}
            </Typography>
          );
        }
        if (meta.fieldname === "status") {
          return <TaskStatus status={row.original.status} />;
        }
        if (meta.fieldname === "priority") {
          return <TaskPriority priority={row.original.priority} />;
        }
        if (meta.fieldname === "expected_time") {
          return (
            <Typography
              title={String(value ?? "")}
              variant="p"
              className="max-w-sm py-1 truncate cursor-pointer text-center"
            >
              {floatToTime(Number(value))}
            </Typography>
          );
        }
        if (meta.fieldname === "actual_time") {
          return (
            <Typography
              title={String(value ?? "")}
              variant="p"
              className="max-w-sm py-1 truncate cursor-pointer text-center"
            >
              {floatToTime(Number(value))}
            </Typography>
          );
        }
        return <DataCell meta={meta} title_field={title_field} docType={docType} value={value} row={row} />;
      },
    };
    columns.push(col as ColumnDef<TaskData>);
  });
  const timesheetActionColumns: ColumnDef<TaskData>[] = [
    {
      accessorKey: "timesheetAction",
      header: "",
      enableHiding: false,
      size: 60, // Default size
      minSize: 60, // Minimum size
      maxSize: 60, // Maximum size
      cell: ({ row }) => {
        return (
          <div title="Add Timesheet" className="w-full flex justify-center items-center">
            <Clock
              className={"w-4 h-4 hover:cursor-pointer hover:text-blue-600"}
              onClick={() => {
                handleAddTime(row.original.name);
              }}
            />
          </div>
        );
      },
    },
    {
      accessorKey: "liked",
      header: "",
      enableHiding: false,
      size: 50, // Default size
      minSize: 50, // Minimum size
      maxSize: 50, // Maximum size
      cell: ({ row }) => {
        return (
          <span title="Like">
            <Heart
              className={cn(
                "w-4 h-4 hover:cursor-pointer",
                isLiked(row.original._liked_by, user.user) && "fill-red-600"
              )}
              data-task={row.original.name}
              data-liked-by={row.original._liked_by}
              onClick={handleLike}
            />
          </span>
        );
      },
    },
  ];
  columns.push(...timesheetActionColumns);
  return columns;
};

export const nestedTableColumnDefinition = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fieldMeta: Array<any>,
  fieldInfo: Array<string>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columnInfo: any,
  openTaskLog: openTaskLogType,
  handleAddTime: handleAddTimeType,
  user: UserState,
  handleLike: handleLikeType
): ProjectNestedColumnsType => {
  const columns: ProjectNestedColumnsType = [];
  const ProjectNameColumn = {
    accessorKey: "project_name",
    size: columnInfo["project_name"] ?? 150,
    enableHiding: false,
    header: ({ column }) => {
      return (
        <div
          className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer w-full "
          title={column.id}
        >
          <p className="truncate">Project Name</p>
        </div>
      );
    },
    cell: ({ row, getValue }) => {
      if (row.depth !== 0) return null;
      return (
        <>
          <div
            title={`${row.getIsExpanded() ? "Collapse" : "Expand"}`}
            onClick={() => {
              row.toggleExpanded();
            }}
            className="flex gap-1 cursor-pointer py-1 items-center "
          >
            {getValue() ? (
              row.getIsExpanded() ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )
            ) : null}
            <div className="truncate w-4/5">{getValue() as ReactNode}</div>
          </div>
        </>
      );
    },
  };
  columns.push(ProjectNameColumn);
  // handling all other columns
  fieldInfo.forEach((f) => {
    const meta = fieldMeta.find((field) => field.fieldname === f);
    if (!meta) return;
    const col = {
      accessorKey: meta.fieldname,
      size: columnInfo[meta.fieldname] ?? 150,
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer w-full "
            title={column.id}
          >
            <p className="truncate" id={column.id}>
              {meta.label}
            </p>
          </div>
        );
      },
      cell: ({ getValue, row }) => {
        const value = getValue() as string;
        // if (!value) return <Empty />;
        if (meta.fieldname === "subject") {
          return (
            <Typography
              onClick={() => {
                openTaskLog(row.original.name);
              }}
              title={String(value ?? "")}
              variant="p"
              className="max-w-sm py-1 truncate cursor-pointer hover:underline"
            >
              {value}
            </Typography>
          );
        }
        if (meta.fieldname === "status") {
          return <TaskStatus status={row.original.status} />;
        }
        if (meta.fieldname === "priority") {
          return <TaskPriority priority={row.original.priority} />;
        }
        if (meta.fieldname === "expected_time") {
          return (
            <Typography
              title={String(value ?? "")}
              variant="p"
              className="max-w-sm py-1 truncate cursor-pointer text-center"
            >
              {floatToTime(Number(value))}
            </Typography>
          );
        }
        if (meta.fieldname === "actual_time") {
          return (
            <Typography
              title={String(value ?? "")}
              variant="p"
              className="max-w-sm py-1 truncate cursor-pointer text-center"
            >
              {floatToTime(Number(value))}
            </Typography>
          );
        }
        return (
          <Typography title={String(value ?? "")} variant="p" className="max-w-sm py-1 truncate cursor-pointer">
            {value}
          </Typography>
        );
      },
    };
    columns.push(col);
  });
  // Action Columns
  const timesheetActionColumns = [
    {
      accessorKey: "timesheetAction",
      header: "",
      enableHiding: false,
      size: 60, // Default size
      minSize: 60, // Minimum size
      maxSize: 60, // Maximum size
      cell: ({ row }) => {
        return (
          row.depth !== 0 && (
            <div title="Add Timesheet" className="w-full flex justify-center items-center">
              <Clock
                className={"w-4 h-4 hover:cursor-pointer hover:text-blue-600"}
                onClick={() => {
                  handleAddTime(row.original.name);
                }}
              />
            </div>
          )
        );
      },
    },
    {
      accessorKey: "liked",
      header: "",
      enableHiding: false,
      size: 50, // Default size
      minSize: 50, // Minimum size
      maxSize: 50, // Maximum size
      cell: ({ row }) => {
        return (
          row.depth !== 0 && (
            <span title="Like">
              <Heart
                className={cn(
                  "w-4 h-4 hover:cursor-pointer",
                  isLiked(row.original._liked_by, user.user) && "fill-red-600"
                )}
                data-task={row.original.name}
                data-liked-by={row.original._liked_by}
                onClick={handleLike}
              />
            </span>
          )
        );
      },
    },
  ];
  columns.push(...timesheetActionColumns);
  return columns;
};
