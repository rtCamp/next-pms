/**
 * External dependencies.
 */
import { useCallback, useContext } from "react";
import { FrappeContext } from "frappe-react-sdk";

interface MentionEmployee {
  user_id?: string;
  employee_name: string;
}

export function useMentionSuggestions() {
  const frappe = useContext(FrappeContext);

  return useCallback(
    async (query: string) => {
      const response = await frappe?.call.get(
        "next_pms.timesheet.api.employee.get_employee_list",
        {
          employee_name: query || undefined,
          page_length: 5,
          start: 0,
        },
      );

      return ((response?.message.data ?? []) as MentionEmployee[])
        .filter((emp) => emp.user_id)
        .map((emp) => ({ id: emp.user_id!, label: emp.employee_name }));
    },
    [frappe],
  );
}
