export type ResourceAllocationProps = {
  name: string;
  employee: string;
  employee_name: string;
  allocation_start_date: string;
  allocation_end_date: string;
  hours_allocated_per_day: number;
  total_allocated_hours: number;
  project: string;
  project_name: string;
  customer: string;
  is_billable: number;
  numberDays?: number;
  note: string;
  customerData?: {
    name: string;
    abbr: string;
    image: string;
  };
};

export interface ResourceCustomerObjectProps {
  [customer: string]: ResourceCustomerProps;
}

export interface ResourceAllocationObjectProps {
  [name: string]: ResourceAllocationProps;
}

export interface ResourceCustomerProps {
  name: string;
  abbr: string;
  image: string;
}
