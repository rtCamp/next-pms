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

const useApproverLookup = (
  method: string,
  { revalidateOnFocus }: UseApproverOptionsOptions,
) => {
  const { options } = useRemoteLookup<
    ApproverLookupResult,
    ApproverRecord,
    ApproverOption
  >({
    method,
    params: () => ({}),
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
 * Fetches the approvers the current user may send their own week to.
 */
export const useTimesheetApproverOptions = (
  options: UseApproverOptionsOptions = {},
) =>
  useApproverLookup("next_pms.timesheet.api.get_timesheet_approvers", options);

export default useApproverOptions;
