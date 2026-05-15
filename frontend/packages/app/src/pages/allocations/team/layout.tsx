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
import { useAllocationModal } from "@/pages/allocations/useAllocationModal";
import { useUser } from "@/providers/user";
import { useAllocationsTeam } from "./context";

function AllocationsTeamLayoutContent() {
  const refresh = useAllocationsTeam(({ actions }) => actions.refresh);
  const { openAddDialog, outletContext, modalProps } =
    useAllocationModal(refresh);
  const { hasRoleAccess } = useUser(({ state }) => ({
    hasRoleAccess: state.hasRoleAccess,
  }));

  return (
    <>
      <Header className="justify-between">
        <AllocationsBreadcrumbs />

        {hasRoleAccess ? (
          <Button
            variant="solid"
            onClick={() => openAddDialog({})}
            label="Add allocation"
            iconLeft={() => <Plus />}
          />
        ) : null}
      </Header>

      <Outlet context={outletContext} />

      <AddAllocationModal {...modalProps} />
    </>
  );
}

function AllocationsTeamLayout() {
  return (
    <AllocationsTeamProvider>
      <AllocationsTeamLayoutContent />
    </AllocationsTeamProvider>
  );
}

export default AllocationsTeamLayout;
