/**
 * External dependencies.
 */
import { useState } from "react";
import { getTodayDate } from "@next-pms/design-system";
import { useInfiniteScroll } from "@next-pms/hooks";
import { createContext } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { APIControlerProps, TimeLineContextProps, TimeLineContextProviderProps } from "./types";
import type {
  ResourceAllocationCustomerProps,
  ResourceAllocationEmployeeProps,
  ResourceAllocationTimeLineFilterProps,
  ResourceAllocationTimeLineProps,
} from "../timeline/types";

const defaultResourceAllocation: ResourceAllocationTimeLineProps = {
  customerData: {
    name: "",
    abbr: "",
    image: "",
  },
  itemProps: {
    style: {
      padding: "",
      background: "",
      borderRadius: "",
      border: "",
      width: "",
      left: 0,
    },
  },
  group: "",
  start_time: 0,
  end_time: 0,
  type: "allocation",
  name: "",
  employee: "",
  employee_name: "",
  allocation_start_date: "",
  allocation_end_date: "",
  hours_allocated_per_day: 0,
  total_allocated_hours: 0,
  project: "",
  project_name: "",
  customer: "",
  is_billable: 0,
  note: "",
};

const TimeLineContext = createContext<TimeLineContextProps>({
  state: {
    employees: [],
    allocations: [],
    customer: {},
    filters: {},
    apiControler: {},
    isShowMonth: false,
    allocationData: {
      isNeedToDelete: false,
      old: undefined,
      new: undefined,
    },
  },
  actions: {
    setAllocationsData: () => {},
    setCustomerData: () => {},
    setEmployeesData: () => {},
    getLastTimeLineItem: () => "",
    verticalLoderRef: () => {},
    updateFilters: () => {},
    updateApiControler: () => {},
    getAllocationWithID: () => defaultResourceAllocation,
    updateAllocation: () => defaultResourceAllocation,
    getEmployeeWithID: () => {},
    getEmployeeWithIndex: () => -1,
    isEmployeeExits: () => false,
    setAllocationData: () => {},
  },
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
    weekDate: getTodayDate(),
    isShowMonth: false,
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
    hasMore: apiControler.hasMore ? true : false,
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

  const getEmployeeWithID = (id: string) => {
    return employees.find((employe) => employe.name == id);
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
    setFilters({ ...filters, ...updatedFilters, start: 0 });
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
        state: {
          employees,
          allocations,
          customer,
          filters,
          apiControler,
          allocationData,
        },
        actions: {
          setEmployeesData,
          setAllocationData,
          setAllocationsData,
          setCustomerData,
          getLastTimeLineItem,
          verticalLoderRef,
          updateFilters,
          updateApiControler,
          getAllocationWithID,
          getEmployeeWithID,
          getEmployeeWithIndex,
          updateAllocation,
          isEmployeeExits,
        },
      }}
    >
      {children}
    </TimeLineContext.Provider>
  );
};

export { TimeLineContext, TimeLineContextProvider };
