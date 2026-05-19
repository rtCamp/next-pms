/**
 * Internal dependencies.
 */
import { ProjectKanbanProvider } from "./provider";
import ProjectKanbanView from "./view";
import ProjectsHeader from "../components/header";
import { ProjectListSubHeader } from "../components/subHeader";

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
