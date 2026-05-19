/**
 * Internal dependencies.
 */
import ProjectsHeader from "../components/header";
import { ProjectListSubHeader } from "../sub-header";
import { ProjectKanbanProvider } from "./provider";
import ProjectKanbanView from "./view";

function ProjectKanbanPage() {
  return (
    <ProjectKanbanProvider>
      <ProjectsHeader selectedView="kanban" openAddProject={() => {}} />
      <ProjectListSubHeader />
      <ProjectKanbanView />
    </ProjectKanbanProvider>
  );
}

export default ProjectKanbanPage;
