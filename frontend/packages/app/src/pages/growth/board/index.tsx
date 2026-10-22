/**
 * External dependencies.
 */
import { useEffect, useMemo, useState } from "react";
import type {
  SortableDraggable,
  SortableDroppable,
} from "@dnd-kit/dom/sortable";
import { move } from "@dnd-kit/helpers";
import { DragDropProvider } from "@dnd-kit/react";
import { Draggable, Droppable } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { canCreate } from "@/lib/utils";
import { GROWTH_DOCTYPE } from "@/pages/project-details/tabs/growth/constants";
import { useGrowth } from "@/pages/project-details/tabs/growth/context";
import { CLOSED_COLUMN_PREFIX, PIPELINE_COLUMN_WIDTH } from "../constants";
import { usePipeline } from "../context";
import type { PipelineInitiative } from "../types";
import { PipelineCard } from "./card";
import { ColumnHeader } from "./columnHeader";

type CardDragData = { column: string };
type CardDraggable = SortableDraggable<CardDragData>;
type CardDroppable = SortableDroppable<CardDragData>;
type NamesByColumn = Record<string, string[]>;

const columnOf = (item: PipelineInitiative) =>
  item.is_closed ? `${CLOSED_COLUMN_PREFIX}${item.closed_status}` : item.status;

export function PipelineBoard() {
  const initiatives = usePipeline((c) => c.state.initiatives);
  const openStatuses = usePipeline((c) => c.state.openStatuses);
  const closedOutcomes = usePipeline((c) => c.state.closedOutcomes);
  const closingStatus = usePipeline((c) => c.state.closingStatus);
  const requestMove = usePipeline((c) => c.actions.requestMove);
  const openCreate = useGrowth((c) => c.actions.openCreate);
  const allowCreate = canCreate(GROWTH_DOCTYPE);

  const byName = useMemo(
    () => new Map(initiatives.map((item) => [item.name, item])),
    [initiatives],
  );
  const grouped = useMemo(() => {
    const columns: NamesByColumn = Object.fromEntries([
      ...openStatuses.map((s) => [s.name, []]),
      ...closedOutcomes.map((s) => [`${CLOSED_COLUMN_PREFIX}${s.name}`, []]),
    ]);
    for (const item of initiatives) {
      columns[columnOf(item)]?.push(item.name);
    }
    return columns;
  }, [initiatives, openStatuses, closedOutcomes]);

  const [items, setItems] = useState<NamesByColumn>(grouped);
  useEffect(() => setItems(grouped), [grouped]);

  const totalOf = (column: string) =>
    (grouped[column] ?? []).reduce(
      (sum, name) => sum + (byName.get(name)?.converted_outcome ?? 0),
      0,
    );

  const renderCards = (column: string, compact?: boolean) =>
    (items[column] ?? []).map((name, index) => {
      const initiative = byName.get(name);
      if (!initiative) return null;
      const card = <PipelineCard initiative={initiative} compact={compact} />;
      return initiative.can_write ? (
        <Draggable
          key={name}
          id={name}
          index={index}
          column={column}
          className="rounded-xl"
        >
          {card}
        </Draggable>
      ) : (
        <div key={name}>{card}</div>
      );
    });

  return (
    <DragDropProvider<CardDragData, CardDraggable, CardDroppable>
      onDragOver={(event) => setItems((current) => move(current, event))}
      onDragEnd={({ operation, canceled }) => {
        setItems(grouped);
        const initiative = byName.get(String(operation.source?.id));
        const target = operation.target;
        if (canceled || !initiative || !target) return;
        const column =
          "group" in target && typeof target.group === "string"
            ? target.group
            : String(target.id);
        if (column === columnOf(initiative)) return;
        if (column.startsWith(CLOSED_COLUMN_PREFIX)) {
          if (!closingStatus) return;
          requestMove({
            initiative,
            status: closingStatus,
            closedStatus: column.slice(CLOSED_COLUMN_PREFIX.length),
          });
          return;
        }
        requestMove({ initiative, status: column, closedStatus: null });
      }}
    >
      <div className="flex flex-1 items-start gap-3 overflow-auto px-5 py-4 scrollbar-thin">
        {openStatuses.map((status) => (
          <Droppable
            key={status.name}
            id={status.name}
            className="min-h-0"
            style={{ width: PIPELINE_COLUMN_WIDTH }}
            header={
              <ColumnHeader
                status={status.name}
                count={grouped[status.name]?.length ?? 0}
                total={totalOf(status.name)}
                onAdd={allowCreate ? () => openCreate(status.name) : undefined}
              />
            }
          >
            {renderCards(status.name)}
          </Droppable>
        ))}
        {closedOutcomes.length > 0 && (
          <section
            aria-label="Closed"
            className="flex shrink-0 flex-col gap-4 rounded-xl bg-surface-gray-1 p-2"
            style={{ width: PIPELINE_COLUMN_WIDTH }}
          >
            {closedOutcomes.map((outcome) => {
              const column = `${CLOSED_COLUMN_PREFIX}${outcome.name}`;
              return (
                <Droppable
                  key={column}
                  id={column}
                  className="min-h-0"
                  header={
                    <ColumnHeader
                      status={outcome.name}
                      count={grouped[column]?.length ?? 0}
                      total={totalOf(column)}
                    />
                  }
                >
                  {renderCards(column, true)}
                </Droppable>
              );
            })}
          </section>
        )}
      </div>
    </DragDropProvider>
  );
}
