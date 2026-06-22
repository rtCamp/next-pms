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
  const [isAddAllocationOpen, setIsAddAllocationOpen] = useState(false);
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);
  const [variant, setVariant] = useState<"add" | "edit">("add");
  const [addAllocationInitialValues, setAddAllocationInitialValues] = useState<
    AddAllocationInitialValues | undefined
  >(undefined);
  const [editScheduleInitialValues, setEditScheduleInitialValues] = useState<
    EditScheduleInitialValues | undefined
  >(undefined);
  const [onSuccess, setOnSuccess] =
    useState<AllocationCallbackData["onSuccess"]>(undefined);

  const toast = useToasts();
  const { call: deleteAllocation } = useFrappePostCall(
    "next_pms.resource_management.api.allocation.delete_allocation",
  );

  const openAddAllocationDialog = useCallback(
    (data: AllocationCallbackData) => {
      setOnSuccess(() => data.onSuccess);
      setVariant("add");
      setAddAllocationInitialValues({
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
      setIsAddAllocationOpen(true);
    },
    [],
  );

  const openEditAllocationDialog = useCallback(
    (data: AllocationCallbackData) => {
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
      setAddAllocationInitialValues({
        allocationName: data.allocationId,
        employeeId: data.employeeId,
        ...(data.projectId ? { projectId: data.projectId } : {}),
        customer: data.customerName,
        recurrence: data.recurrenceId ? "recurring" : "one-time",
        fromDate: formStartDate
          ? format(formStartDate, "yyyy-MM-dd")
          : undefined,
        toDate: formEndDate ? format(formEndDate, "yyyy-MM-dd") : undefined,
        hoursPerDay:
          isRecurringAllocation && data.allocationHoursPerDay !== undefined
            ? data.allocationHoursPerDay
            : data.hoursPerDay,
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
        isBillable: data.billable,
        isTentative: data.tentative,
        note: data.note,
        override: data.override,
        recurrenceId: data.recurrenceId,
        recurrenceWeekCount: data.recurrenceWeekCount,
        recurrenceSeriesEndDate: data.recurrenceSeriesEndDate
          ? format(data.recurrenceSeriesEndDate, "yyyy-MM-dd")
          : undefined,
      });
      setIsAddAllocationOpen(true);
    },
    [],
  );

  const handleDeleteAllocation = useCallback(
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

  const handleAddAllocationOpenChange = useCallback((open: boolean) => {
    setIsAddAllocationOpen(open);
    if (!open) {
      setAddAllocationInitialValues(undefined);
      setVariant("add");
      setOnSuccess(undefined);
    }
  }, []);

  const handleAddAllocationSuccess = useCallback(
    async (targets?: AllocationRefreshTargets) => {
      await refresh(targets);
      setIsAddAllocationOpen(false);
      setAddAllocationInitialValues(undefined);
      setVariant("add");
      onSuccess?.();
      setOnSuccess(undefined);
    },
    [onSuccess, refresh],
  );

  const handleEditScheduleSuccess = useCallback(
    async (targets?: AllocationRefreshTargets) => {
      await refresh(targets);
      setIsEditScheduleOpen(false);
      setEditScheduleInitialValues(undefined);
    },
    [refresh],
  );

  const outletContext = useMemo<AllocationOutletContext>(
    () => ({
      openAddAllocationDialog: openAddAllocationDialog,
      openEditAllocationDialog: openEditAllocationDialog,
      openDeleteAllocationDialog: handleDeleteAllocation,
    }),
    [openAddAllocationDialog, openEditAllocationDialog, handleDeleteAllocation],
  );

  const addAllocationModalProps = useMemo(
    () => ({
      variant,
      open: isAddAllocationOpen,
      onOpenChange: handleAddAllocationOpenChange,
      initialValues: addAllocationInitialValues,
      onSuccess: handleAddAllocationSuccess,
      onEditScheduleClick: () => {
        setIsAddAllocationOpen(false);
        setEditScheduleInitialValues({
          allocationName: addAllocationInitialValues?.allocationName ?? "",
          employeeId: addAllocationInitialValues?.employeeId,
          projectId: addAllocationInitialValues?.projectId,
          customer: addAllocationInitialValues?.customer,
          rangeStart:
            addAllocationInitialValues?.segmentStartDate ??
            addAllocationInitialValues?.fromDate ??
            "",
          rangeEnd:
            addAllocationInitialValues?.segmentEndDate ??
            addAllocationInitialValues?.toDate ??
            "",
          defaultHoursPerDay:
            addAllocationInitialValues?.segmentHoursPerDay ??
            addAllocationInitialValues?.hoursPerDay ??
            0,
          allocationStartDate: addAllocationInitialValues?.allocationStartDate,
          allocationEndDate: addAllocationInitialValues?.allocationEndDate,
          allocationHoursPerDay:
            addAllocationInitialValues?.allocationHoursPerDay,
          isBillable: addAllocationInitialValues?.isBillable,
          isTentative: addAllocationInitialValues?.isTentative,
          note: addAllocationInitialValues?.note,
          override: addAllocationInitialValues?.override,
          recurrenceId: addAllocationInitialValues?.recurrenceId,
          recurrenceWeekCount: addAllocationInitialValues?.recurrenceWeekCount,
          recurrenceSeriesEndDate:
            addAllocationInitialValues?.recurrenceSeriesEndDate,
        });
        setIsEditScheduleOpen(true);
      },
    }),
    [
      variant,
      isAddAllocationOpen,
      handleAddAllocationOpenChange,
      addAllocationInitialValues,
      handleAddAllocationSuccess,
    ],
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
    [handleEditScheduleSuccess, isEditScheduleOpen, editScheduleInitialValues],
  );

  return {
    openAddAllocationDialog,
    outletContext,
    addAllocationModalProps,
    editScheduleModalProps,
  };
}
