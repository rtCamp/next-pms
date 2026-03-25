import { useFrappeGetCall } from "frappe-react-sdk";
import { Employee } from "@/types";

type UseApproversOptions = {
  role?: string[];
};

const useApprovers = ({ role }: UseApproversOptions = {}) => {
  if (!role || role.length === 0) {
    role = ["Projects Manager", "Projects User"];
  }

  const { data } = useFrappeGetCall(
    "next_pms.timesheet.api.employee.get_employee_list",
    {
      role,
    },
  );

  const approvers = ((data?.message?.data ?? []) as Employee[]).map((emp) => ({
    label: emp.employee_name,
    value: emp.name,
    image: emp.image,
  }));

  return approvers;
};

export default useApprovers;
