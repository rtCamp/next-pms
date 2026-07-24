/**
 * External dependencies.
 */
import { Dropdown } from "@rtcamp/frappe-ui-react";
import { DotHorizontal } from "@rtcamp/frappe-ui-react/icons";

export function TaskRowActions({
  name,
  onDelete,
}: {
  name: string;
  onDelete?: (name: string) => void;
}) {
  return (
    <Dropdown
      placement="center"
      options={[
        {
          key: "delete",
          label: "Delete",
          theme: "red",
          onClick: () => onDelete?.(name),
        },
      ]}
    >
      {/* A native <button> can't be used here: ListRow already wraps every
      cell in a <button>, and nested buttons are invalid HTML / trigger a
      React DOM-nesting warning. */}
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => e.stopPropagation()}
        aria-label="Task actions"
        className="inline-flex w-4 h-4 shrink-0 cursor-pointer items-center justify-center focus:outline-none focus-visible:ring focus-visible:ring-outline-gray-3 rounded"
      >
        <DotHorizontal className="text-ink-gray-6 size-4" />
      </div>
    </Dropdown>
  );
}
