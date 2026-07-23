/**
 * External dependencies.
 */
import { Button } from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { ViewsProvider } from "@/providers/views/provider";
import { ProjectFilters } from "./components/project-filters";
import { FILTER_PARAM_KEYS } from "./components/project-filters/useProjectFilters";
import ProjectsHeader from "./components/projectsHeader";

function ProjectsPage() {
  return (
    <ViewsProvider doctype="Project" filterParamKeys={FILTER_PARAM_KEYS}>
      <ProjectsHeader label="Projects">
        <Button
          variant="solid"
          label="Add project"
          iconLeft={() => <AddSm />}
          onClick={() => null}
        />
      </ProjectsHeader>
      <ProjectFilters />
    </ViewsProvider>
  );
}

export default ProjectsPage;
