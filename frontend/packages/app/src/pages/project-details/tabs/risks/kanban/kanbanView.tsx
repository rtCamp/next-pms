/**
 * External dependencies.
 */
import { useEffect, useMemo, useState } from "react";
import { move } from "@dnd-kit/helpers";
import { DragDropProvider } from "@dnd-kit/react";
import { Draggable, Droppable } from "@next-pms/design-system/components";
import { useToasts } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { RISK_STATUSES } from "../constants";
import { useRisks } from "../context";
import { RiskCard } from "./kanbanCard";
import { KanbanColumnHeader } from "./kanbanColumnHeader";
import { emptyGroups, groupIdsByStatus } from "./utils";
import type { RiskStatus } from "../constants";
import type {
  RiskDragData,
  RiskDraggable,
  RiskDroppable,
  RiskIdsByStatus,
} from "./types";
import type { RiskItem } from "../types";

const KANBAN_COLUMN_WIDTH = 300;

export function RisksKanbanView() {
  const data = useRisks((c) => c.state.data);
  const visibleColumns = useRisks((c) => c.state.visibleColumns);
  const updateRiskStatus = useRisks((c) => c.actions.updateRiskStatus);
  const openCreateRisk = useRisks((c) => c.actions.openCreateRisk);
  const toast = useToasts();

  const [items, setItems] = useState<RiskIdsByStatus>(emptyGroups);

  const byId = useMemo(() => {
    const map = new Map<string, RiskItem>();
    for (const risk of data) {
      map.set(risk.name, risk);
    }
    return map;
  }, [data]);

  useEffect(() => {
    setItems(groupIdsByStatus(data));
  }, [data]);

  return (
    <DragDropProvider<RiskDragData, RiskDraggable, RiskDroppable>
      onDragOver={(event) => {
        setItems((current) => move(current, event));
      }}
      onDragEnd={async (operation) => {
        const riskId = operation.operation.source?.id;
        const targetGroup = operation.operation.target?.group;
        const newStatus =
          typeof targetGroup === "string" &&
          RISK_STATUSES.includes(targetGroup as RiskStatus)
            ? (targetGroup as RiskStatus)
            : undefined;

        if (typeof riskId !== "string" || !newStatus) return;

        try {
          await updateRiskStatus(riskId, newStatus);
        } catch {
          setItems(groupIdsByStatus(data));
          const risk = byId.get(riskId);
          toast.error(
            `Error updating status for ${risk?.risk_category ?? riskId}`,
          );
        }
      }}
    >
      <div className="flex gap-4 pt-4 overflow-auto scrollbar-thin pb-4 h-full">
        {RISK_STATUSES.filter((s) => visibleColumns[s]).map((status) => (
          <Droppable
            key={status}
            id={status}
            header={
              <KanbanColumnHeader status={status} onAdd={openCreateRisk} />
            }
            style={{ width: KANBAN_COLUMN_WIDTH }}
          >
            {items[status].map((id, index) => {
              const risk = byId.get(id);
              if (!risk) return null;
              return (
                <Draggable
                  key={id}
                  id={risk.name}
                  index={index}
                  column={status}
                  className="rounded-xl"
                >
                  <RiskCard risk={risk} />
                </Draggable>
              );
            })}
          </Droppable>
        ))}
      </div>
    </DragDropProvider>
  );
}
