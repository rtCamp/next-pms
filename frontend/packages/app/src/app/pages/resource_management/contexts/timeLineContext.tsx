import { useState, createContext, ReactNode } from "react";

interface TimeLineContextProps {
  employees: [];
  allocations: [];
  customer: object;
  setEmployeesData: (value: [], type: "UPDATE" | "SET" | "APPEND") => void;
  setAllocationsData: (value: [], type: "UPDATE" | "SET" | "APPEND") => void;
  setCustomerData: (value: object, type: "UPDATE" | "SET" | "APPEND") => void;
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
  const [employees, setEmployees] = useState<[]>([]);
  const [allocations, setAllocations] = useState<[]>([]);
  const [customer, setCustomer] = useState<object>({});

  const setEmployeesData = (employees, type = "SET") => {
    if (type == "SET") {
      setEmployees(employees);
    }
  };
  const setAllocationsData = (allocations, type = "SET") => {
    if (type == "SET") {
      setAllocations(allocations);
    }
  };
  const setCustomerData = (customer, type = "SET") => {
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
