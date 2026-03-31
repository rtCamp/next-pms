import { prettyDate } from "@next-pms/design-system/date";
import { mergeClassNames as cn } from "@next-pms/design-system/utils";
import { Badge } from "@rtcamp/frappe-ui-react";
import { CalendarFoldIcon, Folder } from "lucide-react";
import { TaskBadgeItem } from "./types";

type TaskBadgesProps = {
  dueDate?: string;
  projectName?: string;
  className?: string;
};

const TaskBadges: React.FC<TaskBadgesProps> = ({
  dueDate,
  projectName,
  className,
}) => {
  const badges: TaskBadgeItem[] = [
    dueDate && {
      icon: <CalendarFoldIcon size={12} />,
      text: prettyDate(dueDate).date,
    },
    projectName && {
      icon: <Folder size={12} />,
      text: projectName,
    },
  ].filter(Boolean) as TaskBadgeItem[];

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {badges.map((badge, index) => (
        <Badge key={index} variant="subtle" size="md" prefix={badge.icon}>
          {badge.text}
        </Badge>
      ))}
    </div>
  );
};

export default TaskBadges;
