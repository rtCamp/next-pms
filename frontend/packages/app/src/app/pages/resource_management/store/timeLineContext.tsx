import { useState, createContext, ReactNode } from "react";

import { getFormatedDate, getTodayDate } from "@next-pms/design-system";
import { useInfiniteScroll } from "@next-pms/hooks";

import {
  ResourceAllocationCustomerProps,
  ResourceAllocationEmployeeProps,
  ResourceAllocationTimeLineFilterProps,
  ResourceAllocationTimeLineProps,
} from "../timeline/types";

interface TimeLineContextProps {
  employees: ResourceAllocationEmployeeProps[];
  allocations: ResourceAllocationTimeLineProps[];
  customer: ResourceAllocationCustomerProps;
  filters: ResourceAllocationTimeLineFilterProps;
  apiControler: APIControlerProps;
  setEmployeesData: (value: ResourceAllocationEmployeeProps[], hasMore: boolean) => void;
  setAllocationsData: (value: ResourceAllocationTimeLineProps[]) => void;
  setCustomerData: (value: ResourceAllocationCustomerProps) => void;
  getLastTimeLineItem: () => string;
  verticalLoderRef: (element: HTMLElement | null) => void;
  updateFilters: (filters: ResourceAllocationTimeLineFilterProps) => void;
  updateApiControler: (apiControler: APIControlerProps) => void;
}

interface APIControlerProps {
  isLoading?: boolean;
  hasMore?: boolean;
  isNeedToFetchDataAfterUpdate?: boolean;
}

interface TimeLineContextProviderProps {
  children: ReactNode;
}

const TimeLineContext = createContext<TimeLineContextProps>({
  employees: [],
  allocations: [],
  customer: {},
  filters: {},
  apiControler: {},
  setAllocationsData: () => {},
  setCustomerData: () => {},
  setEmployeesData: () => {},
  getLastTimeLineItem: () => "",
  verticalLoderRef: () => {},
  updateFilters: () => {},
  updateApiControler: () => {},
});

const TimeLineContextProvider = ({ children }: TimeLineContextProviderProps) => {
  const [employees, setEmployees] = useState<ResourceAllocationEmployeeProps[]>([]);
  const [allocations, setAllocations] = useState<ResourceAllocationTimeLineProps[]>([]);
  const [customer, setCustomer] = useState<ResourceAllocationCustomerProps>({});

  const [filters, setFilters] = useState<ResourceAllocationTimeLineFilterProps>({
    employeeName: "",
    businessUnit: [],
    reportingManager: "",
    designation: [],
    allocationType: [],
    skillSearch: [],
    start: 0,
    page_length: 20,
    weekDate: getFormatedDate(getTodayDate()),
  });

  const [apiControler, setApiControler] = useState<APIControlerProps>({
    isLoading: false,
    hasMore: true,
    isNeedToFetchDataAfterUpdate: false,
  });

  const verticalLoderRef = useInfiniteScroll({
    isLoading: apiControler.isLoading,
    hasMore: apiControler.hasMore,
    next: () => verticalLodMore(),
  });

  const setEmployeesData = (updatedEmployees: ResourceAllocationEmployeeProps[], hasMore: boolean) => {
    setEmployees([...employees, ...updatedEmployees]);
    updateApiControler({ isNeedToFetchDataAfterUpdate: false, isLoading: false, hasMore: hasMore });
  };
  const setAllocationsData = (updatedAllocations: ResourceAllocationTimeLineProps[]) => {
    setAllocations([...allocations, ...updatedAllocations]);
  };
  const setCustomerData = (updatedCustomer: ResourceAllocationCustomerProps) => {
    setCustomer({ ...customer, ...updatedCustomer });
  };

  const updateFilters = (updatedFilters: ResourceAllocationTimeLineFilterProps) => {
    setFilters({ ...filters, ...updatedFilters });
    setEmployees([]);
    setAllocations([]);
    setCustomer({});
    updateApiControler({ isNeedToFetchDataAfterUpdate: true, isLoading: true, hasMore: true });
  };

  const updateApiControler = (updatedApiControler: APIControlerProps) => {
    setApiControler({ ...apiControler, ...updatedApiControler });
  };

  const getLastTimeLineItem = () => {
    const length = employees.length;

    if (length == 0) {
      return "-1";
    }

    const index = Math.min(length - 2, employees.length - 1);

    if (index < 0) {
      return "-1";
    }
    return employees[index].name;
  };

  const verticalLodMore = () => {
    setFilters({ ...filters, start: (filters.start ? filters.start : 0) + 20 });
    updateApiControler({ isNeedToFetchDataAfterUpdate: true, isLoading: true });
  };

  return (
    <TimeLineContext.Provider
      value={{
        employees,
        allocations,
        customer,
        filters,
        apiControler,
        setEmployeesData,
        setAllocationsData,
        setCustomerData,
        getLastTimeLineItem,
        verticalLoderRef,
        updateFilters,
        updateApiControler,
      }}
    >
      {children}
    </TimeLineContext.Provider>
  );
};

export { TimeLineContext, TimeLineContextProvider };
