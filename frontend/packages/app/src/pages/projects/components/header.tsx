/**
 * External dependencies.
 */
import { useLocation, useNavigate } from "react-router-dom";
import { Breadcrumbs, Button } from "@rtcamp/frappe-ui-react";
import { ChevronDown, Plus } from "lucide-react";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/header";
import { VIEWS } from "../constants";

type ViewKey = (typeof VIEWS)[number]["key"];

type ProjectsHeaderProps = {
  selectedView: ViewKey;
  openAddProject: () => void;
};

function ProjectsHeader({ selectedView, openAddProject }: ProjectsHeaderProps) {
  const navigate = useNavigate();
  const { search } = useLocation();
  const activeView = VIEWS.find((v) => v.key === selectedView) ?? VIEWS[0];

  return (
    <Header>
      <Breadcrumbs
        items={[
          { id: "projects", label: "Projects" },
          {
            id: "view",
            label: activeView.label,
            prefixIcon: <activeView.icon className="size-4" />,
            suffixIcon: <ChevronDown className="w-4 h-4" />,
            dropdown: {
              dropdownClassName: "w-[220px] px-1",
              groupClassName: "px-0 py-1 space-y-1",
              itemClassName: "text-ink-gray-8 hover:text-ink-gray-7",
              selectedKey: selectedView,
              selectedGroupKey: "views-group",
              options: [
                {
                  group: "",
                  key: "views-group",
                  items: VIEWS.map((v) => ({
                    label: v.label,
                    key: v.key,
                    icon: <v.icon className="size-4 mr-2" />,
                    onClick: () => navigate({ pathname: v.path, search }),
                  })),
                },
              ],
            },
          },
        ]}
      />
      <Button
        variant="solid"
        label="Add project"
        iconLeft={() => <Plus />}
        onClick={openAddProject}
      />
    </Header>
  );
}

export default ProjectsHeader;
