/**
 * External dependencies.
 */
import { useNavigate, useSearchParams } from "react-router-dom";
import { Breadcrumbs } from "@rtcamp/frappe-ui-react";
import { Folder, SmallDown } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/header";
import { ROUTES } from "@/lib/constant";
import { useProjectDetail } from "./context";
import { RISK_VIEW_PARAM, RISK_VIEWS } from "./tabs/risks/constants";
import type { RiskViewKey } from "./tabs/risks/constants";

export function ProjectDetailHeader() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = useProjectDetail((s) => s.projectId);
  const projectName = useProjectDetail(
    (s) => s.project?.project_name ?? s.projectId,
  );

  const isRisksTab = searchParams.get("tab") === "risks";
  const activeView: RiskViewKey =
    searchParams.get(RISK_VIEW_PARAM) === "kanban" ? "kanban" : "list";
  const currentView =
    RISK_VIEWS.find((v) => v.key === activeView) ?? RISK_VIEWS[0];

  const handleViewChange = (key: RiskViewKey) => {
    setSearchParams((prev) => {
      if (key === "list") prev.delete(RISK_VIEW_PARAM);
      else prev.set(RISK_VIEW_PARAM, key);
      return prev;
    });
  };

  return (
    <Header>
      <Breadcrumbs
        items={[
          {
            id: "projects",
            label: "Projects",
            onClick: () => navigate(ROUTES.project),
          },
          {
            id: "project",
            label: projectName || projectId,
            prefixIcon: <Folder className="size-4" />,
            onClick: () =>
              navigate(`${ROUTES.project}/${encodeURIComponent(projectId)}`),
          },
          ...(isRisksTab
            ? [
                {
                  id: "risks-view",
                  label: currentView.label,
                  prefixIcon: <currentView.icon className="size-4" />,
                  suffixIcon: <SmallDown className="w-4 h-4" />,
                  dropdown: {
                    dropdownClassName: "w-[220px] px-1",
                    groupClassName: "px-0 py-1 space-y-1",
                    itemClassName: "text-ink-gray-8 hover:text-ink-gray-7",
                    selectedKey: activeView,
                    selectedGroupKey: "views-group",
                    options: [
                      {
                        group: "",
                        key: "views-group",
                        items: RISK_VIEWS.map((v) => ({
                          label: v.label,
                          key: v.key,
                          icon: <v.icon className="size-4 mr-2" />,
                          onClick: () => handleViewChange(v.key),
                        })),
                      },
                    ],
                  },
                },
              ]
            : []),
        ]}
      />
    </Header>
  );
}
