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
import { AllocationsTeamProvider } from "@/pages/allocations/team/provider";
import { UnsavedChangesProvider } from "@/pages/allocations/unsavedChanges/UnsavedChangesProvider";
import { useAllocationModal } from "@/pages/allocations/useAllocationModal";
import { useUser } from "@/providers/user";
import { useAllocationsTeam } from "./context";

function AllocationsTeamLayoutContent() {
  const refresh = useAllocationsTeam(({ actions }) => actions.refresh);
  const { openAddDialog, outletContext, modalProps } =
    useAllocationModal(refresh);
  const { roles } = useUser(({ state }) => ({
    roles: state.roles,
  }));

  return (
    <>
      <Header className="justify-between">
        <AllocationsBreadcrumbs />

        {roles.includes("Projects Manager") ? (
          <Button
            variant="solid"
            onClick={() => openAddDialog({})}
            label="Add allocation"
            iconLeft={() => <Plus />}
          />
        ) : null}
      </Header>

      <Outlet context={outletContext} />

      <AddAllocationModal {...modalProps} layoutVariant="team" />
    </>
  );
}

function AllocationsTeamLayout() {
  return (
    <UnsavedChangesProvider>
      <AllocationsTeamProvider>
        <AllocationsTeamLayoutContent />
      </AllocationsTeamProvider>
    </UnsavedChangesProvider>
  );
}

export default AllocationsTeamLayout;
