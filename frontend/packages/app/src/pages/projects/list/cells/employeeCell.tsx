/**
 * External dependencies.
 */
import { useRef } from "react";
import { Avatar, Tooltip } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { Employee } from "../types";
import { TextCell } from "./textCell";

export function EmployeeCell({ employee }: { employee: Employee | null }) {
  const nameRef = useRef<HTMLSpanElement>(null);
  if (!employee) {
    return <TextCell text="N/A" />;
  }
  if (employee.user) {
    return (
      <Tooltip text={employee.user || ""}>
        <a
          href={`/desk/user/${encodeURIComponent(employee.user)}`}
          className="flex gap-2 w-fit rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-outline-gray-3"
        >
          {employee.image && (
            <Avatar
              size="md"
              shape="circle"
              image={employee.image}
              label={employee.full_name || ""}
            />
          )}
          <span className="truncate text-ink-gray-6 text-base">
            {employee.full_name}
          </span>
        </a>
      </Tooltip>
    );
  }
  return (
    <Tooltip
      text={employee.full_name || ""}
      showWhen="truncated"
      truncationRef={nameRef}
    >
      <div className="flex gap-2 w-fit">
        {employee.image && (
          <Avatar
            size="md"
            shape="circle"
            image={employee.image}
            label={employee.full_name || ""}
          />
        )}
        <span ref={nameRef} className="truncate text-ink-gray-6 text-base">
          {employee.full_name}
        </span>
      </div>
    </Tooltip>
  );
}
