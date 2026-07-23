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
import { ProjectViewsProvider } from "./views";

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
    </ProjectViewsProvider>
  );
}

export default ProjectsPage;
