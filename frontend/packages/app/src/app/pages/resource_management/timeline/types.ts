/**
 * External dependencies.
 */
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
  group: string;
  start_time: number;
  end_time: number;
  canDelete?: boolean;
  onDelete?: () => void;
  isShowMonth?: boolean;
}

interface ResourceTimeLineDataProps {
  resource_allocations: ResourceAllocationTimeLineProps[];
  employees: ResourceAllocationEmployeeProps[];
  customer: ResourceAllocationCustomerProps;
}

interface ResourceTeamAPIBodyProps {
  date?: string;
  start?: number;
  employee_name?: string;
  page_length?: number;
  business_unit?: string;
  reports_to?: string;
  designation?: string;
  is_billable?: string;
  skills?: string;
}

export type {
  ResourceAllocationCustomerProps,
  ResourceAllocationEmployeeProps,
  ResourceAllocationItemProps,
  ResourceAllocationTimeLineFilterProps,
  ResourceAllocationTimeLineProps, ResourceTeamAPIBodyProps, ResourceTimeLineDataProps
};

