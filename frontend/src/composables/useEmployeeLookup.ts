import type { MaybeRefOrGetter } from "vue";
import { useRemoteLookup, type LookupOption } from "./useRemoteLookup";

interface EmployeeItem {
  name: string;
  employee_name: string;
  image?: string;
}

export interface EmployeeLookupOptions {
  enabled?: MaybeRefOrGetter<boolean>;
  query: MaybeRefOrGetter<string>;
  selected?: MaybeRefOrGetter<LookupOption | null | undefined>;
}

/** Searches employees by name with `get_employee_list`, for employee pickers. */
export function useEmployeeLookup(options: EmployeeLookupOptions) {
  return useRemoteLookup<{ data: EmployeeItem[] } | null, EmployeeItem>({
    method: "next_pms.timesheet.api.employee.get_employee_list",
    enabled: options.enabled,
    query: options.query,
    selected: options.selected,
    params: (query) => ({
      employee_name: query || undefined,
      page_length: 20,
      start: 0,
    }),
    getItems: (response) => response?.data ?? [],
    toOption: (employee) => ({
      label: employee.employee_name,
      value: employee.name,
    }),
  });
}
