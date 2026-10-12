/** A Frappe role name, e.g. `"Projects Manager"`. */
export type Role = string;

export type WorkingFrequency = "Per Day" | "Per Week";

/** Response of `next_pms.timesheet.api.app.get_data`. */
export interface AppData {
  roles: Role[];
  currencies: string[];
  has_business_unit: boolean;
  has_industry: boolean;
  /** Earliest date the user may still log their own time for; `null` without an employee record. */
  backdate_restricted_before: string | null;
}

/** Response of `next_pms.timesheet.api.employee.get_data`. */
export interface EmployeeData {
  /** `null` when the user has no linked Employee record. */
  employee: string | null;
  employee_name: string | null;
  employee_working_detail: {
    working_hour: number;
    working_frequency: WorkingFrequency;
  };
  /** Employee ID of the reporting manager. */
  employee_report_to: string | null;
}
