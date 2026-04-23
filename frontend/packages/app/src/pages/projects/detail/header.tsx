/**
 * External dependencies.
 */
import { Breadcrumbs } from "@rtcamp/frappe-ui-react";
import { Folder } from "@rtcamp/frappe-ui-react/icons";
import { useNavigate } from "react-router-dom";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { Header } from "@/layout/header";

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
