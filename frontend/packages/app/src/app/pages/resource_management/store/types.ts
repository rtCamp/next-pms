/**
 * External dependencies.
 */
import { ReactNode } from "react";

export type PermissionProps = {
  read?: boolean;
  write?: boolean;
  delete?: boolean;
  isNeedToSetPermission?: boolean;
};

export type DateProps = {
  start_date: string;
  end_date: string;
  key: string;
  dates: string[];
};

export type DateRange = {
  start_date: string;
  end_date: string;
};

export interface APIController {
  isNeedToFetchDataAfterUpdate: boolean;
  isLoading: boolean;
  action: "SET" | "UPDATE";
}

export interface TableViewProps {
  combineWeekHours: boolean;
  view: string;
  tableCell?: {
    width: number;
    height: number;
  };
}

export type ResourceKeys =
  | "project"
  | "employee"
  | "is_billable"
  | "customer"
  | "total_allocated_hours"
  | "hours_allocated_per_day"
  | "allocation_start_date"
  | "allocation_end_date"
  | "note";

export interface ContextProviderProps {
  children: ReactNode;
}

export type AllocationDataProps = {
  employee: string;
  is_billable: boolean;
  project: string;
  project_name: string;
  customer: string;
  customer_name: string;
  total_allocated_hours: string;
  hours_allocated_per_day: string;
  allocation_start_date: string;
  allocation_end_date: string;
  note: string;
  name: string;
  employee_name: string;
};
