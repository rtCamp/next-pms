/**
 * External dependencies.
 */
import { Tabs } from "@rtcamp/frappe-ui-react";
import { useState } from "react";
import { useParams } from "react-router-dom";

/**
 * Internal dependencies.
 */
import { UnderConstruction } from "@/components/under-construction";
import { FAKE_PROJECTS } from "@/pages/projects/list/fake-data";

import { TABS } from "./constants";
import { ProjectDetailHeader } from "./header";
import { AboutThisProject } from "./summary";

function ProjectDetail() {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const project = FAKE_PROJECTS.find((p) => p.id === projectId);
  const projectName = project?.name ?? projectId;

  const [activeTab, setActiveTab] = useState(0);

  return (
    <>
      <ProjectDetailHeader projectName={projectName} />
      <div className="flex">
        <div className="flex min-w-0 flex-1 flex-col">
          <Tabs
            tabs={TABS.map((t) => ({ label: t.label }))}
            tabIndex={activeTab}
            onTabChange={setActiveTab}
          />
          <UnderConstruction />
        </div>
        <aside className="w-[352px] shrink-0">
          <AboutThisProject />
        </aside>
      </div>
    </>
  );
}

export default ProjectDetail;
