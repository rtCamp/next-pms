/**
 * External dependencies.
 */
import { Avatar, Tooltip } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { EmployeeRef } from "../../types";

export function EmployeeCell({ employee }: { employee: EmployeeRef }) {
  return (
    <Tooltip text={employee.name}>
      <a
        href={`/desk/user/${encodeURIComponent(employee.email)}`}
        className="flex min-w-0 items-center gap-2"
      >
        <Avatar
          size="md"
          shape="circle"
          image={employee.avatar}
          label={employee.initials}
        />
        <span className="truncate text-ink-gray-7 text-base">
          {employee.name}
        </span>
      </a>
    </Tooltip>
  );
}
