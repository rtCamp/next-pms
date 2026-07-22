/**
 * External dependencies.
 */
import { TaskStatus, TaskStatusType } from "@next-pms/design-system/components";
import { mergeClassNames as cn } from "@next-pms/design-system/utils";
import { ArrowUpRight } from "@rtcamp/frappe-ui-react/icons";

type TitleProps = {
  taskName: string;
  status: TaskStatusType;
  className?: string;
  ghLink?: string;
};

const Title: React.FC<TitleProps> = ({
  taskName,
  status,
  className,
  ghLink,
}) => {
  return (
    <div className={cn("flex items-center gap-x-2 gap-y-1.5 pr-2", className)}>
      <TaskStatus status={status} />
      {ghLink ? (
        <a
          href={ghLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg text-ink-gray-8 font-semibold flex items-end gap-1"
        >
          {taskName}
          <ArrowUpRight className="size-4 shrink-0 text-ink-gray-5" />
        </a>
      ) : (
        <div className="text-lg text-ink-gray-8 font-semibold">{taskName}</div>
      )}
    </div>
  );
};

export default Title;
