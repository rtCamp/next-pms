/**
 * External dependencies.
 */
import { useOutletContext } from "react-router-dom";

export type AllocationsTeamOutletContext = {
  openAddAllocationDialog: () => void;
  openEditAllocationDialog: () => void;
  openDeleteAllocationDialog: () => void;
};

export function useAllocationsTeamOutletContext() {
  return useOutletContext<AllocationsTeamOutletContext>();
}
