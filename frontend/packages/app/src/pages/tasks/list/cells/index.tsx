/**
 * Internal dependencies.
 */
import { DateCell } from "./dateCell";
import { LikeCell } from "./likeCell";
import { PriorityCell } from "./priorityCell";
import { StatusCell } from "./statusCell";
import { SubjectCell } from "./subjectCell";
import { TextCell } from "./textCell";
import type { ListViewColumn } from "../../types";
import type { TaskListItem } from "../types";

export function TaskListCell({
  row,
  column,
  onOpenTask,
}: {
  row: TaskListItem;
  column: ListViewColumn;
  onOpenTask?: (taskName: string) => void;
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
    case "priority":
      return <PriorityCell priority={row.priority} />;
    case "exp_end_date":
      return <DateCell isoDate={row.exp_end_date} />;
    case "like":
      return <LikeCell name={row.name} likedBy={row._liked_by} />;
    default:
      return null;
  }
}
