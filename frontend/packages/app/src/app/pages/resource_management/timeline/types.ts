/**
 * External dependencies.
 */
import { AllocationDataProps } from "@/store/resource_management/allocation";
import { Skill } from "@/store/resource_management/team";
import { ResourceAllocationProps } from "@/types/resource_management";

interface ResourceAllocationItemProps {
  style: {
    padding: string;
    background: string;
    borderRadius: string;
    border: string;
    width: number | string;
    left: number;
    borderWidth?: number;
    borderRightWidth?: number;
    overflow?: string;
  };
}

interface ResourceAllocationTimeLineFilterProps {
  employeeName?: string;
  businessUnit?: string[];
  reportingManager?: string;
  designation?: string[];
  allocationType?: string[];
  skillSearch?: Skill[];
  start?: 0;
  page_length?: 20;
  weekDate?: string;
  isShowMonth?: boolean;
}

interface ResourceAllocationEmployeeProps {
  name: string;
  image: string;
  employee_name: string;
  department: string;
  designation: string;
}

interface ResourceAllocationCustomerProps {
  [key: string]: {
    name: string;
    abbr: string;
    image: string;
  };
}

interface ResourceAllocationTimeLineProps extends ResourceAllocationProps {
  customerData: {
    name: string;
    abbr: string;
    image: string;
  };
  itemProps: ResourceAllocationItemProps;
  from_date?: string;
  to_date?: string;
  total_leave_days?: number;
  group: string;
  start_time: number;
  end_time: number;
  canDelete?: boolean;
  isShowMonth?: boolean;
  onDelete?: (
    oldData: AllocationDataProps,
    newData: AllocationDataProps
  ) => void;
  type: "allocation" | "leave";
}

interface ResourceTimeLineDataProps {
  resource_allocations: ResourceAllocationTimeLineProps[];
  employees: ResourceAllocationEmployeeProps[];
  customer: ResourceAllocationCustomerProps;
  leaves: ResourceAllocationTimeLineProps[];
}

interface ResourceTeamAPIBodyProps {
  date?: string;
  max_week?: number;
  start?: number;
  employee_name?: string;
  page_length?: number;
  business_unit?: string;
  reports_to?: string;
  designation?: string;
  is_billable?: string;
  skills?: string;
  need_hours_summary?: boolean;
}

export type {
  ResourceAllocationCustomerProps,
  ResourceAllocationEmployeeProps,
  ResourceAllocationItemProps,
  ResourceAllocationTimeLineFilterProps,
  ResourceAllocationTimeLineProps,
  ResourceTeamAPIBodyProps,
  ResourceTimeLineDataProps,
};
