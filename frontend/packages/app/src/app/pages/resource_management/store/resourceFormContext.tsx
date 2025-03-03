/**
 * External dependencies.
 */
import { createContext, useState } from "react";
import { getFormatedStringValue } from "@next-pms/resource-management/utils";

/**
 * Internal dependencies.
 */
import { AllocationDataProps, ContextProviderProps, PermissionProps } from "./types";

interface DialogStateProps {
  isShowDialog: boolean;
  isNeedToEdit: boolean;
}

interface ResourceFormContextProps {
  dialogState: DialogStateProps;
  allocationData: AllocationDataProps;
  permission: PermissionProps;
  updateDialogState: (value: DialogStateProps) => void;
  updateAllocationData: (value: AllocationDataProps) => void;
  updatePermission: (value: PermissionProps) => void;
  resetState: () => void;
}

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
  note: "",
  name: "",
};
const DedaultPermission: PermissionProps = {
  read: false,
  write: false,
  delete: false,
  isNeedToSetPermission: true,
};

const ResourceFormContext = createContext<ResourceFormContextProps>({
  dialogState: DefaultDialogState,
  allocationData: DefaultAllocationData,
  permission: DedaultPermission,
  updateDialogState: () => {},
  updateAllocationData: () => {},
  updatePermission: () => {},
  resetState: () => {},
});

const ResourceContextProvider = ({ children }: ContextProviderProps) => {
  const [dialogState, setDialogState] = useState<DialogStateProps>(DefaultDialogState);
  const [allocationData, setAllocationData] = useState<AllocationDataProps>(DefaultAllocationData);
  const [permission, setPermission] = useState<PermissionProps>(DedaultPermission);

  const updateDialogState = (value: DialogStateProps) => {
    setDialogState({ ...dialogState, ...value });
  };

  const updateAllocationData = (updatedData: AllocationDataProps) => {
    const oldData = { ...allocationData };
    oldData.employee_name = updatedData.employee_name;
    oldData.employee = getFormatedStringValue(updatedData.employee) as string;
    oldData.is_billable = updatedData.is_billable;
    oldData.project = getFormatedStringValue(updatedData.project) as string;
    oldData.project_name = getFormatedStringValue(updatedData.project_name) as string;
    oldData.customer = getFormatedStringValue(updatedData.customer) as string;
    oldData.customer_name = getFormatedStringValue(updatedData.customer_name) as string;
    oldData.total_allocated_hours = updatedData.total_allocated_hours;
    oldData.hours_allocated_per_day = updatedData.hours_allocated_per_day;
    oldData.allocation_start_date = getFormatedStringValue(updatedData.allocation_start_date) as string;
    oldData.allocation_end_date = getFormatedStringValue(updatedData.allocation_end_date) as string;
    oldData.note = updatedData.note;
    oldData.name = getFormatedStringValue(updatedData.name) as string;
    setAllocationData({ ...allocationData, ...oldData });
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
        dialogState: dialogState,
        allocationData: allocationData,
        permission: permission,
        updateDialogState: updateDialogState,
        updateAllocationData: updateAllocationData,
        updatePermission: updatePermission,
        resetState: resetState,
      }}
    >
      {children}
    </ResourceFormContext.Provider>
  );
};

export { ResourceFormContext, ResourceContextProvider };
