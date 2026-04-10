export interface Employee {
  name: string;
  image: string | null;
  employee_name: string;
  department: string | null;
  designation: string | null;
}

export interface Leave {
  employee: string;
  employee_name: string;
  from_date: string;
  to_date: string;
  half_day: number;
  half_day_date: string | null;
  total_leave_days: number;
  name: string;
}

export interface ResourceAllocation {
  name: string;
  employee: string;
  employee_name: string;
  allocation_start_date: string;
  allocation_end_date: string;
  hours_allocated_per_day: number;
  project: string;
  project_name: string;
  customer: string;
  is_billable: number;
  note: string | null;
  modified_by: string;
  modified: string;
  creation: string;
  status: string;
  modified_by_avatar: string;
}

export interface Customer {
  name: string;
  abbr: string;
  image: string | null;
}

export interface Permissions {
  read: boolean;
  write: boolean;
  delete: boolean;
}

export interface TeamAllocationResponse {
  employees: Employee[];
  leaves: Leave[];
  resource_allocations: ResourceAllocation[];
  customer: Record<string, Customer>;
  total_count: number;
  has_more: boolean;
  permissions: Permissions;
}
