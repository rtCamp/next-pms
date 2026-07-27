/**
 * External dependencies.
 */
import { type PropsWithChildren } from "react";
import { useSearchParams } from "react-router-dom";
import { Spinner } from "@next-pms/design-system/components";
import { Breadcrumbs } from "@rtcamp/frappe-ui-react";
import { AddSm, SmallDown } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/header";
import type { View } from "@/types";
import { useProjectViews } from "../views";

type ProjectsHeaderProps = PropsWithChildren<{
  label: string;
}>;

function renderViewIcon(icon: View["icon"], className: string) {
  if (!icon || typeof icon === "string") {
    return icon;
  }
  const Icon = icon;
  return <Icon className={className} />;
}

function ProjectsHeader({ label, children }: ProjectsHeaderProps) {
  const [searchParams] = useSearchParams();
  const defaultViews = useProjectViews((state) => state.state.defaultViews);
  const savedViews = useProjectViews((state) => state.state.savedViews);
  const activeView = useProjectViews((state) => state.state.activeView);
  const isLoading = useProjectViews((state) => state.state.isLoading);
  const createView = useProjectViews((state) => state.actions.createView);
  const applyView = useProjectViews((state) => state.actions.applyView);

  if (isLoading || !activeView) {
    return <Spinner isFull />;
  }

  const toViewItem = (view: View) => ({
    label: view.label,
    key: String(view.name),
    icon: renderViewIcon(view.icon, "size-4 mr-2"),
    onClick: () => applyView(view),
  });

  return (
    <Header>
      <Breadcrumbs
        items={[
          { id: "Projects", label },
          {
            id: "view",
            label: activeView.label,
            prefixIcon: renderViewIcon(activeView.icon, "size-4"),
            suffixIcon: <SmallDown className="w-4 h-4" />,
            dropdown: {
              dropdownClassName: "w-[220px] px-1",
              groupClassName: "px-0 py-1 space-y-1",
              itemClassName: "text-ink-gray-8 hover:text-ink-gray-7",
              selectedKey: String(activeView.name),
              options: [
                {
                  group: "",
                  key: "views-group",
                  items: defaultViews.map(toViewItem),
                },
                ...(savedViews.length > 0
                  ? [
                      {
                        group: "Saved Views",
                        key: "saved-views-group",
                        items: savedViews.map(toViewItem),
                      },
                    ]
                  : []),
                {
                  group: "",
                  key: "actions-group",
                  items: [
                    {
                      label: "Create View",
                      key: "create-view",
                      icon: <AddSm className="size-4 mr-2" />,
                      onClick: () =>
                        createView({
                          type: "List",
                          filters: Object.fromEntries(
                            [...searchParams.entries()].filter(
                              ([key]) => key !== "view",
                            ),
                          ),
                        }),
                    },
                  ],
                },
              ],
            },
          },
        ]}
      />
      {children}
    </Header>
  );
}

export default ProjectsHeader;
