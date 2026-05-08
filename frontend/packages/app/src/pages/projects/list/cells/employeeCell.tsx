/**
 * External dependencies.
 */
import { Avatar, Tooltip } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { EmployeeRef } from "../types";

export function EmployeeCell({ employee }: { employee: EmployeeRef }) {
  if (employee.email) {
    return (
      <Tooltip text={employee.name || ""}>
        <a
          href={`/desk/user/${encodeURIComponent(employee.email)}`}
          className="flex gap-2 w-fit"
        >
          {employee.avatar && (
            <Avatar
              size="md"
              shape="circle"
              image={employee.avatar}
              label={employee.name || ""}
            />
          )}
          <span className="truncate text-ink-gray-7 text-base">
            {employee.name}
          </span>
        </a>
      </Tooltip>
    );
  }
  return (
    <Tooltip text={employee.name || ""}>
      <div className="flex gap-2 w-fit">
        {employee.avatar && (
          <Avatar
            size="md"
            shape="circle"
            image={employee.avatar}
            label={employee.name || ""}
          />
        )}
        <span className="truncate text-ink-gray-7 text-base">
          {employee.name}
        </span>
      </div>
    </Tooltip>
  );
}
