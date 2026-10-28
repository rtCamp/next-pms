import { toValue, type MaybeRefOrGetter } from "vue";
import { useRemoteLookup, type LookupOption } from "./useRemoteLookup";

interface EmployeeItem {
  name: string;
  employee_name: string;
  image?: string | null;
  user_id?: string | null;
}

/** An employee option; `value` is the Employee ID. */
export interface EmployeeLookupOption extends LookupOption {
  /** The employee's user, when they have one. */
  userId?: string;
}

export interface EmployeeLookupOptions {
  enabled?: MaybeRefOrGetter<boolean>;
  query: MaybeRefOrGetter<string>;
  selected?: MaybeRefOrGetter<EmployeeLookupOption | null | undefined>;
  /** Only employees whose user has one of these roles. */
  roles?: string[];
  /** Only the employees on this project's team. */
  projectId?: MaybeRefOrGetter<string | null | undefined>;
}

/**
 * Searches employees by name with `get_employee_list`, for employee pickers. Options
 * carry the employee's `image`.
 */
export function useEmployeeLookup(options: EmployeeLookupOptions) {
  const projectId = () => toValue(options.projectId) || undefined;
  return useRemoteLookup<
    { data: EmployeeItem[] } | null,
    EmployeeItem,
    EmployeeLookupOption
  >({
    method: "next_pms.timesheet.api.employee.get_employee_list",
    enabled: options.enabled,
    query: options.query,
    selected: options.selected,
    params: (query) => {
      const project = projectId();
      return {
        employee_name: query || undefined,
        page_length: 20,
        start: 0,
        roles: options.roles?.length
          ? JSON.stringify(options.roles)
          : undefined,
        project: project ? JSON.stringify([project]) : undefined,
      };
    },
    refetchOn: projectId,
    getItems: (response) => response?.data ?? [],
    toOption: (employee) => ({
      label: employee.employee_name,
      value: employee.name,
      image: employee.image ?? undefined,
      userId: employee.user_id ?? undefined,
    }),
  });
}
