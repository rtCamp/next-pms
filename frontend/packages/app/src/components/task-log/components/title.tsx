/**
 * External dependencies.
 */
import { TaskStatus, TaskStatusType } from "@next-pms/design-system/components";
import { mergeClassNames as cn } from "@next-pms/design-system/utils";

type TitleProps = {
  taskName: string;
  status: TaskStatusType;
  className?: string;
};

const Title: React.FC<TitleProps> = ({ taskName, status, className }) => {
  return (
    <div className={cn("flex items-center gap-x-2 gap-y-1.5 pr-2", className)}>
      <TaskStatus status={status} />
      <div className="text-lg font-semibold">{taskName}</div>
    </div>
  );
};

export default Title;
