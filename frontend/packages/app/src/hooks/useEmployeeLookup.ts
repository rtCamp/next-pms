/**
 * Internal Dependencies.
 */
import { useRemoteLookup, type LookupOption } from "@/hooks/useRemoteLookup";

type EmployeeLookupItem = {
  employee_name: string;
  image?: string;
  name: string;
};

type EmployeeLookupResult = {
  data: EmployeeLookupItem[];
};

export type EmployeeLookupOption = LookupOption & {
  image?: string;
};

interface UseEmployeeLookupOptions {
  /** Controls whether the employee lookup should fetch for the current UI state. */
  shouldFetch: boolean;
  /** Caps the number of employee rows fetched per request. */
  pageSize?: number;
  /** Filters employees by partial employee name on the backend. */
  query: string;
  /** Restricts results to employees who have any of these roles. */
  roles?: string[];
  /** Keeps the current selection visible when it is not in the latest results. */
  selectedOption?: EmployeeLookupOption | null;
}

/**
 * Fetches employee combobox options and leaves visual decoration to the consumer.
 */
export const useEmployeeLookup = ({
  shouldFetch,
  pageSize = 20,
  query,
  roles,
  selectedOption,
}: UseEmployeeLookupOptions) => {
  return useRemoteLookup<
    EmployeeLookupResult,
    EmployeeLookupItem,
    EmployeeLookupOption
  >({
    shouldFetch,
    query,
    pageSize,
    method: "next_pms.timesheet.api.employee.get_employee_list",
    params: ({ query: searchQuery, pageSize }) => ({
      employee_name: searchQuery || undefined,
      page_length: pageSize,
      roles: roles?.length ? roles : undefined,
      start: 0,
    }),
    getItems: (message) => message?.data ?? [],
    mapOption: (employee) => ({
      label: employee.employee_name,
      value: employee.name,
      image: employee.image,
    }),
    selectedOption,
  });
};
