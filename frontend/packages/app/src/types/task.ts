/**
 * Internal dependencies.
 */
import { ColumnDef, Table as TanStackTable } from "@tanstack/react-table";
import { TaskData } from "@/types";

export type TaskMutateCallType = React.Dispatch<
  React.SetStateAction<() => void>
>;

export type TaskTableType = TanStackTable<TaskData>;
export type ColumnsType = ColumnDef<TaskData>[];

export type columnsToExcludeActionsInTablesType = string[];

export type taskStateActionType = "SET" | "UPDATE";

export type TaskStatusType =
  | "Open"
  | "Working"
  | "Pending Review"
  | "Overdue"
  | "Template"
  | "Completed"
  | "Cancelled";

export type AddTaskType = {
  subject: string;
  project: string;
  expected_time: string;
  description: string;
};
