/**
 * Internal dependencies.
 */
import type { ProjectTimelineItem } from "../../types";
import type { TableColumn } from "../columns";
import { ActionsCell } from "./actionsCell";
import { DateCell } from "./dateCell";
import { OwnerCell } from "./ownerCell";
import { TitleCell } from "./titleCell";
import { WatchersCell } from "./watchersCell";
import { isDateOverdue } from "../../utils";

type TimelineCellProps = {
  item: ProjectTimelineItem;
  column: TableColumn;
  userId?: string;
  onEdit?: (item: ProjectTimelineItem) => void;
  onMarkAsCompleted?: (item: ProjectTimelineItem) => void;
  onFollowDocument?: (item: ProjectTimelineItem) => void;
};

export function TimelineCell({
  item,
  column,
  userId,
  onEdit,
  onMarkAsCompleted,
  onFollowDocument,
}: TimelineCellProps) {
  switch (column.key) {
    case "title":
      return <TitleCell item={item} />;
    case "startDate":
      return <DateCell date={item.startDate} />;
    case "plannedEndDate":
      return (
        <DateCell
          date={item.plannedEndDate}
          overdue={!item.isComplete && isDateOverdue(item.plannedEndDate)}
        />
      );
    case "actualEndDate":
      return <DateCell date={item.actualEndDate} />;
    case "owner":
      return <OwnerCell owner={item.owner} />;
    case "watchers":
      return <WatchersCell watchers={item.watchers} />;
    case "actions":
      return (
        <ActionsCell
          item={item}
          userId={userId}
          onEdit={onEdit}
          onMarkAsCompleted={onMarkAsCompleted}
          onFollowDocument={onFollowDocument}
        />
      );
    default:
      return null;
  }
}
