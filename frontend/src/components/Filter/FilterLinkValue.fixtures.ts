import type { FilterField } from "./types";

export const USER_FIELD: FilterField = {
  name: "owner",
  label: "Owner",
  type: "link",
  link: { doctype: "User", labelField: "full_name" },
};

export const EMPLOYEE_FIELD: FilterField = {
  name: "project_manager",
  label: "Project Manager",
  type: "link",
  link: {
    doctype: "Employee",
    labelField: "employee_name",
    valueField: "user_id",
    customMethod: {
      method: "next_pms.timesheet.api.employee.get_employee_list",
    },
  },
};

export const USERS = [
  { name: "john@example.com", full_name: "John Doe" },
  { name: "jane@example.com", full_name: "Jane Smith" },
];

export const EMPLOYEES = [
  {
    name: "HR-EMP-001",
    employee_name: "Asha Rao",
    user_id: "asha@example.com",
  },
  {
    name: "HR-EMP-002",
    employee_name: "Ravi Kumar",
    user_id: "ravi@example.com",
  },
];
