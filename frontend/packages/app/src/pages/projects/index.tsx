/**
 * External dependencies.
 */
import { Button } from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { ProjectFilters } from "./components/project-filters";
import ProjectsHeader from "./components/projectsHeader";
import { ProjectKanbanProvider } from "./kanban/provider";
import ProjectKanbanView from "./kanban/view";
import { ProjectListProvider } from "./list/provider";
import ProjectListView from "./list/view";
import { ProjectViewsProvider, useProjectViews } from "./views";

function ProjectsPage() {
  return (
    <ProjectViewsProvider>
      <ProjectsHeader label="Projects">
        <Button
          variant="solid"
          label="Add project"
          iconLeft={() => <AddSm />}
          onClick={() => null}
        />
      </ProjectsHeader>
      <ProjectFilters />
      <ProjectViewBody />
    </ProjectViewsProvider>
  );
}

function ProjectViewBody() {
  const activeView = useProjectViews((state) => state.state.activeView);

  if (!activeView) {
    return null;
  }

  if (activeView.type.toLowerCase() === "custom") {
    return (
      <ProjectKanbanProvider>
        <ProjectKanbanView />
      </ProjectKanbanProvider>
    );
  }

  return (
    <ProjectListProvider>
      <ProjectListView />
    </ProjectListProvider>
  );
}

export default ProjectsPage;
