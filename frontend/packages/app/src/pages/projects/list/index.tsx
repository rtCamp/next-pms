/**
 * Internal dependencies.
 */
import { ProjectListProvider } from "./provider";
import ProjectListView from "./view";
import ProjectsHeader from "../components/header";
import { ProjectListSubHeader } from "../components/subHeader";

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
