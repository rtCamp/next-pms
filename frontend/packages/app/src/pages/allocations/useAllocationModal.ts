/**
 * External dependencies.
 */
import { useCallback, useMemo, useState } from "react";
import type { AllocationCallbackData } from "@next-pms/design-system/components";
import { useToasts } from "@rtcamp/frappe-ui-react";
import { format } from "date-fns";
import { useFrappePostCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import type { AddAllocationInitialValues } from "@/pages/allocations/team/add-allocation/types";
import type { AllocationOutletContext } from "./allocationOutletContext";
import type { AllocationRefreshTargets } from "./types";

type RefreshAllocations = (targets?: AllocationRefreshTargets) => Promise<void>;

export function useAllocationModal(refresh: RefreshAllocations) {
  const [isOpen, setIsOpen] = useState(false);
  const [variant, setVariant] = useState<"add" | "edit">("add");
  const [initialValues, setInitialValues] = useState<
    AddAllocationInitialValues | undefined
  >(undefined);

  const toast = useToasts();
  const { call: deleteAllocation } = useFrappePostCall(
    "next_pms.resource_management.api.allocation.delete_allocation",
  );

  const openAddDialog = useCallback((data: AllocationCallbackData) => {
    setVariant("add");
    setInitialValues({
      ...(data.employeeId ? { employeeId: data.employeeId } : {}),
      ...(data.projectId ? { projectId: data.projectId } : {}),
      ...(data.startDate
        ? { fromDate: format(data.startDate, "yyyy-MM-dd") }
        : {}),
      ...(data.endDate ? { toDate: format(data.endDate, "yyyy-MM-dd") } : {}),
      ...(data.hoursPerDay !== undefined
        ? { hoursPerDay: data.hoursPerDay }
        : {}),
      ...(data.customerName !== undefined
        ? { customer: data.customerName }
        : {}),
    });
    setIsOpen(true);
  }, []);

  const openEditDialog = useCallback((data: AllocationCallbackData) => {
    setVariant("edit");
    setInitialValues({
      allocationName: data.allocationId,
      employeeId: data.employeeId,
      ...(data.projectId ? { projectId: data.projectId } : {}),
      customer: data.customerName,
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
        await deleteAllocation({
          name: data.allocationId,
          delete_mode: "only_this",
        });
        const refreshTargets = {
          ...(data.employeeId ? { employeeIds: [data.employeeId] } : {}),
          ...(data.projectId ? { projectIds: [data.projectId] } : {}),
        };

        await refresh(
          Object.keys(refreshTargets).length > 0 ? refreshTargets : undefined,
        );
        toast.success("The allocation has been deleted successfully");
      } catch {
        toast.error("Failed to delete the allocation");
      }
    },
    [deleteAllocation, toast, refresh],
  );

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setInitialValues(undefined);
      setVariant("add");
    }
  }, []);

  const handleSuccess = useCallback(
    async (targets?: AllocationRefreshTargets) => {
      await refresh(targets);
      setIsOpen(false);
      setInitialValues(undefined);
      setVariant("add");
    },
    [refresh],
  );

  const outletContext = useMemo<AllocationOutletContext>(
    () => ({
      openAddAllocationDialog: openAddDialog,
      openEditAllocationDialog: openEditDialog,
      openDeleteAllocationDialog: handleDelete,
    }),
    [openAddDialog, openEditDialog, handleDelete],
  );

  const modalProps = useMemo(
    () => ({
      variant,
      open: isOpen,
      onOpenChange: handleOpenChange,
      initialValues,
      onSuccess: handleSuccess,
    }),
    [variant, isOpen, handleOpenChange, initialValues, handleSuccess],
  );

  return {
    openAddDialog,
    outletContext,
    modalProps,
  };
}
