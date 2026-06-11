/**
 * External dependencies.
 */
import { Outlet, useMatch, useParams, useSearchParams } from "react-router-dom";
import { Tabs } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { useFeedbackAvailability } from "@/hooks/useFeedbackAvailability";
import { ROUTES } from "@/lib/constant";
import { AboutThisProject } from "./about";
import { ProjectDetailHeader } from "./header";
import { ProjectDetailProvider } from "./provider";
import { TAB_KEYS, TABS, type TabKey } from "./tabs";
import { NotesProvider } from "./tabs/notes/provider";

const TAB_PARAM = "tab";
const DEFAULT_TAB: TabKey = TAB_KEYS[0];

function ProjectDetail() {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const editorMatch = useMatch(`${ROUTES.project}/:projectId/notes/*`);
  const { available, isLoading: isAvailabilityLoading } =
    useFeedbackAvailability();

  const paramTab = searchParams.get(TAB_PARAM) as TabKey | null;
  const activeKey: TabKey =
    paramTab && TAB_KEYS.includes(paramTab) ? paramTab : DEFAULT_TAB;
  const activeTab = TAB_KEYS.indexOf(activeKey);

  const handleTabChange = (index: number) => {
    const key = TAB_KEYS[index];
    setSearchParams((prev) => {
      if (!key || key === DEFAULT_TAB) prev.delete(TAB_PARAM);
      else prev.set(TAB_PARAM, key);
      return prev;
    });
  };

  let finalTabs = TABS;
  if (isAvailabilityLoading || !available) {
    finalTabs = TABS.filter((tab) => tab.label !== "Feedback");
  }

  return (
    <ProjectDetailProvider projectId={projectId}>
      <NotesProvider>
        <div className="h-full flex flex-col">
          <ProjectDetailHeader />
          <div className="flex flex-1 min-h-0">
            {editorMatch ? (
              <div className="flex-1 overflow-auto scrollbar-thin">
                <Outlet />
              </div>
            ) : (
              <Tabs
                tabListClassName="h-10"
                tabPanelClassName="overflow-auto scrollbar-thin"
                className="w-3/4 border-0 rounded-none border-r"
                tabs={finalTabs}
                tabIndex={activeTab}
                onTabChange={handleTabChange}
              />
            )}
            <AboutThisProject className="w-1/4" />
          </div>
        </div>
      </NotesProvider>
    </ProjectDetailProvider>
  );
}

export default ProjectDetail;
