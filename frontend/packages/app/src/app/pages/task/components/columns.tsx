/**
 * External dependencies.
 */
import { Typography, TaskStatus } from "@next-pms/design-system/components";
import { floatToTime } from "@next-pms/design-system/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Clock, Heart } from "lucide-react";

/**
 * Internal dependencies.
 */
import { DataCell } from "@/app/components/list-view/dataCell";
import { mergeClassNames, isLiked } from "@/lib/utils";
import { UserState } from "@/store/user";
import type { TaskData } from "@/types";
import type { ColumnsType } from "@/types/task";
import { TaskPriority } from "./taskPriority";
import type {
  FieldMeta,
  handleAddTimeType,
  handleLikeType,
  openTaskLogType,
} from "./types";

export const getColumn = (
  fieldMeta: FieldMeta["fields"],
  fieldInfo: Array<string>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columnInfo: any,
  title_field: string,
  docType: string,
  openTaskLog: openTaskLogType,
  handleAddTime: handleAddTimeType,
  user: UserState,
  handleLike: handleLikeType,
): ColumnsType => {
  const columns: ColumnsType = [];
  const ProjectNameColumn: ColumnDef<TaskData> = {
    accessorKey: "project_name",
    size: columnInfo["project_name"] ?? 150,
    header: ({ column }) => {
      return (
        <div
          className="flex items-center gap-x-1 group-hover:text-black dark:group-hover:text-foreground transition-colors ease duration-200 select-none cursor-pointer w-full "
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
            className="flex items-center gap-x-1 group-hover:text-black dark:group-hover:text-foreground transition-colors ease duration-200 select-none cursor-pointer w-full "
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
              className=" py-1 truncate cursor-pointer hover:underline"
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
          <DataCell
            meta={meta}
            title_field={title_field}
            docType={docType}
            value={value}
            row={row}
          />
        );
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
          <div
            title="Add Timesheet"
            className="w-full flex justify-center items-center"
          >
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
              className={mergeClassNames(
                "hover:cursor-pointer",
                isLiked(row.original._liked_by, user.user) &&
                  "fill-destructive stroke-destructive",
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
