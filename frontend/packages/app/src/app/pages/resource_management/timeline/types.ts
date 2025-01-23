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
}

interface ResourceTimeLineDataProps {
  resource_allocations: ResourceAllocationTimeLineProps[];
  employees: ResourceAllocationEmployeeProps[];
  customer: ResourceAllocationCustomerProps;
}

export type {
    ResourceAllocationCustomerProps,
    ResourceAllocationEmployeeProps,
    ResourceAllocationItemProps,
    ResourceAllocationTimeLineProps,
    ResourceTimeLineDataProps
};

