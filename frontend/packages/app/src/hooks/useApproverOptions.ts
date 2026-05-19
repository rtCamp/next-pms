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

/**
 * Fetches approver records for filter fields.
 */
const useApproverOptions = ({
  revalidateOnFocus,
}: UseApproverOptionsOptions = {}) => {
  const { options } = useRemoteLookup<
    ApproverLookupResult,
    ApproverRecord,
    ApproverOption
  >({
    method: "next_pms.timesheet.api.get_approver_details",
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

export default useApproverOptions;
