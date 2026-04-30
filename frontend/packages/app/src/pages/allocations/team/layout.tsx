/**
 * External dependencies.
 */
import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import { Button } from "@rtcamp/frappe-ui-react";
import { Plus } from "lucide-react";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/header";
import { AllocationsBreadcrumbs } from "@/pages/allocations/components/allocationsBreadcrumbs";
import AddAllocationModal from "@/pages/allocations/team/add-allocation";
import type { AllocationsTeamOutletContext } from "./outletContext";

function TeamTimesheetLayout() {
  const [isAddAllocationOpen, setIsAddAllocationOpen] = useState(false);

  const handleAddAllocation = useCallback(() => {
    setIsAddAllocationOpen(true);
  }, []);

  const handleEditAllocation = useCallback(() => {
    // TODO: wire up edit modal
  }, []);

  const handleDeleteAllocation = useCallback(() => {
    // TODO: wire up delete modal
  }, []);

  return (
    <>
      <Header className="justify-between">
        <AllocationsBreadcrumbs />

        <Button
          variant="solid"
          onClick={handleAddAllocation}
          label="Add allocation"
          iconLeft={() => <Plus />}
        />
      </Header>

      <Outlet
        context={
          {
            openAddAllocationDialog: handleAddAllocation,
            openEditAllocationDialog: handleEditAllocation,
            openDeleteAllocationDialog: handleDeleteAllocation,
          } satisfies AllocationsTeamOutletContext
        }
      />

      <AddAllocationModal
        open={isAddAllocationOpen}
        onOpenChange={setIsAddAllocationOpen}
      />
    </>
  );
}

export default TeamTimesheetLayout;
