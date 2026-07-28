/**
 * External dependencies.
 */
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
  const handleOpen = () => onOpenTask?.(name);

  return (
    <Tooltip text={subject}>
      {/* A native <button> can't be used here: ListRow already wraps every
          cell in a <button>, and nested buttons are invalid HTML / trigger
          a React DOM-nesting warning. */}
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          handleOpen();
        }}
        onKeyDown={(e) => {
          if (
            e.target === e.currentTarget &&
            (e.key === "Enter" || e.key === " ")
          ) {
            e.preventDefault();
            e.stopPropagation();
            handleOpen();
          }
        }}
        className={mergeClassNames(
          "inline-flex items-center justify-start w-full h-7 px-0 rounded text-base font-medium text-left cursor-pointer",
          "text-ink-gray-8 bg-transparent hover:bg-surface-gray-3 active:bg-surface-gray-4",
          "focus:outline-none focus-visible:ring focus-visible:ring-outline-gray-3 transition-colors",
        )}
      >
        <span className="ml-2 truncate">{subject}</span>
      </div>
    </Tooltip>
  );
}
