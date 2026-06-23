/**
 * External dependencies.
 */
import { useSearchParams } from "react-router-dom";
import { mergeClassNames as cn } from "@next-pms/design-system";
import {
  DeleteActionDialog,
  Spinner,
} from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { RISK_DETAIL_PARAM, RISK_VIEW_PARAM } from "./constants";
import type { RiskViewKey } from "./constants";
import { useRisks } from "./context";
import { CreateRiskModal } from "./create-risk";
import { RiskDetailView } from "./detail";
import { RisksHeader } from "./header";
import { RisksKanbanView } from "./kanban/kanbanView";
import { RisksListView } from "./list/listView";
import { RisksProvider } from "./provider";

function RisksContent() {
  const [searchParams] = useSearchParams();
  const riskId = searchParams.get(RISK_DETAIL_PARAM);
  const viewParam = searchParams.get(RISK_VIEW_PARAM);
  const activeView: RiskViewKey = viewParam === "kanban" ? "kanban" : "list";

  const isCreateRiskOpen = useRisks((c) => c.state.isCreateRiskOpen);
  const editRiskName = useRisks((c) => c.state.editRiskName);
  const createRiskInitialStatus = useRisks(
    (c) => c.state.createRiskInitialStatus,
  );
  const deleteRiskName = useRisks((c) => c.state.deleteRiskName);
  const closeCreateRisk = useRisks((c) => c.actions.closeCreateRisk);
  const closeDeleteRisk = useRisks((c) => c.actions.closeDeleteRisk);
  const deleteRisk = useRisks((c) => c.actions.deleteRisk);
  const isLoading = useRisks((c) => c.state.isLoading);

  return (
    <>
      <CreateRiskModal
        open={isCreateRiskOpen}
        onClose={closeCreateRisk}
        riskName={editRiskName}
        initialStatus={createRiskInitialStatus}
      />
      {deleteRiskName && (
        <DeleteActionDialog
          title="Delete risk"
          description="Are you sure you want to delete this risk? This action cannot be undone."
          onClose={closeDeleteRisk}
          onConfirm={() => deleteRisk(deleteRiskName)}
        />
      )}
      {riskId ? (
        <RiskDetailView riskId={riskId} />
      ) : (
        <div className="relative flex flex-col h-full">
          <RisksHeader />
          <div
            className={cn("flex flex-col flex-1 min-h-0", {
              "opacity-50 transition-opacity duration-150": isLoading,
            })}
          >
            {activeView === "kanban" ? <RisksKanbanView /> : <RisksListView />}
          </div>
          {isLoading && (
            <Spinner
              isFull
              className="absolute top-0 left-0 w-full h-full cursor-wait"
            />
          )}
        </div>
      )}
    </>
  );
}

export function RisksTab() {
  return (
    <RisksProvider>
      <RisksContent />
    </RisksProvider>
  );
}
