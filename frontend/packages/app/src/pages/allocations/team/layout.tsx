/**
 * External dependencies.
 */
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Button } from "@rtcamp/frappe-ui-react";
import { Plus } from "lucide-react";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/header";
import { AllocationsBreadcrumbs } from "@/pages/allocations/components/allocationsBreadcrumbs";
import AddAllocationModal from "@/pages/allocations/team/add-allocation";

function TeamTimesheetLayout() {
  const [isAddAllocationOpen, setIsAddAllocationOpen] = useState(false);

  return (
    <>
      <Header className="justify-between">
        <AllocationsBreadcrumbs />

        <Button
          variant="solid"
          onClick={() => setIsAddAllocationOpen(true)}
          label="Add allocation"
          iconLeft={() => <Plus />}
        />
      </Header>

      <Outlet />

      <AddAllocationModal
        open={isAddAllocationOpen}
        onOpenChange={setIsAddAllocationOpen}
      />
    </>
  );
}

export default TeamTimesheetLayout;
