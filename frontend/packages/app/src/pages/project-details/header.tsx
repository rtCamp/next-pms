/**
 * External dependencies.
 */
import { useNavigate } from "react-router-dom";
import { Breadcrumbs } from "@rtcamp/frappe-ui-react";
import { Folder } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/header";
import { ROUTES } from "@/lib/constant";
import { useProjectDetail } from "./context";

export function ProjectDetailHeader() {
  const navigate = useNavigate();
  const projectId = useProjectDetail((s) => s.projectId);
  const projectName = useProjectDetail(
    (s) => s.project?.project_name ?? s.projectId,
  );

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
        ]}
      />
    </Header>
  );
}
