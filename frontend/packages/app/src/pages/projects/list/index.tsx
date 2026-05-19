/**
 * Internal dependencies.
 */
import ProjectsHeader from "../components/header";
import { ProjectListSubHeader } from "../sub-header";
import { ProjectListProvider } from "./provider";
import ProjectListView from "./view";

function ProjectListPage() {
  return (
    <ProjectListProvider>
      <ProjectsHeader selectedView="list" openAddProject={() => {}} />
      <ProjectListSubHeader />
      <ProjectListView />
    </ProjectListProvider>
  );
}

export default ProjectListPage;
