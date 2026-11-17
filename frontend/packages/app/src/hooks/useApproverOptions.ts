/**
 * Internal Dependencies.
 */
import { useRemoteLookup, type LookupOption } from "@/hooks/useRemoteLookup";

type ApproverRecord = {
  employee_name: string;
  image?: string;
  name: string;
};

type ApproverLookupResult = ApproverRecord[];

export type ApproverOption = LookupOption & {
  image?: string;
};

type UseApproverOptionsOptions = {
  /** Revalidates the lookup when the window regains focus. */
  revalidateOnFocus?: boolean;
};

type UseTimesheetApproverOptions = UseApproverOptionsOptions & {
  /** Skips the request, e.g. while the dialog is closed. */
  shouldFetch?: boolean;
};

const useApproverLookup = (
  method: string,
  { revalidateOnFocus }: UseApproverOptionsOptions,
  params: Record<string, unknown> = {},
  shouldFetch = true,
) => {
  const { options } = useRemoteLookup<
    ApproverLookupResult,
    ApproverRecord,
    ApproverOption
  >({
    method,
    shouldFetch,
    params: () => params,
    getItems: (message) => message ?? [],
    mapOption: (employee) => ({
      label: employee.employee_name,
      value: employee.name,
      image: employee.image,
    }),
    revalidateOnFocus,
  });

  return options;
};

/**
 * Fetches everyone who may approve timesheets, for filter fields and name lookups.
 */
const useApproverOptions = (options: UseApproverOptionsOptions = {}) =>
  useApproverLookup("next_pms.timesheet.api.get_approver_details", options);

/**
 * Fetches the approvers the current user may send the week of `startDate` to:
 * their reporting manager and the managers of that week's projects.
 */
export const useTimesheetApproverOptions = (
  startDate: string,
  { shouldFetch = true, ...options }: UseTimesheetApproverOptions = {},
) =>
  useApproverLookup(
    "next_pms.timesheet.api.get_timesheet_approvers",
    options,
    { start_date: startDate },
    shouldFetch && !!startDate,
  );

export default useApproverOptions;
