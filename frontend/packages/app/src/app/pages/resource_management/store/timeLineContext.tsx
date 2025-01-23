import { useState, createContext, ReactNode } from "react";
import {
  ResourceAllocationCustomerProps,
  ResourceAllocationEmployeeProps,
  ResourceAllocationTimeLineProps,
} from "../timeline/types";

interface TimeLineContextProps {
  employees: ResourceAllocationEmployeeProps[];
  allocations: ResourceAllocationTimeLineProps[];
  customer: ResourceAllocationCustomerProps;
  setEmployeesData: (value: ResourceAllocationEmployeeProps[], type: "UPDATE" | "SET" | "APPEND") => void;
  setAllocationsData: (value: ResourceAllocationTimeLineProps[], type: "UPDATE" | "SET" | "APPEND") => void;
  setCustomerData: (value: ResourceAllocationCustomerProps, type: "UPDATE" | "SET" | "APPEND") => void;
}

interface TimeLineContextProviderProps {
  children: ReactNode;
}

const TimeLineContext = createContext<TimeLineContextProps>({
  employees: [],
  allocations: [],
  customer: {},
  setAllocationsData: () => {},
  setCustomerData: () => {},
  setEmployeesData: () => {},
});

const TimeLineContextProvider = ({ children }: TimeLineContextProviderProps) => {
  const [employees, setEmployees] = useState<ResourceAllocationEmployeeProps[]>([]);
  const [allocations, setAllocations] = useState<ResourceAllocationTimeLineProps[]>([]);
  const [customer, setCustomer] = useState<ResourceAllocationCustomerProps>({});

  const setEmployeesData = (employees: ResourceAllocationEmployeeProps[], type = "SET") => {
    if (type == "SET") {
      setEmployees(employees);
    }
  };
  const setAllocationsData = (allocations: ResourceAllocationTimeLineProps[], type = "SET") => {
    if (type == "SET") {
      setAllocations(allocations);
    }
  };
  const setCustomerData = (customer: ResourceAllocationCustomerProps, type = "SET") => {
    if (type == "SET") {
      setCustomer(customer);
    }
  };

  return (
    <TimeLineContext.Provider
      value={{ employees, allocations, customer, setEmployeesData, setAllocationsData, setCustomerData }}
    >
      {children}
    </TimeLineContext.Provider>
  );
};

export { TimeLineContext, TimeLineContextProvider };
