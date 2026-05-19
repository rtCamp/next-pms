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

export function ProjectDetailHeader({ projectName }: { projectName: string }) {
  const navigate = useNavigate();
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
            label: projectName,
            prefixIcon: <Folder className="size-4" />,
          },
        ]}
      />
    </Header>
  );
}
