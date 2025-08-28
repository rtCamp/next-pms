import { TaskStatusType } from "./task";
import { type ViewState } from "../store/view";
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
      boot: {
        user: {
          roles: string[];
        };
        currencies?: string[];
        has_business_unit?: boolean;
        has_industry?: boolean;
        desk_theme?: string;
        views: ViewState["views"];
      };
    };
  }
}

export type Project = {
  name: string;
  project_name: string;
};
