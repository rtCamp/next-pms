/**
 * External dependencies.
 */
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Tabs } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { FAKE_PROJECTS } from "@/pages/projects/list/fake-data";

import { ProjectDetailHeader } from "./header";
import { AboutThisProject } from "./summary";
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
          tabPanelClassName="overflow-auto"
          className="border-0"
          tabs={TABS}
          tabIndex={activeTab}
          onTabChange={setActiveTab}
        />
        <aside className="w-[352px] shrink-0">
          <AboutThisProject />
        </aside>
      </div>
    </div>
  );
}

export default ProjectDetail;
