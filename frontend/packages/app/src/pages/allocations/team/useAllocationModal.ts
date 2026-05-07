/**
 * External dependencies.
 */
import { useCallback, useState } from "react";
import type { AllocationCallbackData } from "@next-pms/design-system/components";
import { useToasts } from "@rtcamp/frappe-ui-react";
import { format } from "date-fns";
import { useFrappeDeleteDoc } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import type { AddAllocationInitialValues } from "@/pages/allocations/team/add-allocation/types";
import { useAllocationsTeam } from "./context";
import type { AllocationsTeamOutletContext } from "./outletContext";

export function useAllocationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [variant, setVariant] = useState<"add" | "edit">("add");
  const [initialValues, setInitialValues] = useState<
    AddAllocationInitialValues | undefined
  >(undefined);

  const refresh = useAllocationsTeam(({ actions }) => actions.refresh);
  const toast = useToasts();
  const { deleteDoc } = useFrappeDeleteDoc();

  const openAddDialog = useCallback((data: AllocationCallbackData) => {
    setVariant("add");
    setInitialValues({
      employeeId: data.employeeId,
      fromDate: data.startDate
        ? format(data.startDate, "yyyy-MM-dd")
        : undefined,
      toDate: data.endDate ? format(data.endDate, "yyyy-MM-dd") : undefined,
    });
    setIsOpen(true);
  }, []);

  const openEditDialog = useCallback((data: AllocationCallbackData) => {
    setVariant("edit");
    setInitialValues({
      allocationName: data.allocationId,
      employeeId: data.employeeId,
      projectId: data.projectId,
      customerName: data.customerName,
      fromDate: data.startDate
        ? format(data.startDate, "yyyy-MM-dd")
        : undefined,
      toDate: data.endDate ? format(data.endDate, "yyyy-MM-dd") : undefined,
      hoursPerDay: data.hoursPerDay,
      isBillable: data.billable,
      isTentative: data.tentative,
      note: data.note,
    });
    setIsOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (data: AllocationCallbackData) => {
      if (!data.allocationId) {
        toast.error("Allocation ID not found");
        return;
      }

      try {
        await deleteDoc("Resource Allocation", data.allocationId);
        toast.success("The allocation has been deleted successfully");
        void refresh();
      } catch {
        toast.error("Failed to delete the allocation");
      }
    },
    [deleteDoc, toast, refresh],
  );

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setInitialValues(undefined);
      setVariant("add");
    }
  }, []);

  const handleSuccess = useCallback(() => {
    setIsOpen(false);
    setInitialValues(undefined);
    setVariant("add");
    void refresh();
  }, [refresh]);

  const outletContext: AllocationsTeamOutletContext = {
    openAddAllocationDialog: openAddDialog,
    openEditAllocationDialog: openEditDialog,
    openDeleteAllocationDialog: handleDelete,
  };

  const modalProps = {
    variant,
    open: isOpen,
    onOpenChange: handleOpenChange,
    initialValues,
    onSuccess: handleSuccess,
  };

  return {
    openAddDialog,
    outletContext,
    modalProps,
  };
}
