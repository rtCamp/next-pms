/**
 * External dependencies.
 */
import { useSearchParams } from "react-router-dom";

/**
 * Internal dependencies.
 */
import { RISK_VIEW_PARAM } from "./constants";
import type { RiskViewKey } from "./constants";
import { RisksHeader } from "./header";
import { RisksKanbanView } from "./kanban/kanbanView";
import { RisksListView } from "./list/listView";
import { RisksProvider } from "./provider";

function RisksContent() {
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get(RISK_VIEW_PARAM);
  const activeView: RiskViewKey = viewParam === "kanban" ? "kanban" : "list";

  return (
    <div className="flex flex-col h-full">
      <RisksHeader />
      {activeView === "kanban" ? <RisksKanbanView /> : <RisksListView />}
    </div>
  );
}

export function RisksTab() {
  return (
    <RisksProvider>
      <RisksContent />
    </RisksProvider>
  );
}
