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
import { useProjectViews } from "../views";

type ProjectsHeaderProps = PropsWithChildren<{
  label: string;
}>;

function ProjectsHeader({ label, children }: ProjectsHeaderProps) {
  const [searchParams] = useSearchParams();
  const doctype = useProjectViews((state) => state.state.doctype);
  const views = useProjectViews((state) => state.state.views);
  const activeView = useProjectViews((state) => state.state.activeView);
  const isLoading = useProjectViews((state) => state.state.isLoading);
  const createView = useProjectViews((state) => state.actions.createView);
  const applyView = useProjectViews((state) => state.actions.applyView);

  if (isLoading || !activeView) {
    return <Spinner isFull />;
  }

  return (
    <Header>
      <Breadcrumbs
        items={[
          { id: doctype, label },
          {
            id: "view",
            label: activeView.label,
            prefixIcon: activeView.icon,
            suffixIcon: <SmallDown className="w-4 h-4" />,
            dropdown: {
              dropdownClassName: "w-[220px] px-1",
              groupClassName: "px-0 py-1 space-y-1",
              itemClassName: "text-ink-gray-8 hover:text-ink-gray-7",
              selectedKey: String(activeView.name),
              selectedGroupKey: "views-group",
              options: [
                {
                  group: "",
                  key: "views-group",
                  items: [
                    ...views.map((view) => ({
                      label: view.label,
                      key: String(view.name),
                      icon: view.icon,
                      onClick: () => applyView(view),
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
