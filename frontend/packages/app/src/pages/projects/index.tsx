/**
 * External dependencies.
 */
import { useCallback, useState } from "react";
import { Button } from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";
import { useSWRConfig } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import AddProjectModal from "./components/add-project";
import type { AddProjectFormValues } from "./components/add-project/schema";
import { ProjectFilters } from "./components/project-filters";
import ProjectsHeader from "./components/projectsHeader";
import { PROJECTS_VIEW_METHOD } from "./constants";
import { ProjectKanbanProvider } from "./kanban/provider";
import ProjectKanbanView from "./kanban/view";
import { ProjectListProvider } from "./list/provider";
import ProjectListView from "./list/view";
import { ProjectViewsProvider, useProjectViews } from "./views";

function ProjectsPage() {
  return (
    <ProjectViewsProvider>
      <ProjectsPageContent />
    </ProjectViewsProvider>
  );
}

function ProjectsPageContent() {
  const activeView = useProjectViews((state) => state.state.activeView);
  const { mutate } = useSWRConfig();

  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [addProjectPrefill, setAddProjectPrefill] = useState<
    Partial<AddProjectFormValues> | undefined
  >(undefined);

  const openAddProject = useCallback(
    (prefill?: Partial<AddProjectFormValues>) => {
      setAddProjectPrefill(prefill);
      setAddProjectOpen(true);
    },
    [],
  );

  const handleAddProjectOpenChange = useCallback((open: boolean) => {
    setAddProjectOpen(open);
    if (!open) {
      setAddProjectPrefill(undefined);
    }
  }, []);

  const refreshProjects = useCallback(() => {
    void mutate((key) => {
      const serialized = typeof key === "string" ? key : JSON.stringify(key);
      return Boolean(serialized?.includes(PROJECTS_VIEW_METHOD));
    });
  }, [mutate]);

  const isKanban = activeView?.type.toLowerCase() === "custom";

  return (
    <>
      <ProjectsHeader label="Projects">
        <Button
          variant="solid"
          label="Add project"
          iconLeft={() => <AddSm />}
          onClick={() => openAddProject()}
        />
      </ProjectsHeader>
      <ProjectFilters />
      {activeView &&
        (isKanban ? (
          <ProjectKanbanProvider>
            <ProjectKanbanView openAddProject={openAddProject} />
          </ProjectKanbanProvider>
        ) : (
          <ProjectListProvider>
            <ProjectListView />
          </ProjectListProvider>
        ))}
      <AddProjectModal
        open={addProjectOpen}
        onOpenChange={handleAddProjectOpenChange}
        prefill={addProjectPrefill}
        onSuccess={refreshProjects}
      />
    </>
  );
}

export default ProjectsPage;
