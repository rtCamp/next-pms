/**
 * External dependencies.
 */
import { useSearchParams } from "react-router-dom";

/**
 * Internal dependencies.
 */
import { RISK_DETAIL_PARAM, RISK_VIEW_PARAM } from "./constants";
import type { RiskViewKey } from "./constants";
import { useRisks } from "./context";
import { CreateRiskModal } from "./create-risk";
import { DeleteRiskDialog } from "./deleteRiskDialog";
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

  return (
    <>
      <CreateRiskModal
        open={isCreateRiskOpen}
        onClose={closeCreateRisk}
        riskName={editRiskName}
        initialStatus={createRiskInitialStatus}
      />
      {deleteRiskName && (
        <DeleteRiskDialog riskName={deleteRiskName} onClose={closeDeleteRisk} />
      )}
      {riskId ? (
        <RiskDetailView riskId={riskId} />
      ) : (
        <div className="flex flex-col h-full">
          <RisksHeader />
          {activeView === "kanban" ? <RisksKanbanView /> : <RisksListView />}
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
