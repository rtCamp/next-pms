import type { TaskStatusType } from "@next-pms/design-system/components";

export type GlobalFilterCondition =
  | [field: string, operator: string, value: unknown]
  | [doctype: string, field: string, operator: string, value: unknown];

export type GlobalFilters = {
  project?: GlobalFilterCondition[];
  [key: string]: GlobalFilterCondition[] | undefined;
};

export type Employee = {
  name: string;
  image: string;
  employee_name: string;
};

export type WorkingFrequency = "Per Day" | "Per Week";

export interface TaskData {
  name: string;
  project: string;
  subject: string;
  project_name: string | null;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: TaskStatusType;
  description: string | null;
  custom_is_billable: boolean;
  actual_time: number;
  due_date: string;
  expected_time: number;
  _liked_by: string;
}

export type ProjectProps = {
  project_name: string;
  name: string;
};

export type sortOrder = "asc" | "desc";

export type fieldMetaProps = {
  label: string;
  fieldname: string;
  fieldtype: string;
  options?: string;
};

export interface DocMetaProps {
  default_fields: Array<fieldMetaProps>;
  doctype: string;
  fields: Array<fieldMetaProps>;
  title_field: string;
}
declare global {
  interface Window {
    frappe: {
      boot?: {
        user?: {
          roles?: string[];
          can_create: string[];
        };
        currencies?: string[];
        has_business_unit?: boolean;
        has_industry?: boolean;
        desk_theme?: string;
        is_calendar_setup: boolean;
        global_filters: GlobalFilters;
        allow_weekend_entries?: boolean;
      };
    };
  }
}

export type Project = {
  name: string;
  project_name: string;
};
