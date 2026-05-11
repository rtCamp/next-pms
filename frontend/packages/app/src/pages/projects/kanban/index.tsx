/**
 * External dependencies.
 */
import { useState } from "react";
import { move } from "@dnd-kit/helpers";
import { DragDropProvider } from "@dnd-kit/react";
import { Draggable, Droppable } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { FAKE_PROJECTS } from "../fake-data";
import type { Phase, Project } from "../types";

import { KANBAN_COLUMN_WIDTH, KANBAN_PHASE_ORDER } from "./constants";
import { Header } from "./header";
import { ProjectCard } from "./projectCard";

type ProjectsByPhase = Record<Phase, Project[]>;

function groupByPhase(projects: Project[]): ProjectsByPhase {
  const grouped = Object.fromEntries(
    KANBAN_PHASE_ORDER.map((phase) => [phase, [] as Project[]]),
  ) as ProjectsByPhase;
  for (const project of projects) {
    grouped[project.phase].push(project);
  }
  return grouped;
}

const KanbanView = () => {
  const [items, setItems] = useState<ProjectsByPhase>(() =>
    groupByPhase(FAKE_PROJECTS),
  );

  return (
    <DragDropProvider
      onDragOver={(event) => {
        setItems((current) => move(current, event));
      }}
    >
      <div className="flex gap-10 px-7 pt-5.5 overflow-auto scrollbar-thin">
        {KANBAN_PHASE_ORDER.map((phase) => (
          <Droppable
            key={phase}
            id={phase}
            header={<Header phase={phase} />}
            style={{ width: KANBAN_COLUMN_WIDTH }}
          >
            {items[phase].map((project, index) => (
              <Draggable
                key={project.id}
                id={project.id}
                index={index}
                column={phase}
                className="rounded-2xl"
              >
                <ProjectCard project={project} />
              </Draggable>
            ))}
          </Droppable>
        ))}
      </div>
    </DragDropProvider>
  );
};

export default KanbanView;
