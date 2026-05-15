/**
 * External dependencies.
 */
import { Avatar, Tooltip } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { Employee } from "../types";
import { TextCell } from "./textCell";

export function EmployeeCell({ employee }: { employee: Employee | null }) {
  if (!employee) {
    return <TextCell text="N/A" />;
  }
  if (employee.user) {
    return (
      <Tooltip text={employee.user || ""}>
        <a
          href={`/desk/user/${encodeURIComponent(employee.user)}`}
          className="flex gap-2 w-fit"
        >
          {employee.image && (
            <Avatar
              size="md"
              shape="circle"
              image={employee.image}
              label={employee.full_name || ""}
            />
          )}
          <span className="truncate text-ink-gray-7 text-base">
            {employee.full_name}
          </span>
        </a>
      </Tooltip>
    );
  }
  return (
    <Tooltip text={employee.full_name || ""}>
      <div className="flex gap-2 w-fit">
        {employee.image && (
          <Avatar
            size="md"
            shape="circle"
            image={employee.image}
            label={employee.full_name || ""}
          />
        )}
        <span className="truncate text-ink-gray-7 text-base">
          {employee.full_name}
        </span>
      </div>
    </Tooltip>
  );
}
