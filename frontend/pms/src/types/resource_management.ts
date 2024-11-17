export type ResourceAllocationProps = {
  name:string;
  employee: string;
  allocation_start_date: string;
  allocation_end_date: string;
  hours_allocated_per_day: number;
  project: string;
  project_name: string;
  customer: string;
  is_billable: number;
  date: string;
  total_worked_hours_resource_allocation: number;
};

export interface ResourceCustomerObjectProps {
  [customer: string]: ResourceCustomerProps;
}

export interface ResourceCustomerProps {
  name: string;
  abbr: string;
  image: string;
}
