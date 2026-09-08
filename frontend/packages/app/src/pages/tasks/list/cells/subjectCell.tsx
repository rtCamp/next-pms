/**
 * External dependencies.
 */
import { useRef } from "react";
import { mergeClassNames } from "@next-pms/design-system";
import { Tooltip } from "@rtcamp/frappe-ui-react";

export function SubjectCell({
  name,
  subject,
  onOpenTask,
}: {
  name: string;
  subject: string;
  onOpenTask?: (taskName: string) => void;
}) {
  const subjectRef = useRef<HTMLSpanElement>(null);
  const handleOpen = () => onOpenTask?.(name);

  return (
    <Tooltip text={subject} showWhen="truncated" truncationRef={subjectRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleOpen();
        }}
        className={mergeClassNames(
          "inline-flex items-center justify-start w-full h-7 px-0 rounded text-base font-medium text-left cursor-pointer",
          "text-ink-gray-8 bg-transparent hover:bg-surface-gray-3 active:bg-surface-gray-4",
          "transition-colors",
        )}
      >
        <span ref={subjectRef} className="ml-2 truncate">
          {subject}
        </span>
      </button>
    </Tooltip>
  );
}
