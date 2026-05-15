/**
 * External dependencies.
 */
import { useOutletContext } from "react-router-dom";
import type { AllocationCallbackData } from "@next-pms/design-system/components";

export type AllocationsTeamOutletContext = {
  openAddAllocationDialog: (data: AllocationCallbackData) => void;
  openEditAllocationDialog: (data: AllocationCallbackData) => void;
  openDeleteAllocationDialog: (data: AllocationCallbackData) => void;
};

export function useAllocationsTeamOutletContext() {
  return useOutletContext<AllocationsTeamOutletContext>();
}
