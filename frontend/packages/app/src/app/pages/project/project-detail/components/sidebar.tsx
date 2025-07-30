/**
 * External dependencies
 */
import React from "react";

/**
 * Internal dependencies
 */
import Sidebar from "@/app/components/sidebar";
import Tags from "@/app/components/tags";
interface ProjectSidebarProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  projectData: any;
  className?: string;
  drawerOpen?: boolean;
  setDrawerOpen?: (open: boolean) => void;
  projectId?: string;
  mutate?: () => void;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  projectData,
  className,
  drawerOpen,
  setDrawerOpen,
  projectId,
  mutate,
}) => {
  return (
    <Sidebar className={className} drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen}>
      <Tags userTags={projectData?._user_tags} doctype="Project" docname={projectId || ""} mutate={mutate} />
    </Sidebar>
  );
};

export default ProjectSidebar;
