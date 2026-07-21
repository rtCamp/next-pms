/**
 * Internal dependencies.
 */
import { useProjectKanban } from "./context";
import { ProjectKanbanProvider } from "./provider";
import ProjectKanbanView from "./view";
import ProjectsHeader from "../components/header";
import { ProjectFilters } from "../components/project-filters";

function ProjectKanbanPage() {
  return (
    <ProjectKanbanProvider>
      <ProjectKanbanPageContent />
    </ProjectKanbanProvider>
  );
}

function ProjectKanbanPageContent() {
  const openAddProject = useProjectKanban((c) => c.actions.openAddProjectModal);

  return (
    <>
      <ProjectsHeader selectedView="kanban" openAddProject={openAddProject} />
      <ProjectFilters />
      <ProjectKanbanView />
    </>
  );
}

export default ProjectKanbanPage;
