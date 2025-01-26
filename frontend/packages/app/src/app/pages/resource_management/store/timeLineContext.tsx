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
  allocationData: { isNeedToDelete: boolean; old?: ResourceAllocationTimeLineProps; new?: ResourceAllocationTimeLineProps };
  setEmployeesData: (value: ResourceAllocationEmployeeProps[], hasMore: boolean) => void;
  setAllocationsData: (value: ResourceAllocationTimeLineProps[], type?: "Set" | "Update") => void;
  setCustomerData: (value: ResourceAllocationCustomerProps) => void;
  getLastTimeLineItem: () => string;
  verticalLoderRef: (element: HTMLElement | null) => void;
  updateFilters: (filters: ResourceAllocationTimeLineFilterProps) => void;
  updateApiControler: (apiControler: APIControlerProps) => void;
  getAllocationWithID: (id: string) => ResourceAllocationTimeLineProps;
  updateAllocation: (
    updatedAllocation: ResourceAllocationTimeLineProps,
    type?: "Append" | "Update"
  ) => ResourceAllocationTimeLineProps;
  getEmployeeWithIndex: (index: number) => ResourceAllocationEmployeeProps | -1;
  isEmployeeExits: (name: string) => boolean | undefined;
  setAllocationData: (value: { isNeedToDelete: boolean; old?: ResourceAllocationTimeLineProps; new?: ResourceAllocationTimeLineProps }) => void;
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
  getAllocationWithID: () => {},
  updateAllocation: () => {},
  getEmployeeWithIndex: () => -1,
  isEmployeeExits: () => false,
  setAllocationData: () => {},
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

  const [allocationData, setAllocationData] = useState<{
    old?: ResourceAllocationTimeLineProps;
    new?: ResourceAllocationTimeLineProps;
    isNeedToDelete: boolean;
  }>({ isNeedToDelete: false });

  const verticalLoderRef = useInfiniteScroll({
    isLoading: apiControler.isLoading,
    hasMore: apiControler.hasMore,
    next: () => verticalLodMore(),
  });

  const setEmployeesData = (updatedEmployees: ResourceAllocationEmployeeProps[], hasMore: boolean) => {
    setEmployees([...employees, ...updatedEmployees]);
    updateApiControler({ isNeedToFetchDataAfterUpdate: false, isLoading: false, hasMore: hasMore });
  };
  const setAllocationsData = (updatedAllocations: ResourceAllocationTimeLineProps[], type = "Update") => {
    if (type == "Update") {
      setAllocations([...allocations, ...updatedAllocations]);
      return;
    }
    setAllocations(updatedAllocations);
  };
  const setCustomerData = (updatedCustomer: ResourceAllocationCustomerProps) => {
    setCustomer({ ...customer, ...updatedCustomer });
  };

  const getAllocationWithID = (id: string) => {
    return allocations.find((allocation) => allocation.name == id);
  };

  const getEmployeeWithIndex = (index: number) => {
    return index <= employees.length - 1 ? employees[index] : -1;
  };

  const isEmployeeExits = (name: string) => {
    return employees.find((employee) => employee.name == name) ? true : false;
  };

  const updateAllocation = (updatedAllocation: ResourceAllocationTimeLineProps, type = "Update") => {
    if (type == "Append") {
      setAllocations([...allocations, updatedAllocation]);
      return updatedAllocation;
    }

    const updatedAllocations = allocations.map((allocation) => {
      return allocation.name === updatedAllocation.name ? updatedAllocation : allocation;
    });

    setAllocations([...updatedAllocations]);

    return updatedAllocation;
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
        allocationData,
        setEmployeesData,
        setAllocationData,
        setAllocationsData,
        setCustomerData,
        getLastTimeLineItem,
        verticalLoderRef,
        updateFilters,
        updateApiControler,
        getAllocationWithID,
        getEmployeeWithIndex,
        updateAllocation,
        isEmployeeExits,
      }}
    >
      {children}
    </TimeLineContext.Provider>
  );
};

export { TimeLineContext, TimeLineContextProvider };
