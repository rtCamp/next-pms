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
import { useToasts } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { pickAllowed, toKebabCase } from "@/lib/utils";

import { useProjectKanban } from "./context";
import type { Phase } from "../types";

import { KANBAN_COLUMN_WIDTH } from "./constants";
import { Header } from "./header";
import { ProjectCard } from "./projectCard";
import type { KanbanProjectItem } from "./types";
import { PHASES } from "../constants";

type ProjectIdsByPhase = Record<Phase, string[]>;

type ProjectDragData = { column: Phase };
type ProjectDraggable = SortableDraggable<ProjectDragData>;
type ProjectDroppable = SortableDroppable<ProjectDragData>;

const emptyGroups = () => {
  return Object.fromEntries(
    PHASES.map((phase) => [phase, [] as string[]]),
  ) as ProjectIdsByPhase;
};

function groupIdsByPhase(
  grouped: Record<string, KanbanProjectItem[]>,
): ProjectIdsByPhase {
  const out = emptyGroups();
  for (const [columnKey, projects] of Object.entries(grouped)) {
    const phase = pickAllowed<Phase>(toKebabCase(columnKey), PHASES);
    if (!phase) continue;
    for (const project of projects) {
      out[phase].push(project.name);
    }
  }
  return out;
}

const KanbanView = () => {
  const data = useProjectKanban((c) => c.state.data);
  const isLoading = useProjectKanban((c) => c.state.isLoading);
  const error = useProjectKanban((c) => c.state.error);

  const updateProjectPhase = useProjectKanban(
    (c) => c.actions.updateProjectPhase,
  );

  const toast = useToasts();

  const [items, setItems] = useState<ProjectIdsByPhase>(emptyGroups);

  const byId = useMemo(() => {
    const map = new Map<string, KanbanProjectItem>();
    for (const projects of Object.values(data.data)) {
      for (const project of projects) {
        map.set(project.name, project);
      }
    }
    return map;
  }, [data]);

  useEffect(() => {
    setItems(groupIdsByPhase(data.data));
  }, [data]);

  if (isLoading || error) {
    return null;
  }

  return (
    <DragDropProvider<ProjectDragData, ProjectDraggable, ProjectDroppable>
      onDragOver={(event) => {
        setItems((current) => move(current, event));
      }}
      onDragEnd={async (operation) => {
        const projectId = operation.operation.source?.id;
        const targetGroup = operation.operation.target?.group;
        const newPhase =
          typeof targetGroup === "string"
            ? pickAllowed<Phase>(targetGroup, PHASES)
            : undefined;
        if (typeof projectId !== "string" || !newPhase) return;

        try {
          await updateProjectPhase(projectId, newPhase);
        } catch {
          setItems(groupIdsByPhase(data.data));
          const project = byId.get(projectId);
          toast.error(
            `Error updating the phase for ${project?.project_name ?? projectId}`,
          );
        }
      }}
    >
      <div className="flex gap-4 px-7 pt-5.5 overflow-auto scrollbar-thin">
        {PHASES.map((phase) => (
          <Droppable
            key={phase}
            id={phase}
            header={<Header phase={phase} />}
            style={{ width: KANBAN_COLUMN_WIDTH }}
          >
            {items[phase].map((id, index) => {
              const project = byId.get(id);
              if (!project) return null;
              return (
                <Draggable
                  key={id}
                  id={project.name}
                  index={index}
                  column={phase}
                  className="rounded-2xl"
                >
                  <ProjectCard project={project} />
                </Draggable>
              );
            })}
          </Droppable>
        ))}
      </div>
    </DragDropProvider>
  );
};

export default KanbanView;
