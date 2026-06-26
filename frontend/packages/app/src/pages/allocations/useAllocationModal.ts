/**
 * External dependencies.
 */
import { useCallback, useMemo, useState } from "react";
import type {
  AllocationCallbackData,
  DeleteAllocationMode,
} from "@next-pms/design-system/components";
import { useToasts } from "@rtcamp/frappe-ui-react";
import { format } from "date-fns";
import { useFrappePostCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import type { AddAllocationInitialValues } from "@/pages/allocations/team/add-allocation/types";
import type { EditScheduleInitialValues } from "@/pages/allocations/team/edit-schedule/types";
import type { AllocationOutletContext } from "./allocationOutletContext";
import type { AllocationRefreshTargets } from "./types";

type RefreshAllocations = (targets?: AllocationRefreshTargets) => Promise<void>;

export function useAllocationModal(refresh: RefreshAllocations) {
  const [isOpen, setIsOpen] = useState(false);
  const [variant, setVariant] = useState<"add" | "edit">("add");
  const [initialValues, setInitialValues] = useState<
    AddAllocationInitialValues | undefined
  >(undefined);
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);
  const [editScheduleInitialValues, setEditScheduleInitialValues] = useState<
    EditScheduleInitialValues | undefined
  >(undefined);
  const [onSuccess, setOnSuccess] =
    useState<AllocationCallbackData["onSuccess"]>(undefined);

  const toast = useToasts();
  const { call: deleteAllocation } = useFrappePostCall(
    "next_pms.resource_management.api.allocation.delete_allocation",
  );

  const openAddDialog = useCallback((data: AllocationCallbackData) => {
    setOnSuccess(() => data.onSuccess);
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
    const isRecurringAllocation = Boolean(data.recurrenceId);
    const formStartDate =
      isRecurringAllocation && data.allocationStartDate
        ? data.allocationStartDate
        : data.startDate;
    const formEndDate =
      isRecurringAllocation && data.allocationEndDate
        ? data.allocationEndDate
        : data.endDate;

    setOnSuccess(undefined);
    setVariant("edit");
    setInitialValues({
      allocationName: data.allocationId,
      employeeId: data.employeeId,
      ...(data.projectId ? { projectId: data.projectId } : {}),
      customer: data.customerName,
      recurrence: data.recurrenceId ? "recurring" : "one-time",
      fromDate: formStartDate ? format(formStartDate, "yyyy-MM-dd") : undefined,
      toDate: formEndDate ? format(formEndDate, "yyyy-MM-dd") : undefined,
      hoursPerDay:
        isRecurringAllocation && data.allocationHoursPerDay !== undefined
          ? data.allocationHoursPerDay
          : data.hoursPerDay,
      isBillable: data.billable,
      isTentative: data.tentative,
      note: data.note,
      allocationStartDate: data.allocationStartDate
        ? format(data.allocationStartDate, "yyyy-MM-dd")
        : undefined,
      allocationEndDate: data.allocationEndDate
        ? format(data.allocationEndDate, "yyyy-MM-dd")
        : undefined,
      allocationHoursPerDay: data.allocationHoursPerDay,
      segmentStartDate: data.segmentStartDate
        ? format(data.segmentStartDate, "yyyy-MM-dd")
        : data.startDate
          ? format(data.startDate, "yyyy-MM-dd")
          : undefined,
      segmentEndDate: data.segmentEndDate
        ? format(data.segmentEndDate, "yyyy-MM-dd")
        : data.endDate
          ? format(data.endDate, "yyyy-MM-dd")
          : undefined,
      segmentHoursPerDay: data.segmentHoursPerDay ?? data.hoursPerDay,
      override: data.override,
      recurrenceId: data.recurrenceId,
    });
    setIsOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (data: AllocationCallbackData, deleteMode: DeleteAllocationMode) => {
      if (!data.allocationId) {
        toast.error("Allocation ID not found");
        return;
      }

      try {
        await deleteAllocation({
          name: data.allocationId,
          delete_mode: deleteMode,
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
      setOnSuccess(undefined);
    }
  }, []);

  const handleSuccess = useCallback(
    async (targets?: AllocationRefreshTargets) => {
      await refresh(targets);
      setIsOpen(false);
      setInitialValues(undefined);
      setVariant("add");
      onSuccess?.();
      setOnSuccess(undefined);
    },
    [onSuccess, refresh],
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
      onEditScheduleClick: () => {
        setIsOpen(false);
        setEditScheduleInitialValues({
          allocationName: initialValues?.allocationName ?? "",
          employeeId: initialValues?.employeeId,
          projectId: initialValues?.projectId,
          customer: initialValues?.customer,
          rangeStart:
            initialValues?.segmentStartDate ?? initialValues?.fromDate ?? "",
          rangeEnd:
            initialValues?.segmentEndDate ?? initialValues?.toDate ?? "",
          defaultHoursPerDay:
            initialValues?.segmentHoursPerDay ??
            initialValues?.hoursPerDay ??
            0,
          allocationStartDate: initialValues?.allocationStartDate,
          allocationEndDate: initialValues?.allocationEndDate,
          allocationHoursPerDay: initialValues?.allocationHoursPerDay,
          isBillable: initialValues?.isBillable,
          isTentative: initialValues?.isTentative,
          note: initialValues?.note,
          override: initialValues?.override,
          recurrenceId: initialValues?.recurrenceId,
        });
        setIsEditScheduleOpen(true);
      },
    }),
    [variant, isOpen, handleOpenChange, initialValues, handleSuccess],
  );

  const handleEditScheduleSuccess = useCallback(
    async (targets?: AllocationRefreshTargets) => {
      await refresh(targets);
      setIsEditScheduleOpen(false);
      setEditScheduleInitialValues(undefined);
    },
    [refresh],
  );

  const editScheduleModalProps = useMemo(
    () => ({
      open: isEditScheduleOpen,
      onOpenChange: (open: boolean) => {
        setIsEditScheduleOpen(open);
        if (!open) {
          setEditScheduleInitialValues(undefined);
        }
      },
      initialValues: editScheduleInitialValues,
      onSuccess: handleEditScheduleSuccess,
    }),
    [isEditScheduleOpen, editScheduleInitialValues, handleEditScheduleSuccess],
  );

  return {
    openAddDialog,
    outletContext,
    modalProps,
    editScheduleModalProps,
  };
}
