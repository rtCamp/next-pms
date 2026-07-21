/**
 * External dependencies.
 */
import { useLocation, useNavigate } from "react-router-dom";
import { Breadcrumbs, Button } from "@rtcamp/frappe-ui-react";
import { AddSm, SmallDown } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/header";
import { useViews } from "@/providers/views";
import { VIEWS } from "../constants";

type ViewKey = (typeof VIEWS)[number]["key"];

type ProjectsHeaderProps = {
  selectedView: ViewKey;
  openAddProject: () => void;
};

function ProjectsHeader({ selectedView, openAddProject }: ProjectsHeaderProps) {
  const navigate = useNavigate();
  const { search } = useLocation();
  const projectViews = useViews((state) => state.state.views);
  console.log(projectViews);

  const createView = useViews((state) => state.actions.createView);
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
            suffixIcon: <SmallDown className="w-4 h-4" />,
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
                  items: [
                    ...projectViews.map((view) => ({
                      label: view.label,
                      key: view.name,
                      icon: view.icon,
                      onClick: () => null,
                    })),
                    ...VIEWS.map((v) => ({
                      label: v.label,
                      key: v.key,
                      icon: <v.icon className="size-4 mr-2" />,
                      onClick: () => navigate({ pathname: v.path, search }),
                    })),
                  ],
                },
                {
                  group: "",
                  key: "actions-group",
                  items: [
                    {
                      label: "Create View",
                      key: "create-view",
                      icon: <AddSm className="size-4 mr-2" />,
                      onClick: () => createView({ type: "List" }),
                    },
                  ],
                },
              ],
            },
          },
        ]}
      />
      <Button
        variant="solid"
        label="Add project"
        iconLeft={() => <AddSm />}
        onClick={openAddProject}
      />
    </Header>
  );
}

export default ProjectsHeader;
