/**
 * Internal dependencies.
 */
import { formatHours } from "@/lib/utils";
import type { OpenAddTimeDialogOptions } from "@/pages/timesheet/outletContext";
import { AddTimeCell } from "./addTimeCell";
import { DateCell } from "./dateCell";
import { LikeCell } from "./likeCell";
import { PriorityCell } from "./priorityCell";
import { StatusCell } from "./statusCell";
import { SubjectCell } from "./subjectCell";
import { TaskRowActions } from "./taskRowActions";
import { TextCell } from "./textCell";
import type { ListViewColumn } from "../../types";
import type { TaskListItem } from "../types";

const MANAGER_ROLES = ["Projects Manager", "Delivery Manager", "Delivery User"];

function canUserDelete(row: TaskListItem, userId?: string, roles?: string[]) {
  return (
    roles &&
    (MANAGER_ROLES.some((r) => roles.includes(r)) || row.owner === userId)
  );
}

export function TaskListCell({
  row,
  column,
  onOpenTask,
  onAddTime,
  onEditTask,
  onDeleteTask,
  userId,
  roles,
}: {
  row: TaskListItem;
  column: ListViewColumn;
  onOpenTask?: (taskName: string) => void;
  onAddTime?: (prefill: OpenAddTimeDialogOptions) => void;
  onEditTask?: (task: TaskListItem) => void;
  onDeleteTask?: (name: string) => void;
  userId?: string;
  roles?: string[];
}) {
  switch (column.key) {
    case "subject":
      return (
        <SubjectCell
          name={row.name}
          subject={row.subject}
          onOpenTask={onOpenTask}
        />
      );
    case "project_name":
      return <TextCell text={row.project_name} />;
    case "status":
      return <StatusCell status={row.status} />;
    case "expected_time":
      return <TextCell text={formatHours(row.expected_time)} />;
    case "priority":
      return <PriorityCell priority={row.priority} />;
    case "exp_end_date":
      return <DateCell isoDate={row.exp_end_date} />;
    case "add_time":
      return <AddTimeCell row={row} onAddTime={onAddTime} />;
    case "like":
      return <LikeCell name={row.name} likedBy={row._liked_by} />;
    case "actions":
      return (
        <TaskRowActions
          name={row.name}
          onEdit={() => onEditTask?.(row)}
          onDelete={onDeleteTask}
          canDelete={canUserDelete(row, userId, roles)}
        />
      );
    default:
      return null;
  }
}
