import type { ReactNode, ComponentType } from "react";
import type { TaskStatusType } from "@next-pms/design-system/components";

import { ROUTES } from "@/lib/constant";
import { PreloadableComponent } from "@/lib/lazy-preload";

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

export type Role =
  | "Projects Manager"
  | "Projects User"
  | "Delivery Manager"
  | "Employee"
  | "Timesheet Manager"
  | "Timesheet User"
  | "System Manager";

declare global {
  interface Window {
    frappe: {
      boot?: {
        user?: {
          roles?: Role[];
          can_create: string[];
        };
        currencies?: string[];
        has_business_unit?: boolean;
        has_industry?: boolean;
        has_repository_connections?: boolean;
        has_customer_feedback?: boolean;
        has_project_email?: boolean;
        desk_theme?: string;
        has_todo_custom_fields?: boolean;
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

/**
 * Route configuration keyed by ROUTES keys.
 */
export type RouteKey = keyof typeof ROUTES;

// `any` mirrors React.lazy's constraint so propful views stay assignable; see
// lazy-preload.ts for the full rationale.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LazyView = PreloadableComponent<ComponentType<any>>;

export type RouteConfig = {
  Component: LazyView;
  allowedRoles: Role[];
  layout?: ReactNode;
};
