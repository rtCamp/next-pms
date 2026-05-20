/**
 * External dependencies.
 */
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Tabs } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { AboutThisProject } from "./about";
import { ProjectDetailHeader } from "./header";
import { ProjectDetailProvider } from "./provider";
import { TABS } from "./tabs";

function ProjectDetail() {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <ProjectDetailProvider projectId={projectId}>
      <div className="h-full flex flex-col">
        <ProjectDetailHeader />
        <div className="flex flex-1 min-h-0">
          <Tabs
            tabListClassName="h-10"
            tabPanelClassName="overflow-auto scrollbar-thin"
            className="w-3/4 border-0 rounded-none border-r"
            tabs={TABS}
            tabIndex={activeTab}
            onTabChange={setActiveTab}
          />
          <AboutThisProject className="w-88" />
        </div>
      </div>
    </ProjectDetailProvider>
  );
}

export default ProjectDetail;
