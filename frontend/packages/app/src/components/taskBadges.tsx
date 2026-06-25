/**
 * External dependencies.
 */
import { mergeClassNames as cn } from "@next-pms/design-system/utils";
import { Badge } from "@rtcamp/frappe-ui-react";
import { CalendarDeadline, Summary } from "@rtcamp/frappe-ui-react/icons";
import { format, parseISO } from "date-fns";

/**
 * Internal dependencies.
 */
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
      icon: <CalendarDeadline width={12} height={12} />,
      text: format(parseISO(dueDate), "dd MMM"),
    },
    projectName && {
      icon: <Summary width={12} height={12} />,
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
