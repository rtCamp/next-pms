/**
 * External Dependencies.
 */
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal Dependencies.
 */
import type { LookupOption } from "@/hooks/useRemoteLookup";

type ApproverRecord = {
  employee_name: string;
  image?: string;
  name: string;
};

type ApproverResponse = {
  message: ApproverRecord[];
};

export type ApproverOption = LookupOption & {
  image?: string;
};

/**
 * Fetches approver records for filter fields.
 */
const useApproverOptions = () => {
  const { data } = useFrappeGetCall<ApproverResponse>(
    "next_pms.timesheet.api.get_approver_details",
  );

  const approvers: ApproverOption[] = (data?.message ?? []).map((emp) => ({
    label: emp.employee_name,
    value: emp.name,
    image: emp.image,
  }));

  return approvers;
};

export default useApproverOptions;
