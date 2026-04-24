import { useFrappeGetCall } from "frappe-react-sdk";
import type { Employee } from "@/types";

const useApprovers = () => {
  const { data } = useFrappeGetCall(
    "next_pms.timesheet.api.get_approver_details",
  );

  const approvers = ((data?.message ?? []) as Employee[]).map((emp) => ({
    label: emp.employee_name,
    value: emp.name,
    image: emp.image,
  }));

  return approvers;
};

export default useApprovers;
