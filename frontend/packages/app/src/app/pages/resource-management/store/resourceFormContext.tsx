/**
 * External dependencies.
 */
import { useState } from "react";
import { getFormatedStringValue } from "@next-pms/resource-management/utils";
import { createContext } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type {
  AllocationDataProps,
  ContextProviderProps,
  DialogStateProps,
  PermissionProps,
  ResourceFormContextProps,
} from "./types";

const DefaultDialogState: DialogStateProps = { isShowDialog: false, isNeedToEdit: false };
const DefaultAllocationData: AllocationDataProps = {
  employee: "",
  employee_name: "",
  is_billable: false,
  project: "",
  project_name: "",
  customer: "",
  customer_name: "",
  total_allocated_hours: "0",
  hours_allocated_per_day: "0",
  allocation_start_date: "",
  allocation_end_date: "",
  is_tentative: false,
  note: "",
  name: "",
};
const DefaultPermission: PermissionProps = {
  read: false,
  write: false,
  delete: false,
  isNeedToSetPermission: true,
};

const ResourceFormContext = createContext<ResourceFormContextProps>({
  state: {
    dialogState: DefaultDialogState,
    allocationData: DefaultAllocationData,
    permission: DefaultPermission,
  },
  actions: {
    updateDialogState: () => {},
    updateAllocationData: () => {},
    updatePermission: () => {},
    resetState: () => {},
  },
});

const ResourceContextProvider = ({ children }: ContextProviderProps) => {
  const [dialogState, setDialogState] = useState<DialogStateProps>(DefaultDialogState);
  const [allocationData, setAllocationData] = useState<AllocationDataProps>(DefaultAllocationData);
  const [permission, setPermission] = useState<PermissionProps>(DefaultPermission);

  const updateDialogState = (value: DialogStateProps) => {
    setDialogState({ ...dialogState, ...value });
  };

  const updateAllocationData = (updatedData: AllocationDataProps) => {
    setAllocationData((prevData) => ({
      ...prevData,
      employee_name: updatedData.employee_name,
      employee: getFormatedStringValue(updatedData.employee) as string,
      is_billable: updatedData.is_billable,
      project: getFormatedStringValue(updatedData.project) as string,
      project_name: getFormatedStringValue(updatedData.project_name) as string,
      customer: getFormatedStringValue(updatedData.customer) as string,
      customer_name: getFormatedStringValue(updatedData.customer_name) as string,
      total_allocated_hours: updatedData.total_allocated_hours,
      hours_allocated_per_day: updatedData.hours_allocated_per_day,
      is_tentative: updatedData.is_tentative,
      allocation_start_date: getFormatedStringValue(updatedData.allocation_start_date) as string,
      allocation_end_date: getFormatedStringValue(updatedData.allocation_end_date) as string,
      note: updatedData.note,
      name: getFormatedStringValue(updatedData.name) as string,
    }));
  };
  const updatePermission = (value: PermissionProps) => {
    setPermission({ ...permission, ...value, isNeedToSetPermission: false });
  };

  const resetState = () => {
    setDialogState(DefaultDialogState);
    setAllocationData(DefaultAllocationData);
  };

  return (
    <ResourceFormContext.Provider
      value={{
        state: {
          dialogState: dialogState,
          allocationData: allocationData,
          permission: permission,
        },
        actions: {
          updateDialogState: updateDialogState,
          updateAllocationData: updateAllocationData,
          updatePermission: updatePermission,
          resetState: resetState,
        },
      }}
    >
      {children}
    </ResourceFormContext.Provider>
  );
};

export { ResourceFormContext, ResourceContextProvider };
