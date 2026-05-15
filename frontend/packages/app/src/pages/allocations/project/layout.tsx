/**
 * External dependencies.
 */
import { Outlet } from "react-router-dom";
import { Button } from "@rtcamp/frappe-ui-react";
import { Plus } from "lucide-react";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/header";
import { AllocationsBreadcrumbs } from "@/pages/allocations/components/allocationsBreadcrumbs";
import AddAllocationModal from "@/pages/allocations/team/add-allocation";
import { useAllocationModal } from "@/pages/allocations/useAllocationModal";

function ProjectAllocationsLayout() {
  const refresh = () => Promise.resolve(); // TODO: Replace with actual refresh function from context
  const { openAddDialog, outletContext, modalProps } =
    useAllocationModal(refresh);

  return (
    <>
      <Header className="justify-between">
        <AllocationsBreadcrumbs />

        <Button
          variant="solid"
          onClick={() => openAddDialog({})}
          label="Add allocation"
          iconLeft={() => <Plus />}
        />
      </Header>

      <Outlet context={outletContext} />

      <AddAllocationModal {...modalProps} />
    </>
  );
}

export default ProjectAllocationsLayout;
