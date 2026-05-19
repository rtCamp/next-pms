/**
 * External dependencies.
 */
import { useOutletContext } from "react-router-dom";
import type { AllocationCallbackData } from "@next-pms/design-system/components";

export type AllocationOutletContext = {
  openAddAllocationDialog: (data: AllocationCallbackData) => void;
  openEditAllocationDialog: (data: AllocationCallbackData) => void;
  openDeleteAllocationDialog: (data: AllocationCallbackData) => void;
};

export function useAllocationOutletContext() {
  return useOutletContext<AllocationOutletContext>();
}
