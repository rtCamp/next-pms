/**
 * Internal dependencies.
 */
import { useProjectList } from "./context";
import { ProjectListProvider } from "./provider";
import ProjectListView from "./view";
import ProjectsHeader from "../components/header";
import { ProjectListSubHeader } from "../components/subHeader";

function ProjectListPage() {
  return (
    <ProjectListProvider>
      <ProjectListPageContent />
    </ProjectListProvider>
  );
}

function ProjectListPageContent() {
  const openAddProject = useProjectList((c) => c.actions.openAddProjectModal);

  return (
    <>
      <ProjectsHeader selectedView="list" openAddProject={openAddProject} />
      <ProjectListSubHeader />
      <ProjectListView />
    </>
  );
}

export default ProjectListPage;
