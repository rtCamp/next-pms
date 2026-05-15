/**
 * External dependencies.
 */
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Tabs } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { FAKE_PROJECTS } from "@/pages/projects/fake-data";

import { AboutThisProject } from "./about";
import { ProjectDetailHeader } from "./header";
import { TABS } from "./tabs";

function ProjectDetail() {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const project = FAKE_PROJECTS.find((p) => p.id === projectId);
  const projectName = project?.name ?? projectId;

  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="h-full flex flex-col">
      <ProjectDetailHeader projectName={projectName} />
      <div className="flex flex-1 min-h-0">
        <Tabs
          tabPanelClassName="overflow-auto pb-50 scrollbar"
          className="w-3/4 border-0 rounded-none border-r"
          tabs={TABS}
          tabIndex={activeTab}
          onTabChange={setActiveTab}
        />
        <AboutThisProject className="w-88" />
      </div>
    </div>
  );
}

export default ProjectDetail;
