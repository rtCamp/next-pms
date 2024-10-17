import React, { ReactNode } from "react";
import { ColumnsType, ProjectNestedColumnsType } from "../../../types/task";
import { columnMap } from "./helper";
import { Typography } from "../../components/typography";
import { TaskStatus } from "./taskStatus";
import { TaskPriority } from "./index";
import { ChevronDown, ChevronUp, Clock, Heart } from "lucide-react";
import { cn, isLiked, floatToTime } from "../../../lib/utils";
import { UserState } from "../../../store/user";
import { TaskData } from "@/types";

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
  columnWidth: columnWidthType,
  openTaskLog: openTaskLogType,
  handleAddTime: handleAddTimeType,
  user: UserState,
  handleLike: handleLikeType
): ColumnsType => {
  const columns: ColumnsType = [
    {
      accessorKey: "project_name",
      size: Number(columnWidth["project_name"] ?? "150"),
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer w-full "
            title={column.id}
          >
            <p className="truncate">{columnMap["project_name"]}</p>
          </div>
        );
      },
      cell: ({ row }) => {
        return (
          <Typography
            title={String(row.original.project_name ?? "")}
            variant="p"
            className="max-w-sm truncate cursor-pointer"
          >
            {row.original.project_name}
          </Typography>
        );
      },
    },
    {
      accessorKey: "subject",
      size: Number(columnWidth["subject"] ?? "150"),
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer w-full"
            title={column.id}
          >
            <p className="truncate">{columnMap["subject"]}</p>
          </div>
        );
      },
      cell: ({ row }) => {
        return (
          <Typography
            variant="p"
            title={row.original.subject}
            className="max-w-sm truncate cursor-pointer"
            onClick={() => {
              openTaskLog(row.original.name);
            }}
          >
            {row.original.subject}
          </Typography>
        );
      },
    },
    {
      accessorKey: "due_date",
      size: Number(columnWidth["due_date"] ?? "150"),
      header: () => {
        return (
          <div className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer">
            <p className="truncate">{columnMap["due_date"]}</p>
          </div>
        );
      },
      cell: ({ getValue }) => {
        return (
          <Typography variant="p" className="truncate w-4/5">
            {getValue() as ReactNode}
          </Typography>
        );
      },
    },
    {
      accessorKey: "status",
      size: Number(columnWidth["status"] ?? "150"),

      header: () => {
        return (
          <div className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer">
            <p className="truncate">{columnMap["status"]}</p>
          </div>
        );
      },
      cell: ({ row }) => {
        return <TaskStatus status={row.original.status} />;
      },
    },
    {
      accessorKey: "priority",

      size: Number(columnWidth["priority"] ?? "150"),
      header: () => {
        return (
          <div className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer">
            <p className="truncate">Priority</p>
          </div>
        );
      },
      cell: ({ row }) => {
        return <TaskPriority priority={row.original.priority} />;
      },
    },
    {
      accessorKey: "expected_time",
      size: Number(columnWidth["expected_time"] ?? "150"),
      header: () => {
        return (
          <div className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer">
            <p className="truncate">{columnMap["expected_time"]}</p>
          </div>
        );
      },
      cell: ({ row }) => {
        return (
          <Typography variant="p" className="text-center truncate">
            {floatToTime(row.original.expected_time)}
          </Typography>
        );
      },
    },
    {
      accessorKey: "actual_time",
      size: Number(columnWidth["actual_time"] ?? "150"),
      header: () => {
        return (
          <div className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer">
            <p className="truncate">{columnMap["actual_time"]}</p>
          </div>
        );
      },
      cell: ({ row }) => {
        return (
          <Typography variant="p" className="text-center truncate">
            {floatToTime(row.original.actual_time)}
          </Typography>
        );
      },
    },
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
  return columns;
};

export const nestedTableColumnDefinition = (
  columnWidth: columnWidthType,
  openTaskLog: openTaskLogType,
  handleAddTime: handleAddTimeType,
  user: UserState,
  handleLike: handleLikeType
): ProjectNestedColumnsType => {
  const column: ProjectNestedColumnsType = [
    {
      accessorKey: "project_name",
      size: Number(columnWidth["project_name"] ?? "150"),
      enableHiding: false,
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer w-full "
            title={column.id}
          >
            <p className="truncate">{columnMap["project_name"]}</p>
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
              className="flex gap-1 cursor-pointer items-center "
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
    },
    {
      accessorKey: "subject",
      size: Number(columnWidth["subject"] ?? "150"),
      header: ({ column }) => {
        return (
          <div
            className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer w-full"
            title={column.id}
          >
            <p className="truncate">{columnMap["subject"]}</p>
          </div>
        );
      },
      cell: ({ getValue, row }) => {
        return (
          <Typography
            variant="p"
            title={String(getValue())}
            className="truncate cursor-pointer"
            onClick={() => {
              openTaskLog(row.original.name);
            }}
          >
            {getValue() as ReactNode}
          </Typography>
        );
      },
    },
    {
      accessorKey: "due_date",
      size: Number(columnWidth["due_date"] ?? "150"),
      header: () => {
        return (
          <div className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer">
            <div className="truncate w-4/5">{columnMap["due_date"]}</div>
          </div>
        );
      },
      cell: ({ getValue }) => {
        return (
          <Typography variant="p" className="truncate w-4/5">
            {getValue() as ReactNode}
          </Typography>
        );
      },
    },
    {
      accessorKey: "status",

      size: Number(columnWidth["status"] ?? "150"),
      header: () => {
        return (
          <div className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer">
            <div className="truncate w-4/5">{columnMap["status"]}</div>
          </div>
        );
      },
      cell: ({ getValue }) => {
        return getValue() && <TaskStatus status={getValue() as TaskData["status"]} />;
      },
    },
    {
      id: "priority",

      size: Number(columnWidth["priority"] ?? "150"),
      accessorKey: "priority",
      header: () => {
        return (
          <div className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer">
            <div className="truncate w-4/5">{columnMap["priority"]}</div>
          </div>
        );
      },
      cell: ({ getValue }) => {
        return getValue() && <TaskPriority priority={getValue() as TaskData["priority"]} />;
      },
    },
    {
      id: "expected_time",
      size: Number(columnWidth["expected_time"] ?? "150"),
      accessorKey: "expected_time",
      header: () => {
        return (
          <div className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer">
            <div className="truncate w-4/5">{columnMap["expected_time"]}</div>
          </div>
        );
      },
      cell: ({ getValue }) => {
        const hour = getValue();
        return (
          <Typography variant="p" className="text-center truncate">
            {hour !== undefined && floatToTime(Number(getValue()))}
          </Typography>
        );
      },
    },
    {
      id: "actual_time",
      size: Number(columnWidth["actual_time"] ?? "150"),
      accessorKey: "actual_time",
      header: () => {
        return (
          <div className="flex items-center gap-x-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer">
            <div className="truncate w-4/5">{columnMap["actual_time"]}</div>
          </div>
        );
      },
      cell: ({ getValue }) => {
        const hour = getValue();
        return (
          <Typography variant="p" className="text-center truncate">
            {hour !== undefined && floatToTime(Number(getValue()))}
          </Typography>
        );
      },
    },
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
            <Heart
              className={cn(
                "w-4 h-4 hover:cursor-pointer",
                isLiked(row.original?._liked_by, user.user) && "fill-red-600"
              )}
              data-task={row.original.name}
              data-liked-by={row.original?._liked_by}
              onClick={handleLike}
            />
          )
        );
      },
    },
  ];
  return column;
};
