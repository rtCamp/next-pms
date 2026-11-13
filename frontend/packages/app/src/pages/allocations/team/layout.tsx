/**
 * External dependencies.
 */
import { Outlet } from "react-router";
import { Button } from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";
import { SWRConfig } from "swr";

/**
 * Internal dependencies.
 */
import { useCapability } from "@/hooks/useCapability";
import { Header } from "@/layout/header";
import { AllocationsBreadcrumbs } from "@/pages/allocations/components/allocationsBreadcrumbs";
import AddAllocationModal from "@/pages/allocations/team/add-allocation";
import EditScheduleModal from "@/pages/allocations/team/edit-schedule";
import { AllocationsTeamProvider } from "@/pages/allocations/team/provider";
import { UnsavedChangesProvider } from "@/pages/allocations/unsavedChanges/UnsavedChangesProvider";
import { useAllocationModal } from "@/pages/allocations/useAllocationModal";
import { useAllocationsTeam } from "./context";

function AllocationsTeamLayoutContent() {
  const refresh = useAllocationsTeam(({ actions }) => actions.refresh);
  const { openAddDialog, outletContext, modalProps, editScheduleModalProps } =
    useAllocationModal(refresh);
  const canManageAllocations = useCapability("manage_allocations");

  return (
    <>
      <Header className="justify-between">
        <AllocationsBreadcrumbs />

        {canManageAllocations ? (
          <Button
            variant="solid"
            onClick={() => openAddDialog({})}
            label="Add allocation"
            iconLeft={() => <AddSm />}
          />
        ) : null}
      </Header>

      <Outlet context={outletContext} />

      <AddAllocationModal {...modalProps} layoutVariant="team" />
      <EditScheduleModal {...editScheduleModalProps} />
    </>
  );
}

function AllocationsTeamLayout() {
  return (
    <SWRConfig value={{ provider: () => new Map() }}>
      <UnsavedChangesProvider>
        <AllocationsTeamProvider>
          <AllocationsTeamLayoutContent />
        </AllocationsTeamProvider>
      </UnsavedChangesProvider>
    </SWRConfig>
  );
}

export default AllocationsTeamLayout;
